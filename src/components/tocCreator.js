import React from 'react';

export default function TocCreator(tocHtml) {
  return () => (
    <div className="table-of-contents max-w-xs shadow-lg p-5 border rounded">
      <p className="mb-0 font-bold text-sm uppercase">TABLE OF CONTENTS</p>
      <div
        className="mt-2 mr-5"
        dangerouslySetInnerHTML={{ __html: tocHtml }}
      />
    </div>
  );
}
