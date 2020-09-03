import React from 'react';
import { useStaticQuery, graphql } from 'gatsby';

import '../css/styles.css';
import Layout from '../components/layout';
import SEO from '../components/seo';
import Section from '../components/section';
import ProjectCard from '../components/projectCard';
import ProjectLinks from '../components/projectLinks';
import NavLink from '../components/navLink';

const HeaderImage = ({ src, srcset, alt, caption }) => (
  <div className="relative">
    <img
      className="object-center object-cover w-full header-image"
      src={src}
      alt={alt}
      srcSet={srcset}
      sizes="100vw"
    />
    <div className="absolute bottom-0 w-full max-h-full overflow-hidden px-5">
      <div className="container mx-auto">
        <p className="pb-6 text-gray-100 text-sm whitespace-pre-wrap">
          {caption}
        </p>
      </div>
    </div>
  </div>
);

function generateBlogProjectLinks(data, tag) {
  const links = data.allMarkdownRemark.edges
    .filter(({ node }) => node.frontmatter.tags.includes(tag))
    .map(({ node }) => (
      <NavLink
        key={node.fields.slug}
        href={node.fields.slug}
        text={node.frontmatter.title}
      />
    ));
  if (links.length === 0) {
    return false;
  }

  return <ProjectLinks category="Blog">{links}</ProjectLinks>;
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
  `);

  const aboutMe = (
    <>
      <p>
        I'm a junior at Northeastern University majoring in Computer Engineering
        and Computer Science. I've been developing side projects for 4 years,
        and I recently completed an 8-month co-op working in education
        technology. I'm interested in continuing with web development as well as
        branching into data science and machine learning.
      </p>
      <p>
        Outside of software, I love to ski, play piano, and take photos like the
        one in the header. I have one album of piano pieces on{' '}
        <a
          className="text-accent hover:text-accent-700 hover:underline"
          href="http://dylanburati.bandcamp.com/album/at-rest-in-a-position-comfortable-for-breathing"
          rel="noreferrer"
        >
          Bandcamp
        </a>
        , which was inspired by{' '}
        <em className="font-medium">Eluvium &ndash; Copia</em> and{' '}
        <em className="font-medium">
          Angelo Badalamenti &ndash; Soundtrack from Twin Peaks
        </em>
        .
      </p>
    </>
  );

  const personalProjects = (
    <>
      <ProjectCard
        title="This site"
        description="Portfolio, blog posts, and a small self-hosted todo list app"
        technologies="Gatsby, React, GraphQL (frontend); Kotlin, PostgresQL (backend)"
      >
        <ProjectLinks category="Todo App">
          <NavLink text="Login" href="/todo" />
        </ProjectLinks>
        <ProjectLinks category="Github">
          <NavLink
            text="gatsby-site"
            href="https://github.com/dylanburati/gatsby-site"
          />
          <NavLink
            text="jsonbin2"
            href="https://github.com/dylanburati/jsonbin2"
          />
        </ProjectLinks>
      </ProjectCard>
      <ProjectCard
        title="Sampler"
        description="Android app for creating and playing musical instruments from samples"
        technologies="Java, JUnit, AndroidX Room, Python, PureData, Node.js"
        concepts="MVC architecture, API design"
      >
        <ProjectLinks category="GitHub">
          <NavLink
            text="Sampler"
            href="https://github.com/dylanburati/Sampler"
          />
          <NavLink
            text="sampler-exporter"
            href="https://github.com/dylanburati/sampler-exporter"
          />
          <NavLink
            text="puredata-compiler"
            href="https://github.com/dylanburati/puredata-compiler"
          />
        </ProjectLinks>
        {generateBlogProjectLinks(data, 'Sampler')}
      </ProjectCard>
    </>
  );

  return (
    <Layout navLinks={[{ text: 'Blog', href: '/blog' }]}>
      <SEO title="Home" />
      <HeaderImage
        src="/assets/header_1440w.jpg"
        srcset="/assets/header_600w.jpg 600w, /assets/header_960w.jpg 960w, /assets/header_1440w.jpg 1440w"
        alt="Sunset at a beach on Cape Cod"
        caption={'Lewis Bay, Hyannis, MA\nJuly 4, 2017'}
      />

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
};

export default IndexPage;
