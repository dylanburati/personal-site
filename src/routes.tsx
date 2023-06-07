import React from "react";
import { RouteObject } from "react-router-dom";
import { Home } from "./pages/Home";
import { Blog } from "./pages/Blog";
import { BlogPost } from "./pages/BlogPost";
import blog from "./mdx/posts";

export const routes: RouteObject[] = [
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/blog",
    element: <Blog />,
  },
  ...blog.map(({ slug }) => ({
    path: `/posts/${slug}`,
    element: <BlogPost postId={slug} />,
  })),
];
