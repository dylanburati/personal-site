import React from 'react';

export type ProjectLinkProps = {
  text: string;
  href: string;
}

export const ProjectLink: React.FC<ProjectLinkProps> = ({ text, href }) => (
  <li>
    <a
      className="block text-sm text-accent hover:text-accent-700 hover:bg-paper-darker py-1 px-1"
      href={href}
    >
      {text}
    </a>
  </li>
);
