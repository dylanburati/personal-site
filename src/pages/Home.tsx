import React, { useMemo } from "react";
import { Layout } from "../components/Layout";
import { SimpleCard } from "../components/SimpleCard";
import { ProjectCard } from "../components/ProjectCard";
import { ProjectLinkGroup } from "../components/ProjectLinkGroup";
import { ProjectLink } from "../components/ProjectLink";
import timeline from '../mdx/timeline';
import site from "../site";

export const Home = () => {
  const sortedTimeline = useMemo(() => timeline.slice().sort((a, b) => a.date < b.date ? 1 : -1), [timeline]);
  return (
    <Layout navLinks={[{ text: "Blog", href: "/blog" }]}>
      <div className="bg-navy-dark nav-extension px-5 py-1.5">
        <div className="container mx-auto">
          <span className="font-mono text-gray-200">{site.subtitle}</span>
        </div>
      </div>

      <section className="px-5 mt-6">
        <div className="container mx-auto">
          <h2 className="text-2xl">Here's what I've been up to...</h2>
          <div className="mt-4">
            <div className="grid gap-x-2 timeline">
              {...sortedTimeline.map(({ title, date, default: Inner }, idx) => {
                let ds = date.slice(0, -3);
                try {
                  const dobj = new Date(date);
                  const format = new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' });
                  ds = format.format(dobj);
                } catch (ignored) {
                }
                return (
                  <React.Fragment key={idx}>
                    <span className="text-sm border-l-2 pl-4 md:border-0 md:pl-0 md:mt-2 md:text-right">{ds}</span>
                    <div className="border-l-2 p-2 entry">
                      <SimpleCard title={title} className="mb-3 px-4 overflow-x-scroll" markdown={true}>
                        <Inner />
                      </SimpleCard>
                    </div>
                  </React.Fragment>
                )
              })}
              
            </div>
          </div>
        </div>
      </section>
      <section className="px-5 mt-10">
        <div className="container mx-auto">
          <h2 className="text-2xl mb-3">Personal projects</h2>

          <ProjectCard
            title="This site"
            description="Portfolio, blog posts, and a small self-hosted todo list app"
            technologies="React, TypeScript (frontend); Kothin, PostgreSQL (backend)"
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
            description="Android app for creating and playing musical instruments from samples."
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
