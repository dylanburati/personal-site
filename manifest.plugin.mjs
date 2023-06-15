import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import glob from "glob";
import lodash from "lodash";
import { unified } from "unified";
import rehypeParse from "rehype-parse";
import rehypeMinifyAttributeWhitespace from 'rehype-minify-attribute-whitespace'
import rehypeMinifyCssStyle from 'rehype-minify-css-style'
import rehypeRemoveMetaHttpEquiv from 'rehype-remove-meta-http-equiv'
import rehypeMinifyEnumeratedAttribute from 'rehype-minify-enumerated-attribute'
import rehypeMinifyEventHandler from 'rehype-minify-event-handler'
import rehypeMinifyJavaScriptScript from 'rehype-minify-javascript-script'
import rehypeMinifyJavaScriptUrl from 'rehype-minify-javascript-url'
import rehypeMinifyJsonScript from 'rehype-minify-json-script'
import rehypeMinifyLanguage from 'rehype-minify-language'
import rehypeMinifyMediaAttribute from 'rehype-minify-media-attribute'
import rehypeMinifyMetaColor from 'rehype-minify-meta-color'
import rehypeMinifyMetaContent from 'rehype-minify-meta-content'
import rehypeMinifyStyleAttribute from 'rehype-minify-style-attribute'
import rehypeStringify from "rehype-stringify";
import sharp from "sharp";
import { insert as hInsert } from "hast-util-insert";

// Based on https://github.com/gatsbyjs/gatsby/blob/master/packages/gatsby-plugin-manifest/src/gatsby-node.js
// License: MIT
// Author: Kyle Mathews <mathews.kyle@gmail.com> + contributors
async function generateIcon(outdir, icon, srcIcon) {
  const imgPath = path.join(outdir, icon.src);

  const size = parseInt(icon.sizes.substring(0, icon.sizes.lastIndexOf(`x`)));

  // For vector graphics, instruct sharp to use a pixel density
  // suitable for the resolution we're rasterizing to.
  // For pixel graphics sources this has no effect.
  // Sharp accept density from 1 to 2400
  const density = Math.min(2400, Math.max(1, size));

  return await sharp(srcIcon, { density })
    .resize({
      width: size,
      height: size,
      fit: `contain`,
      background: { r: 255, g: 255, b: 255, alpha: 0 },
    })
    .toFile(imgPath);
}

const defaultFavicons = [
  {
    src: `favicon-32x32.png`,
    sizes: `32x32`,
    type: `image/png`,
  },
];

const defaultIcons = [
  {
    src: `icons/icon-48x48.png`,
    sizes: `48x48`,
    type: `image/png`,
  },
  {
    src: `icons/icon-72x72.png`,
    sizes: `72x72`,
    type: `image/png`,
  },
  {
    src: `icons/icon-96x96.png`,
    sizes: `96x96`,
    type: `image/png`,
  },
  {
    src: `icons/icon-144x144.png`,
    sizes: `144x144`,
    type: `image/png`,
  },
  {
    src: `icons/icon-192x192.png`,
    sizes: `192x192`,
    type: `image/png`,
  },
  {
    src: `icons/icon-256x256.png`,
    sizes: `256x256`,
    type: `image/png`,
  },
  {
    src: `icons/icon-384x384.png`,
    sizes: `384x384`,
    type: `image/png`,
  },
  {
    src: `icons/icon-512x512.png`,
    sizes: `512x512`,
    type: `image/png`,
  },
];

const hashPrimitive = (input) =>
  crypto.createHash(`md5`).update(input).digest(`hex`);

const minifyPlugins = [
  rehypeMinifyAttributeWhitespace,
  rehypeMinifyCssStyle,
  // Do `remove-meta-http-equiv` before `enumerated-attribute`, because the
  // latter might minify things further.
  rehypeRemoveMetaHttpEquiv,
  rehypeMinifyEnumeratedAttribute,
  rehypeMinifyEventHandler,
  rehypeMinifyJavaScriptScript,
  rehypeMinifyJavaScriptUrl,
  rehypeMinifyJsonScript,
  rehypeMinifyLanguage,
  rehypeMinifyMediaAttribute,
  rehypeMinifyMetaColor,
  rehypeMinifyMetaContent,
  rehypeMinifyStyleAttribute,
]

/**
 * Plugin config
 * @typedef {Object} ManifestPluginConfig
 * @property {Object} manifest - The manifest to use. Allowed properties include: name, short_name, description, theme_color, background_color, start_url, scope, orientation, display
 * @property {String} srcIcon - The path to the square image to generate sized icons from
 * @property {String} outdir - The result path for the static site
 * @property {String?} basePath - The base URL path where the contents of `outdir` will be accessed (default = "/")
 * @property {Array<Object>?} favicons - If provided, changes the output location of the favicons
 */

/**
 * @type {(config: ManifestPluginConfig) => Promise<Object>}
 */
async function makeManifest({
  outdir,
  srcIcon,
  manifest: partialManifest,
  favicons,
  basePath = "/",
}) {
  const digest = hashPrimitive(fs.readFileSync(srcIcon));

  const paths = new Set();
  const manifest = lodash.cloneDeep(partialManifest);
  manifest.icons = manifest.icons || defaultIcons;
  manifest.icons.forEach((icon) => {
    const iconPath = path.join(outdir, path.dirname(icon.src));
    if (!paths.has(iconPath)) {
      const exists = fs.existsSync(iconPath);
      if (!exists) {
        fs.mkdirSync(iconPath, { recursive: true });
      }
      paths.add(iconPath);
    }
  });
  const favicons2 = favicons ?? defaultFavicons;
  favicons2.forEach((icon) => {
    const iconPath = path.join(outdir, path.dirname(icon.src));
    if (!paths.has(iconPath)) {
      const exists = fs.existsSync(iconPath);
      if (!exists) {
        fs.mkdirSync(iconPath, { recursive: true });
      }
      paths.add(iconPath);
    }
  });
  for (const icon of [...favicons2, ...manifest.icons]) {
    await generateIcon(outdir, icon, srcIcon);
  }

  manifest.icons = manifest.icons.map((icon) => ({
    ...icon,
    src: `${basePath}${icon.src}?v=${digest}`,
  }));

  if (manifest.start_url) {
    manifest.start_url = path.posix.join(basePath, manifest.start_url);
  }

  fs.writeFileSync(
    path.join(outdir, "manifest.webmanifest"),
    JSON.stringify(manifest)
  );

  manifest.cacheDigest = digest;
  return manifest;
}

const hPrepend = (tree, selector, nodes) =>
  hInsert(tree, selector, nodes, "prepend");

/**
 * @type {(config: ManifestPluginConfig, manifest: Object) => Promise<void>}
 */
async function transformHtml({ outdir, favicons, basePath = "/" }, manifest) {
  let favicons2 = favicons ?? defaultFavicons;
  favicons2 = favicons2.map((icon) => ({
    ...icon,
    src: `${basePath}${icon.src}?v=${manifest.cacheDigest}`,
  }));
  const filenames = glob.sync(path.join(outdir, "**/*.html"));

  /** @type {import('unified').Plugin<[], import('hast').Root>} */
  function rehypeInsertLinks() {
    return (tree) => {
      hPrepend(tree, "head", [
        ...favicons2.map((icon) => ({
          type: "element",
          tagName: "link",
          properties: {
            rel: "icon",
            href: icon.src,
            type: icon.type,
          },
          children: [],
        })),
        {
          type: "element",
          tagName: "link",
          properties: {
            rel: "manifest",
            href: `${basePath}manifest.webmanifest`,
          },
          children: [],
        },
        ...[
          {
            type: "element",
            tagName: "meta",
            properties: {
              name: "theme-color",
              content: manifest.theme_color,
            },
            children: [],
          },
        ].filter(() => manifest.theme_color),
        ...manifest.icons.map((icon) => ({
          type: "element",
          tagName: "link",
          properties: {
            rel: "apple-touch-icon",
            href: icon.src,
            type: icon.type,
          },
          children: [],
        })),
      ]);
    };
  }

  const processor = unified()
    .use(rehypeParse)
    .use(rehypeInsertLinks)
    .use(minifyPlugins)
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

/** @type {(config: ManifestPluginConfig) => import('esbuild').Plugin} */
export default (config) => ({
  name: "manifest",
  setup(build) {
    if (build.initialOptions.platform !== "node") {
      build.onEnd(async (result) => {
        const manifest = await makeManifest(config);
        await transformHtml(config, manifest);
      });
    }
  },
});
