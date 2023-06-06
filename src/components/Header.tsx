import React from 'react';
import { GitHub, Linkedin, Moon, Sun } from 'react-feather';
import site from '../site';

const IconMap = {
  GitHub,
  Linkedin,
  Moon,
  Sun,
};

function getLinkTextOrIcon(link): React.ReactElement {
  const ThisIcon = link.featherIcon ? IconMap[link.featherIcon] : null;
  if (ThisIcon == null) {
    return link.text;
  } else {
    return (
      <ThisIcon
        className="stroke-current"
        style={{ fill: 'transparent' }}
        title={link.text}
      />
    );
  }
}

export type HeaderProps = {
  title?: string;
  themeIcon: string;
  toggleTheme: () => void;
  links: {
    featherIcon?: string;
    text: string;
    href: string;
  }[];
}

export const Header: React.FC<HeaderProps> = ({ title, themeIcon, toggleTheme, links }) => {
  const pageTitle = title ? title : site.title;
  const allLinks = [...links, ...site.externalLinks];
  const themeIconEl = getLinkTextOrIcon({ featherIcon: themeIcon });

  return (
    <nav className="py-3 px-5 bg-navy-dark">
      <div className="container flex items-center mx-auto">
        <a
          className="font-semibold text-xl text-gray-200 hover:text-white"
          href="/"
        >
          {pageTitle}
        </a>
        <button
          title="Toggle Theme"
          className="text-gray-400 hover:text-white ml-4"
          onClick={toggleTheme}
        >
          {themeIconEl}
        </button>
        <div className="flex-grow"></div>
        {allLinks.map(link => (
          <a
            key={link.href}
            title={link.text}
            className="text-gray-400 hover:text-white ml-4"
            href={link.href}
          >
            {getLinkTextOrIcon(link)}
          </a>
        ))}
      </div>
    </nav>
  );
}
