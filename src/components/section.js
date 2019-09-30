import React from "react"

const Section = ({children, className}) => {
  return (
    <section className={className}>
      <div className="container mx-auto">
        {children}
      </div>
    </section>
  );
}

Section.defaultProps = {
  className: "px-5 mt-10"
}

export default Section;