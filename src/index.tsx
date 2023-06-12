import React from "react";
import { hydrateRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { routes } from "./routes";
import "./css/styles.css";

if ((window as any).IS_DEV) {
  new EventSource("/esbuild").addEventListener("change", () =>
    location.reload()
  );
}
const router = createBrowserRouter(routes);
const el = document.getElementById("root")!;
hydrateRoot(
  el,
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
