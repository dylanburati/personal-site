import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { Layout } from "../components/Layout";
import blog from "../mdx/posts";
import { SEO } from "../components/SEO";

function getColor(n: number): string {
  return [
    "#e53e3e",
    "#dd6b20",
    "#d69e2e",
    "#38a169",
    "#319795",
    "#3182ce",
    "#5a67d8",
    "#805ad5",
  ][(n * 5 + 3) % 8];
}

export type BlogListingProps = {
  date: Date;
  title: string;
  subtitle: string;
  href: string;
  calendarColor: string;
};

const shortFormat = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});
const getShortMonth = (date: Date) =>
  [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ][date.getMonth()];

export const BlogListing: React.FC<BlogListingProps> = ({
  date,
  title,
  subtitle,
  href,
  calendarColor,
}) => {
  const list = shortFormat.formatToParts(date);
  const month =
    list.find(({ type }) => type === "month")?.value ?? getShortMonth(date);
  const day = date.getDate().toString();
  return (
    <div className="flex items-center mb-4">
      <div className="flex flex-col h-full mr-3 mt-px border text-center">
        <div className="w-12 text-sm">{month}</div>
        <div
          className="w-12 flex-grow table"
          style={{ background: calendarColor, minHeight: "2rem" }}
        >
          <span className="table-cell align-middle inline-block text-white">
            {day}
          </span>
        </div>
      </div>
      <div className="flex flex-col flex-1">
        <Link className="hover:underline text-xl font-semibold" to={href}>
          {title}
        </Link>
        <p className="mb-0 text-pen-lighter">{subtitle}</p>
      </div>
    </div>
  );
};

export const Blog = () => {
  const sortedPostData = useMemo(
    () => blog.slice().sort((a, b) => (a.date < b.date ? 1 : -1)),
    [blog]
  );
  const allPostData = sortedPostData.map((post) => {
    return {
      href: `/posts/${post.slug}`,
      title: post.title,
      subtitle: post.subtitle,
      date: new Date(post.date),
    };
  });

  const allPosts: React.ReactElement[] = [];
  allPostData.reduce((acc, cur, i) => {
    const year = cur.date.getFullYear();
    if (cur.date.getFullYear() < acc) {
      allPosts.push(
        <h3 key={year.toString()} className="mb-3 mt-6">
          {year}
        </h3>
      );
    }
    allPosts.push(
      <BlogListing
        key={cur.href}
        href={cur.href}
        title={cur.title}
        date={cur.date}
        calendarColor={getColor(allPostData.length - i)}
        subtitle={cur.subtitle}
      />
    );
    return year;
  }, new Date().getFullYear());

  return (
    <Layout navLinks={[]}>
      <SEO title="Blog" />
      <section className="px-5 mt-6">
        <div className="container mx-auto">
          <h2 className="text-3xl mb-3">Recent Updates</h2>
          {allPosts}
        </div>
      </section>
    </Layout>
  );
};
