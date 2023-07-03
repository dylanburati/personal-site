import { HelmetProps } from "react-helmet";
import { MDXContent } from "mdx/types";
import { Toc } from "@stefanprobst/rehype-extract-toc";
import * as Post01 from "./puredata_compiler/post.mdx";
import * as Post02 from "./cs2500/post.mdx";

export type PostType = {
  slug: string;
  title: string;
  subtitle: string;
  date: string;
  author: string;
  tags: string[];
  tableOfContents: Toc;
  helmetLinks?: HelmetProps["link"];
  default: MDXContent;
};

const blog: PostType[] = [Post01, Post02];

export default blog;
