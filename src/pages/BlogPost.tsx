import React from "react";
import { Layout } from "../components/Layout";
import { SEO } from "../components/SEO";
import { TocCreator } from "../components/TableOfContents";
import { FundiesLinter } from "../components/FundiesLinter";
import blog from "../mdx/posts";

export type BlogPostProps = {
  postId: string;
};

export const BlogPost: React.FC<BlogPostProps> = ({ postId }) => {
  const post = blog.find((e) => e.slug === postId);
  if (post === undefined) {
    return (
      <Layout className="px-5" navLinks={[{ text: "Blog", href: "/blog" }]}>
        <SEO title="404" />
        <div className="container mx-auto">
          <code>{postId}</code> not found
        </div>
      </Layout>
    );
  }
  const Inner = post.default;

  return (
    <Layout className="px-5" navLinks={[{ text: "Blog", href: "/blog" }]}>
      <SEO title={post.title} />
      <div className="container mx-auto">
        <div className="my-8">
          <h1 className="mb-0">{post.title}</h1>
          <span className="text-pen-lighter">
            {new Date(post.date).toLocaleDateString()}
            <span className="px-3 text-paper-dark text-lg pb-px">|</span>
            {post.author}
          </span>
        </div>
        <div data-md-article="">
          <Inner
            components={{
              TableOfContents: TocCreator(post.tableOfContents),
              FundiesLinter,
            }}
          />
        </div>
      </div>
    </Layout>
  );
};
