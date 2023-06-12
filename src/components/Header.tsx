import React from "react";
import { GitHub, Linkedin, Moon, Sun } from "react-feather";
import { Link } from "react-router-dom";
import site from "../site";

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
        style={{ fill: "transparent" }}
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
};

export const Header: React.FC<HeaderProps> = ({
  title,
  theme,
  setTheme,
  links,
}) => {
  const pageTitle = title ? title : site.title;
  const allLinks = [...links, ...site.externalLinks];

  return (
    <nav className="py-3 px-5 bg-navy-dark">
      <div className="container flex items-center mx-auto">
        <Link
          className="font-semibold text-xl text-gray-200 hover:text-white"
          to="/"
        >
          {pageTitle}
        </Link>
        <button
          title="Toggle Theme"
          className="text-gray-400 hover:text-white ml-4"
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
        >
          {theme === "light" ? (
            <Moon className="stroke-current" style={{ fill: "transparent" }} />
          ) : (
            <Sun className="stroke-current" style={{ fill: "transparent" }} />
          )}
        </button>
        <div className="flex-grow"></div>
        {allLinks.map((link) => (
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
};
