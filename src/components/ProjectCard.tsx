import React from "react";

export type ProjectCardProps = {
  title: string;
  description: string;
  technologies?: string;
  concepts?: string;
};

export const ProjectCard: React.FC<
  React.PropsWithChildren<ProjectCardProps>
> = ({ title, description, technologies, concepts, children }) => (
  <div className="flex flex-col lg:flex-row mb-3 card">
    <div className="lg:flex-basis-2/3 p-5">
      <h3 className="mb-3 text-2xl">{title}</h3>
      <p className="mb-4">{description}</p>
      <p className="mb-4">
        <span className="font-semibold">Technologies used: </span>
        {technologies}
      </p>
      {concepts && (
        <p>
          <span className="font-semibold">Concepts learned: </span>
          {concepts}
        </p>
      )}
    </div>
    <div className="lg:flex-basis-1/3 p-5 border-t-2 lg:border-t-0 lg:border-l-2">
      <div className="flex flex-wrap">{children}</div>
    </div>
  </div>
);
