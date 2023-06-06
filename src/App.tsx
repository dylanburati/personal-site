import React from "react";
import AboutMe from "./mdx/about-me.mdx";
import { Layout } from "./components/Layout";
import { HeaderImage } from "./components/HeaderImage";
import { ProjectCard } from "./components/ProjectCard";
import { ProjectLinkGroup } from "./components/ProjectLinkGroup";
import { ProjectLink } from "./components/ProjectLink";

export const App = () => {
  return (
    <Layout navLinks={[{ text: "Blog", href: "/blog" }]}>
      <HeaderImage
        src="/assets/header_1440w.jpg"
        srcset="/assets/header_600w.jpg 600w, /assets/header_960w.jpg 960w, /assets/header_1440w.jpg 1440w"
        alt="Sunset at a beach on Cape Cod"
        caption={"Lewis Bay, Hyannis, MA\nJuly 4, 2017"}
      />

      <section className="px-5 mt-10">
        <div className="container mx-auto">
          <h2 className="text-3xl">About me</h2>
          <AboutMe />
        </div>
      </section>
      <section className="px-5 mt-10">
        <div className="container mx-auto">
          <h2 className="text-3xl mb-3">Personal projects</h2>

          <ProjectCard
            title="This site"
            description="Portfolio, blog posts, and a small self-hosted todo list app"
            technologies="Gatsby, React, GraphQL (frontend); Kotlin, PostgreSQL (backend)"
          >
            <ProjectLinkGroup category="Todo App">
              <ProjectLink text="Login" href="/todo" />
            </ProjectLinkGroup>
            <ProjectLinkGroup category="Github">
              <ProjectLink
                text="gatsby-site"
                href="https://github.com/dylanburati/gatsby-site"
              />
              <ProjectLink
                text="jsonbin2"
                href="https://github.com/dylanburati/jsonbin2"
              />
            </ProjectLinkGroup>
          </ProjectCard>
          <ProjectCard
            title="Sampler"
            description="Android app for creating and playing musical instruments from samples"
            technologies="Java, JUnit, AndroidX Room, Python, PureData, Node.js"
          >
            <ProjectLinkGroup category="GitHub">
              <ProjectLink
                text="Sampler"
                href="https://github.com/dylanburati/Sampler"
              />
              <ProjectLink
                text="sampler-exporter"
                href="https://github.com/dylanburati/sampler-exporter"
              />
              <ProjectLink
                text="puredata-compiler"
                href="https://github.com/dylanburati/puredata-compiler"
              />
            </ProjectLinkGroup>
            {/* {generateBlogProjectLinkGroup(data, "Sampler")} */}
          </ProjectCard>
        </div>
      </section>
    </Layout>
  );
};
