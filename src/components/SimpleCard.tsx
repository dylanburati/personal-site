import React from "react";

export type SimpleCardProps = {
  title: string;
  className?: string;
  markdown?: boolean;
};

export const SimpleCard: React.FC<
  React.PropsWithChildren<SimpleCardProps>
> = ({ title, className, markdown = false, children }) => (
  <div className={className}>
    {markdown ? (
      <div data-md-snippet="">
        <h3 className="mb-3 text-xl">{title}</h3>
        {children}
      </div>
    ) : (
      <>
        <h3 className="mb-3 text-xl">{title}</h3>
        {children}
      </>
    )}
  </div>
);
