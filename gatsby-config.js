const maybePurgeCss = [];
if(process.env.NODE_ENV === 'production') {
  console.log('Using PurgeCSS');
  maybePurgeCss.push(
    require('@fullhuman/postcss-purgecss')({
      content: [
        `${__dirname}/src/**/*.js`,
        `${__dirname}/src/**/*.md`,
        `${__dirname}/public/index.html`
      ],
      whitelist: [
        'a', 'abbr', 'audio', 'b', 'blockquote', 'body', 'button', 'canvas', 'code',
        'dd', 'details', 'dl', 'embed', 'fieldset', 'figure', 'h1', 'h2', 'h3', 'h4',
        'h5', 'h6', 'hr', 'html', 'iframe', 'img', 'input', 'kbd', 'legend', 'main',
        'object', 'ol', 'optgroup', 'p', 'pre', 'progress', 'samp', 'select', 'small',
        'strong', 'sub', 'summary', 'sup', 'svg', 'table', 'template', 'textarea', 'ul',
        'video'
      ],
      rejected: true,
      defaultExtractor: (content) => (content.match(/[\w-/:]+(?<!:)/g) || [])
    })
  )
}

module.exports = {
  siteMetadata: {
    title: `Dylan Burati`,
    description: `.`,
    author: `@dylanburati`,
    externalLinks: [
      {
        featherIcon: true,
        text: 'GitHub',
        href: 'https://github.com/dylanburati'
      },
      {
        featherIcon: true,
        text: 'Linkedin',
        href: 'https://linkedin.com/in/dylanburati'
      }
    ]
  },
  plugins: [
    `gatsby-plugin-react-helmet`,
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        name: `pages`,
        path: `${__dirname}/src/pages`,
      },
    },
    {
      resolve: `gatsby-transformer-remark`,
      options: {
        plugins: [
          `gatsby-remark-prismjs`
        ]
      }
    },
    {
      resolve: `gatsby-plugin-manifest`,
      options: {
        name: `dylanburati.github.io`,
        start_url: `/`,
        icon: `src/icons/albumart.jpg`,  // This path is relative to the root of the site.
      },
    },
    {
      resolve: `gatsby-plugin-postcss`,
      options: {
        postCssPlugins: [
          require('precss'),
          require('tailwindcss'),
          require('autoprefixer'),
          ...maybePurgeCss
        ]
      }
    }
    // this (optional) plugin enables Progressive Web App + Offline functionality
    // To learn more, visit: https://gatsby.dev/offline
    // `gatsby-plugin-offline`,
  ],
}
