import PropTypes from "prop-types"
import React from "react"
import { useStaticQuery, graphql } from "gatsby"
import { GitHub, Linkedin } from "react-feather";

const Icon = {
  GitHub,
  Linkedin
}

const Header = (props) => {
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
  `)

  const pageTitle = (props.title === '' ? data.site.siteMetadata.title : props.title);
  let allLinks = props.links.concat(data.site.siteMetadata.externalLinks);

  return (
    <nav className="py-3 px-5 bg-navy-dark">
      <div className="container flex items-center mx-auto">
        <a className="font-semibold text-xl text-gray-200" href="/">{pageTitle}</a>
        <div className="flex-grow"></div>
        {allLinks.map(link => {
          const ThisIcon = (link.featherIcon ? Icon[link.text] : null);
          let content;
          if(ThisIcon == null) {
            content = link.text;
          } else {
            content = <ThisIcon className="stroke-current" style={{fill: 'transparent'}} />
          }
          return (
            <a key={link.href} className="text-gray-400 hover:text-white ml-4" href={link.href}>
              {content}
            </a>
          );
        })}
      </div>
    </nav>
  );
}

Header.propTypes = {
  title: PropTypes.string
}

Header.defaultProps = {
  title: ``,
  links: []
}

export default Header
