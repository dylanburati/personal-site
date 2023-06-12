import fse from "fs-extra";
import esbuild from "esbuild";
import mdx from "@mdx-js/esbuild";
import remarkGfm from "remark-gfm";
import withSlugs from "rehype-slug";
import withToc from "@stefanprobst/rehype-extract-toc";
import withTocExport from "@stefanprobst/rehype-extract-toc/mdx";
import stylePlugin from "esbuild-style-plugin";
import tailwindcss from "tailwindcss";
import autoprefixer from "autoprefixer";
import ssrPlugin from "./ssr.plugin.mjs";
import manifestPlugin from "./manifest.plugin.mjs";
import injectionPlugin from "./injection.plugin.mjs";

const tailwindcssNesting = (await import("tailwindcss/nesting/index.js"))
  .default;
const options = {
  entryPoints: ["src/index.tsx"],
  outdir: "dist",
  bundle: true,
  metafile: true,
  plugins: [
    ssrPlugin,
    mdx({
      remarkPlugins: [remarkGfm],
      rehypePlugins: [withSlugs, withToc, withTocExport],
    }),
    stylePlugin({
      postcss: { plugins: [tailwindcssNesting, tailwindcss, autoprefixer] },
    }),
    injectionPlugin({ outdir: "dist" }),
  ],
  logLevel: "info",
};
if (process.argv.includes("--dev")) {
  const ctx = await esbuild.context({
    ...options,
    define: {
      "window.IS_DEV": "true",
    },
  });
  await Promise.all([ctx.watch(), ctx.serve({ servedir: "dist", port: 3000 })]);
} else {
  await fse.remove("dist");
  options.plugins.push(
    manifestPlugin({
      outdir: "dist",
      srcIcon: "icon.jpg",
      manifest: {
        name: "Dylan Burati",
        short_name: "Dylan Burati",
        description: "Dylan's personal site and blog",
      },
    })
  );
  const result = await esbuild.build({
    ...options,
    entryNames: "[dir]/[name].[hash]",
    minify: true,
    sourcemap: true,
  });
  await fse.promises.writeFile("meta.json", JSON.stringify(result.metafile))
  await fse.copy("static", "dist");
}
