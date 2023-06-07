import React from 'react';
import { GitHub, Linkedin, Moon, Sun } from 'react-feather';
import site from '../site';
import { Link } from 'react-router-dom';

export type Theme = "light" | "dark";

const IconMap = {
  GitHub,
  Linkedin,
};

export type IconName = keyof typeof IconMap;

export type LinkObject = {
  featherIcon?: IconName;
  text: string;
  href: string;
};

function getLinkTextOrIcon(link: LinkObject): React.ReactNode {
  const ThisIcon = link.featherIcon ? IconMap[link.featherIcon] : null;
  if (ThisIcon == null) {
    return link.text;
  } else {
    return (
      <ThisIcon
        className="stroke-current"
        style={{ fill: 'transparent' }}
        aria-label={link.text}
      />
    );
  }
}

export type HeaderProps = {
  title?: string;
  theme: Theme;
  setTheme: (val: Theme) => void;
  links: LinkObject[];
}

export const Header: React.FC<HeaderProps> = ({ title, theme, setTheme, links }) => {
  const pageTitle = title ? title : site.title;
  const allLinks = [...links, ...site.externalLinks];
  const themeIconClassVisible = "text-gray-400 hover:text-white ml-4";
  const themeIconClassHidden = "text-gray-400 hover:text-white ml-4 hidden";
  const [moonClass, sunClass] = theme === 'light' ? [themeIconClassVisible, themeIconClassHidden] : [themeIconClassHidden, themeIconClassVisible];

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
          className={moonClass}
          onClick={() => setTheme('dark')}
        >
          <Moon
            className="stroke-current"
            style={{ fill: 'transparent' }}
          />
        </button>
        <button
          title="Toggle Theme"
          className={sunClass}
          onClick={() => setTheme('dark')}
        >
          <Sun
            className="stroke-current"
            style={{ fill: 'transparent' }}
          />
        </button>
        <div className="flex-grow"></div>
        {allLinks.map(link => (
          <Link
            key={link.href}
            title={link.text}
            className="text-gray-400 hover:text-white ml-4"
            to={link.href}
          >
            {getLinkTextOrIcon(link)}
          </Link>
        ))}
      </div>
    </nav>
  );
}
