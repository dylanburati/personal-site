import React from "react";
import { Toc } from "@stefanprobst/rehype-extract-toc";

function TocTree({ entries }: { entries: Toc }) {
  return (
    <ul>
      {entries.map((entry) => (
        <li>
          <a href={`#${entry.id}`}>{entry.value}</a>
          {entry.children && entry.children.length > 0 ? (
            <TocTree entries={entry.children} />
          ) : null}
        </li>
      ))}
    </ul>
  );
}

export function TocCreator(tableOfContents: Toc): React.FC<{}> {
  return () => (
    <div className="table-of-contents max-w-xs shadow-lg p-5 border-paper-dark border rounded">
      <p className="mb-0 font-bold text-sm uppercase">TABLE OF CONTENTS</p>
      <div className="mt-2 mr-5">
        <TocTree entries={tableOfContents} />
      </div>
    </div>
  );
}
