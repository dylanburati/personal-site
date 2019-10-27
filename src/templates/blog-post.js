import React from "react"
import { graphql } from "gatsby"
import rehypeReact from "rehype-react"
import Layout from "../components/layout"
import SEO from "../components/seo"
import FundiesLinterLoadable from "../components/fundiesLinter/loadable"
import TableOfContents from "../components/tocCreator"

import "../css/prism.css"

export default ({ data }) => {
  const post = data.markdownRemark;
  const renderAst = new rehypeReact({
    createElement: React.createElement,
    components: {
      'fundies-linter': FundiesLinterLoadable,
      'table-of-contents': TableOfContents(post.tableOfContents)
    }
  }).Compiler;

  return (
    <Layout className="px-5"
        navLinks={[
          { text: 'Blog', href: '/blog' }
        ]}>
      <SEO title={post.frontmatter.title} />
      <div className="container mx-auto">
        <div className="my-8">
          <h1 className="mb-0">{post.frontmatter.title}</h1>
          <span className="text-gray-700">
            {post.frontmatter.date}<span className="px-3 text-gray-500 text-lg pb-px">|</span>{post.frontmatter.author}
          </span>
        </div>
        <div data-markdown="true">
          {renderAst(post.htmlAst)}
        </div>
      </div>
    </Layout>
  )
}

export const query = graphql`
  query($slug: String!) {
    markdownRemark(fields: { slug: { eq: $slug } }) {
      htmlAst
      tableOfContents(maxDepth: 3)
      frontmatter {
        title
        author
        date(formatString: "MMM DD, YYYY")
      }
    }
  }
`;