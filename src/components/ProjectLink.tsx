import React from "react";
import { Link } from "react-router-dom";

export type ProjectLinkProps = {
  text: string;
  href: string;
  internal?: boolean;
};

export const ProjectLink: React.FC<ProjectLinkProps> = ({
  text,
  href,
  internal = false,
}) => {
  const className =
    "block text-sm text-accent hover:text-accent-700 hover:bg-paper-darker py-1 px-1";
  return (
    <li>
      {internal ? (
        <Link className={className} to={href}>
          {text}
        </Link>
      ) : (
        <a className={className} href={href}>
          {text}
        </a>
      )}
    </li>
  );
};
