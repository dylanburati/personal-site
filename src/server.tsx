import fs from "node:fs";
import path from "node:path";
import React from "react";
import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import { routes } from "./routes";
import "./css/styles.css";

function html(content: string): string {
  return `<!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link href="/index.css" rel="stylesheet">
      <script type="text/javascript">
        (function() {
          try {
            var initialTheme = localStorage.theme ? localStorage.theme : 'light';
            document.documentElement.dataset.theme = initialTheme;
          } catch(e) {
          }
        })()
      </script>
      <script src="/index.js" defer></script>
    </head>
    <body>
      <div id="root">${content}</div>
    </body>
  </html>`;
}

(async () => {
  await Promise.all(
    routes.map(async (route) => {
      const filename = path.join(
        // @ts-expect-error
        OUTDIR,
        route.path!.replace(/\/$/, ""),
        "index.html"
      );
      const component = <StaticRouter location={route.path!}>{route.element}</StaticRouter>;
      await fs.promises.mkdir(path.dirname(filename), { recursive: true });
      await fs.promises.writeFile(
        filename,
        html(renderToString(component))
      );
    })
  );
})();
