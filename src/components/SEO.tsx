import React from "react";
import PropTypes from "prop-types";
import Helmet from "react-helmet";
import site from "../site";

export type SEOProps = {
  title: string;
  lang?: string;
  description?: string;
  meta?: JSX.IntrinsicElements["meta"][];
};

export const SEO: React.FC<SEOProps> = ({
  lang = "en",
  meta = [],
  title,
  description,
}) => {
  const metaDescription = description || site.description;

  return (
    <Helmet
      htmlAttributes={{
        lang,
      }}
      title={title}
      titleTemplate={`%s | ${site.title}`}
      meta={[
        {
          charSet: "utf-8",
        },
        {
          name: "viewport",
          content: "width=device-width, initial-scale=1.0",
        },
        {
          name: `description`,
          content: metaDescription,
        },
        ...meta,
      ]}
    />
  );
};
