import fs from "node:fs";
import path from "node:path";
import lockfile from "proper-lockfile";
import React from "react";
import { Helmet, HelmetData } from "react-helmet";
import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import { routes } from "./routes";
import "./css/styles.css";

function html(content: string, helmet: HelmetData): string {
  return `<!DOCTYPE html>
  <html ${helmet.htmlAttributes.toString()}>
    <head>
      ${helmet.title.toString()}
      ${helmet.meta.toString()}
      ${helmet.link.toString()}
      <script type="text/javascript">
        (function() {
          try {
            var initialTheme = localStorage.theme ? localStorage.theme : 'light';
            document.documentElement.dataset.theme = initialTheme;
          } catch(e) {
          }
        })()
      </script>
    </head>
    <body ${helmet.bodyAttributes.toString()}>
      <div id="root">${content}</div>
    </body>
  </html>`;
}

(async () => {
  // @ts-expect-error
  const outDir: string = OUTDIR;
  const unlock = await lockfile.lock(outDir, { lockfilePath: path.join(outDir, "dir.lock") });
  try {
    await Promise.all(
      routes.map(async (route) => {
        const filename = path.join(
          outDir,
          route.path!.replace(/\/$/, ""),
          "index.html"
        );
        const component = <StaticRouter location={route.path!}>{route.element}</StaticRouter>;
        const appHtml = renderToString(component);
        const helmet = Helmet.renderStatic();
        await fs.promises.mkdir(path.dirname(filename), { recursive: true });
        await fs.promises.writeFile(
          filename,
          html(appHtml, helmet)
        );
      })
    );
  } finally {
    await unlock();
  }
})();
