import React from "react"
import { useStaticQuery, graphql } from "gatsby"

import "../css/styles.css"
import Layout from "../components/layout"
import SEO from "../components/seo"
import Section from "../components/section"
import ProjectCard from "../components/projectCard"
import ProjectLinks from "../components/projectLinks"
import NavLink from "../components/navLink"

const HeaderImage = ({src, srcset, alt, caption}) => (
  <div className="relative">
    <img className="object-center object-cover w-full"
        src={src}
        alt={alt}
        srcSet={srcset}
        sizes="100vw"
        style={{filter: "brightness(0.85)", maxHeight: "50vh"}} />
    <div className="absolute bottom-0 w-full max-h-full overflow-hidden px-5">
      <div className="container mx-auto">
        <p className="pb-6 text-gray-100 text-sm whitespace-pre-wrap">{caption}</p>
      </div>
    </div>
  </div>
)

function generateBlogProjectLinks(data, tag) {
  const links = data.allMarkdownRemark.edges
      .filter(({node}) => node.frontmatter.tags.includes(tag))
      .map(({node}) => (
        <NavLink
            key={node.fields.slug}
            href={node.fields.slug}
            text={node.frontmatter.title} />
      ));
  if(links.length === 0) {
    return false;
  }

  return (
    <ProjectLinks category="Blog">
      {links}
    </ProjectLinks>
  );
}

const IndexPage = () => {
  const data = useStaticQuery(graphql`
    query {
      allMarkdownRemark(sort: { fields: [frontmatter___date], order: DESC }) {
        edges {
          node {
            fields {
              slug
            }
            frontmatter {
              title
              tags
            }
          }
        }
      }
    }
  `)

  const aboutMe = (
    <>
      <p>
        I am a sophomore at Northeastern University majoring in Electrical and Computer
        Engineering. My background knowledge comes from developing applications in Java
        (Android and standalone), but my goal is to gain expertise in both software and
        hardware.
      </p>
      <p>
        In 2017, I began listening to a lot more music, and I relearned to play the
        piano. Soon after, I taught myself basic music production, and eventually
        released an album of piano pieces on Bandcamp. I am also an avid skier and
        enjoy taking pictures like the one in the header.
      </p>
    </>
  );

  const personalProjects = (
    <>
      <ProjectCard
          title="Sampler"
          description="Android app for creating and playing musical instruments from samples"
          technologies="Java, JUnit, AndroidX Room, Python, PureData, Node.js"
          concepts="MVC architecture, API design">
        <ProjectLinks category="GitHub">
          <NavLink text="Sampler" href="https://github.com/dylanburati/Sampler" />
          <NavLink text="sampler-exporter" href="https://github.com/dylanburati/sampler-exporter" />
          <NavLink text="puredata-compiler" href="https://github.com/dylanburati/puredata-compiler" />
        </ProjectLinks>
        {generateBlogProjectLinks(data, "Sampler")}
      </ProjectCard>
      <ProjectCard
          title="Relisten"
          description="Web app for ranking albums or songs, and sharing them"
          technologies="JavaScript, Vue.js, HTML, CSS, PHP, SQL, Java,
            WebSockets, Cypress, Apache Solr, Nginx, Let's Encrypt"
          concepts="Continuous integration testing, system administration,
            database administration">
        <ProjectLinks category="GitHub">
          <NavLink text="Relisten" href="https://github.com/dylanburati/relisten" />
          <NavLink text="CNChat" href="https://github.com/dylanburati/CNChat" />
        </ProjectLinks>
        <ProjectLinks category="Relisten">
          <NavLink text="Sign up" href="https://relisten.xyz" />
          <NavLink text="Try it out" href="https://relisten.xyz/dashboard" />
        </ProjectLinks>
        {generateBlogProjectLinks(data, "Relisten")}
      </ProjectCard>
    </>
  );

  return (
    <Layout
        navLinks={[
          { text: 'Blog', href: '/blog' }
        ]}>
      <SEO title="Home" />
      <HeaderImage
          src="/assets/header_1440w.jpg"
          srcset="/assets/header_600w.jpg 600w, /assets/header_960w.jpg 960w, /assets/header_1440w.jpg 1440w"
          alt="Sunset at a beach on Cape Cod"
          caption={"Lewis Bay, Hyannis, MA\nJuly 4, 2017"} />

      <Section>
        <h2 className="text-3xl">About me</h2>
        {aboutMe}
      </Section>
      <Section>
        <h2 className="text-3xl mb-3">Personal Projects</h2>
        {personalProjects}
      </Section>
    </Layout>
  );
}

export default IndexPage
