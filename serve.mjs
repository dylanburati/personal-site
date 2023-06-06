import esbuild from "esbuild";
import mdx from "@mdx-js/esbuild";
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
    mdx(),
    stylePlugin({
      postcss: { plugins: [tailwindcssNesting, tailwindcss, autoprefixer] },
    }),
  ],
});
await Promise.all([
  ctx.watch(),
  ctx.serve({ servedir: "dist", port: 3000 }),
]);
