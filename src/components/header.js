import PropTypes from 'prop-types';
import React from 'react';
import { useStaticQuery, graphql } from 'gatsby';
import { GitHub, Linkedin, Moon, Sun } from 'react-feather';

const Icon = {
  GitHub,
  Linkedin,
  Moon,
  Sun,
};

function getLinkTextOrIcon(link) {
  const ThisIcon = link.featherIcon ? Icon[link.featherIcon] : null;
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

function Header(props) {
  const data = useStaticQuery(graphql`
    query SiteTitleQuery {
      site {
        siteMetadata {
          title
          externalLinks {
            featherIcon
            text
            href
          }
        }
      }
    }
  `);

  const { title, externalLinks } = data.site.siteMetadata;
  const pageTitle = props.title === '' ? title : props.title;
  let allLinks = props.links.concat(externalLinks);
  const themeIcon = getLinkTextOrIcon({ featherIcon: props.themeIcon });

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
          onClick={props.toggleTheme}
        >
          {themeIcon}
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

Header.propTypes = {
  title: PropTypes.string,
  links: PropTypes.arrayOf(
    PropTypes.shape({
      featherIcon: PropTypes.string,
      text: PropTypes.string.isRequired,
      href: PropTypes.string.isRequired,
    })
  ),
  toggleTheme: PropTypes.func.isRequired,
  themeIcon: PropTypes.string.isRequired,
};

Header.defaultProps = {
  title: ``,
  links: [],
};

export default Header;
