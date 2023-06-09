import fs from "node:fs";
import path from "node:path";
import { glob } from "glob";
import { unified } from "unified";
import rehypeParse from "rehype-parse";
import rehypeStringify from "rehype-stringify";
import { insert as hInsert } from "hast-util-insert";

/**
 * Plugin config
 * @typedef {Object} InjectionPluginConfig
 * @property {String} outdir - The result path for the static site
 * @property {String?} basePath - The base URL path where the contents of `outdir` will be accessed (default = "/")
 */

const hAppend = (tree, selector, nodes) =>
  hInsert(tree, selector, nodes, "append");

/**
 * @type {(config: InjectionPluginConfig, metafile: import("esbuild").Metafile) => Promise<void>}
 */
async function transformHtml({ outdir, basePath = "/" }, metafile) {
  const filenames = await glob(path.join(outdir, "**/*.html"));

  /** @type {import('unified').Plugin<[], import('hast').Root>} */
  function rehypeInjectTagsForOutput() {
    return (tree) => {
      hAppend(
        tree,
        "head",
        Object.entries(metafile.outputs).flatMap(([key, _]) => {
          const href = key.replace(outdir, basePath).replace(/^\/*/, "/");
          if (key.endsWith(".js")) {
            return [
              {
                type: "element",
                tagName: "script",
                properties: {
                  defer: "",
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
                  rel: "stylesheet",
                  href,
                },
                children: [],
              },
            ];
          } else {
            return [];
          }
        })
      );
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
        await transformHtml(config, result.metafile);
      });
    }
  },
});
