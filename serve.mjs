import esbuild from "esbuild";
import mdx from "@mdx-js/esbuild";
import ssrPlugin from "./ssr.plugin.mjs";
import remarkGfm from "remark-gfm";
import withSlugs from "rehype-slug";
import withToc from "@stefanprobst/rehype-extract-toc";
import withTocExport from "@stefanprobst/rehype-extract-toc/mdx";
import stylePlugin from "esbuild-style-plugin";
import tailwindcss from "tailwindcss";
import autoprefixer from "autoprefixer";

const tailwindcssNesting = (await import("tailwindcss/nesting/index.js"))
  .default;
const ctx = await esbuild.context({
  entryPoints: ["src/index.tsx"],
  outdir: "dist",
  bundle: true,
  define: {
    "window.IS_DEV": "true",
  },
  plugins: [
    ssrPlugin,
    mdx({
      remarkPlugins: [remarkGfm],
      rehypePlugins: [withSlugs, withToc, withTocExport],
    }),
    stylePlugin({
      postcss: { plugins: [tailwindcssNesting, tailwindcss, autoprefixer] },
    }),
  ],
});
await Promise.all([ctx.watch(), ctx.serve({ servedir: "dist", port: 3000 })]);
