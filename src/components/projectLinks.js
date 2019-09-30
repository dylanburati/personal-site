import React from "react";

export default ({category, children}) => (
  <ul className="mb-3 mr-5 flex-grow max-w-xs">
    <li className="w-full mb-1 border-b">
      <span className="font-bold text-sm uppercase">{category}</span>
    </li>
    {children}
  </ul>
)