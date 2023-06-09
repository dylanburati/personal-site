import { generate } from "astring";
import esbuild from "esbuild";

/** @type {import('esbuild').Plugin} */
export default {
  name: "ssr",
  setup(build) {
    build.onEnd(async (result) => {
      await esbuild.build({
        ...build.initialOptions,
        entryPoints: ["src/server.tsx"],
        entryNames: undefined,
        outdir: "dist-cjs",
        platform: "node",
        format: "cjs",
        define: {
          OUTDIR: generate({ type: 'Literal', value: build.initialOptions.outdir }),
        },
        plugins: (build.initialOptions.plugins || []).filter(
          (e) => e.name !== "ssr"
        ),
      });
      await import('./dist-cjs/server.js');
    });
  },
};
