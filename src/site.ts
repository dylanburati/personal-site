import { LinkObject } from "./components/Header";

const externalLinks: LinkObject[] = [
  {
    featherIcon: 'GitHub',
    text: 'GitHub',
    href: 'https://github.com/dylanburati',
  },
  {
    featherIcon: 'Linkedin',
    text: 'LinkedIn',
    href: 'https://linkedin.com/in/dylanburati',
  },
];

export default {
  title: "Dylan Burati",
  subtitle: "Software Engineer",
  description: `My personal website, built with Gatsby`,
  author: `@dylanburati`,
  externalLinks,
};
