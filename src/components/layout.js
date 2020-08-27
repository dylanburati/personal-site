import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import Header from './header';

class Layout extends PureComponent {
  constructor(props) {
    super(props);
    let initialTheme = 'light';
    if (typeof window !== 'undefined' && localStorage.theme) {
      initialTheme = localStorage.theme;
    }
    this.state = {
      theme: initialTheme,
      mounted: false,
    };

    this.applyTheme = this.applyTheme.bind(this);
    this.toggleTheme = this.toggleTheme.bind(this);

    this.applyTheme(this.state.theme);
  }

  componentDidMount() {
    document.documentElement.dataset.mounted = '';
  }

  applyTheme(theme) {
    if (typeof window !== 'undefined') {
      document.documentElement.dataset.theme = theme;
      localStorage.setItem('theme', theme);
    }
  }

  toggleTheme() {
    const theme = this.state.theme === 'dark' ? 'light' : 'dark';
    this.applyTheme(theme);
    this.setState({ theme });
  }

  render() {
    return (
      <>
        <Header
          links={this.props.navLinks}
          toggleTheme={this.toggleTheme}
          themeIcon={this.state.theme === 'dark' ? 'Sun' : 'Moon'}
        />
        <main className={this.props.className}>{this.props.children}</main>
        {!this.props.hideFooter && (
          <footer className="px-5 mt-10">
            <div className="container mx-auto pt-5 pb-10 text-sm parskip-0">
              <p>© Dylan Burati {new Date().getFullYear()}</p>
              <p>
                Built with <a href="https://www.gatsbyjs.org">Gatsby</a>
              </p>
            </div>
          </footer>
        )}
      </>
    );
  }
}

Layout.defaultProps = {
  className: '',
  navLinks: [],
};

Layout.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  navLinks: PropTypes.arrayOf(
    PropTypes.shape({
      featherIcon: PropTypes.string,
      text: PropTypes.string.isRequired,
      href: PropTypes.string.isRequired,
    })
  ),
};

export default Layout;
