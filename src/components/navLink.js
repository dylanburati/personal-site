import React from "react";

export default ({text, href}) => (
  <li>
    <a className="block text-sm text-blue-700 hover:text-blue-800 hover:bg-gray-200 py-1 px-1" href={href}>
      {text}
    </a>
  </li>
)