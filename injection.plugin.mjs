import fs from "node:fs";
import path from "node:path";
import lockfile from "proper-lockfile";
import glob from "glob";
import { unified } from "unified";
import rehypeParse from "rehype-parse";
import rehypeStringify from "rehype-stringify";
import isMatch from "lodash/isMatch.js";
import { visit } from "unist-util-visit";

/**
 * Plugin config
 * @typedef {Object} InjectionPluginConfig
 * @property {String} outdir - The result path for the static site
 * @property {String?} basePath - The base URL path where the contents of `outdir` will be accessed (default = "/")
 */

/**
 * @type {(config: InjectionPluginConfig, metafile: import("esbuild").Metafile) => Promise<void>}
 */
async function transformHtml({ outdir, basePath = "/" }, metafile) {
  const filenames = glob.sync(path.join(outdir, "**/*.html"));
  if (filenames.length === 0) {
    throw new Error("No files to transform");
  }
  const newNodes = Object.entries(metafile.outputs).flatMap(([key, _]) => {
    const href = key.replace(outdir, basePath).replace(/^\/*/, "/");
    if (key.endsWith(".js")) {
      return [
        {
          type: "element",
          tagName: "script",
          properties: {
            defer: true,
            src: href,
          },
          children: [],
        },
      ];
    } else if (key.endsWith(".css")) {
      return [
        {
          type: "element",
          tagName: "link",
          properties: {
            rel: ["stylesheet"],
            href,
          },
          children: [],
        },
      ];
    } else {
      return [];
    }
  });

  /** @type {import('unified').Plugin<[], import('hast').Root>} */
  function rehypeInjectTagsForOutput() {
    return (tree) => {
      visit(tree, "element", (node) => {
        if (node.tagName === "head") {
          for (const n of newNodes) {
            if (!node.children.some((existing) => isMatch(existing, n))) {
              node.children.push(n);
            }
          }
        }
      });
    };
  }

  const processor = unified()
    .use(rehypeParse)
    .use(rehypeInjectTagsForOutput)
    .use(rehypeStringify);
  return await Promise.all(
    filenames.map(async (path) => {
      const html = await fs.promises.readFile(path);
      /** @type {import('vfile').VFile} */
      const vfile = await processor.process(html);
      await fs.promises.writeFile(path, vfile.value);
    })
  );
}

/** @type {(config: InjectionPluginConfig) => import('esbuild').Plugin} */
export default (config) => ({
  name: "injection",
  setup(build) {
    if (build.initialOptions.platform !== "node") {
      build.onEnd(async (result) => {
        const unlock = await lockfile.lock(config.outdir, { retries: 30, lockfilePath: path.join(config.outdir, "dir.lock") });
        try {
          await transformHtml(config, result.metafile);
        } finally {
          await unlock();
        }
      });
    }
  },
});
