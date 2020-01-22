import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
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

const Header = props => {
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

  return <HeaderContent {...props} siteMetadata={data.site.siteMetadata} />;
};

class HeaderContent extends PureComponent {
  constructor(props) {
    super(props);
    const initialTheme =
      typeof window !== 'undefined' && localStorage.theme
        ? localStorage.theme
        : 'light';
    this.state = {
      theme: initialTheme,
    };

    this.applyTheme = this.applyTheme.bind(this);
    this.toggleTheme = this.toggleTheme.bind(this);

    this.applyTheme(this.state.theme);
  }

  applyTheme(theme) {
    if (typeof window !== 'undefined') {
      document.documentElement.dataset.theme = theme;
      localStorage.setItem('theme', theme);
    }
  }

  toggleTheme(event) {
    event.preventDefault();
    const theme = this.state.theme === 'dark' ? 'light' : 'dark';
    this.applyTheme(theme);
    this.setState({ theme });
  }

  render() {
    const { title, externalLinks } = this.props.siteMetadata;
    const pageTitle = this.props.title === '' ? title : this.props.title;
    let allLinks = this.props.links.concat(externalLinks);
    const themeIcon = getLinkTextOrIcon({
      featherIcon: this.state.theme === 'dark' ? 'Sun' : 'Moon',
      text: this.state.theme === 'dark' ? 'Sun' : 'Moon',
    });

    return (
      <nav className="py-3 px-5 bg-navy-dark" onDoubleClick={this.toggleTheme}>
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
            onClick={this.toggleTheme}
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
}

Header.propTypes = {
  title: PropTypes.string,
};

Header.defaultProps = {
  title: ``,
  links: [],
};

export default Header;
