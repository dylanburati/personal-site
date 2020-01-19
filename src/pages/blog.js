import React from 'react';
import PropTypes from 'prop-types';
import { useStaticQuery, graphql } from 'gatsby';

import '../css/styles.css';
import Layout from '../components/layout';
import SEO from '../components/seo';
import Section from '../components/section';

function getColor(n) {
  return [
    '#e53e3e',
    '#dd6b20',
    '#d69e2e',
    '#38a169',
    '#319795',
    '#3182ce',
    '#5a67d8',
    '#805ad5',
  ][(n * 5 + 3) % 8];
}

function BlogListing(props) {
  const [month, day] = props.date.split(' ');
  return (
    <div className="flex items-center mb-4">
      <div className="flex flex-col h-full mr-3 mt-px border text-center">
        <div className="w-12 text-sm">{month}</div>
        <div
          className="w-12 flex-grow table"
          style={{ background: props.calendarColor, minHeight: '2rem' }}
        >
          <span className="table-cell align-middle inline-block text-white">
            {day}
          </span>
        </div>
      </div>
      <div className="flex flex-col flex-1">
        <a className="hover:underline text-xl font-semibold" href={props.href}>
          {props.title}
        </a>
        <p className="mb-0 text-gray-700">{props.subtitle}</p>
      </div>
    </div>
  );
}

BlogListing.propTypes = {
  calendarColor: PropTypes.string,
  date: PropTypes.string,
  href: PropTypes.string,
  title: PropTypes.string,
  subtitle: PropTypes.string,
};

const BlogPage = () => {
  const data = useStaticQuery(graphql`
    query {
      allMarkdownRemark(sort: { fields: [frontmatter___date], order: DESC }) {
        edges {
          node {
            fields {
              slug
            }
            frontmatter {
              title
              subtitle
              date(formatString: "MMM DD,YYYY")
            }
          }
        }
      }
    }
  `);

  const allPostData = data.allMarkdownRemark.edges.map(({ node }) => {
    const [date, yearStr] = node.frontmatter.date.split(',');
    return {
      href: node.fields.slug,
      title: node.frontmatter.title,
      date,
      year: parseInt(yearStr, 10),
      subtitle: node.frontmatter.subtitle,
    };
  });

  const allPosts = [];
  allPostData.reduce((acc, cur, i) => {
    if (cur.year < acc) {
      allPosts.push(
        <h3 key={cur.year.toString()} className="mb-3 mt-6">
          {cur.year}
        </h3>
      );
    }
    allPosts.push(
      <BlogListing
        key={cur.href}
        href={cur.href}
        title={cur.title}
        month={cur.month}
        date={cur.date}
        calendarColor={getColor(allPostData.length - i)}
        subtitle={cur.subtitle}
      />
    );
    return cur.year;
  }, new Date().getFullYear());

  return (
    <Layout>
      <SEO title="Blog" />
      <Section className="px-5 mt-6">
        <h2 className="text-3xl mb-3">Recent Updates</h2>
        {allPosts}
      </Section>
    </Layout>
  );
};

export default BlogPage;
