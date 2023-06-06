import esbuild from "esbuild";
import mdx from "@mdx-js/esbuild";
import stylePlugin from "esbuild-style-plugin";
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';

const tailwindcssNesting = (await import("tailwindcss/nesting/index.js"))
  .default;
await esbuild.build({
  entryPoints: ["src/index.tsx"],
  outdir: "dist",
  bundle: true,
  minify: true,
  sourcemap: true,
  plugins: [
    mdx(),
    stylePlugin({
      postcss: { plugins: [tailwindcssNesting, tailwindcss, autoprefixer] },
    }),
  ],
});