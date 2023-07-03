import React from "react";
import { Toc } from "@stefanprobst/rehype-extract-toc";

// mdx, different from React.FC
type FunctionComponent<Props> = (props: Props) => React.JSX.Element | null;

function TocTree({ entries }: { entries: Toc }) {
  return (
    <ul>
      {entries.map((entry, idx) => (
        <li key={idx}>
          <a href={`#${entry.id}`}>{entry.value}</a>
          {entry.children && entry.children.length > 0 ? (
            <TocTree entries={entry.children} />
          ) : null}
        </li>
      ))}
    </ul>
  );
}

export function TocCreator(tableOfContents: Toc): FunctionComponent<{}> {
  return () => (
    <div className="table-of-contents max-w-xs shadow-lg p-5 border-paper-dark border rounded">
      <p className="mb-0 font-bold text-sm uppercase">TABLE OF CONTENTS</p>
      <div className="mt-2 mr-5">
        <TocTree entries={tableOfContents} />
      </div>
    </div>
  );
}
