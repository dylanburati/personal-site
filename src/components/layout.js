/**
 * Layout component that queries for data
 * with Gatsby's useStaticQuery component
 *
 * See: https://www.gatsbyjs.org/docs/use-static-query/
 */

import React from "react"
import PropTypes from "prop-types"

import Header from "./header"

const Layout = ({ children, className, navLinks }) => {
  return (
    <>
      <Header links={navLinks} />
      <main className={className}>{children}</main>
      <footer className="px-5 mt-10">
        <div className="container mx-auto pt-5 pb-10 text-sm parskip-0">
          <p>© Dylan Burati {new Date().getFullYear()}</p>
          <p>Built with <a href="https://www.gatsbyjs.org">Gatsby</a></p>
        </div>
      </footer>
    </>
  )
}

Layout.defaultProps = {
  className: '',
  navLinks: []
}

Layout.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  navLinks: PropTypes.arrayOf(PropTypes.shape({
    featherIcon: PropTypes.bool,
    text: PropTypes.string,
    href: PropTypes.string
  }))
}

export default Layout
