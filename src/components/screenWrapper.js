import React, { useEffect } from 'react';

function ScreenWrapper({ className = '', innerClassName = '', children }) {
  const uncontainerizeNav = !className.split(' ').includes('container');
  useEffect(() => {
    if (!uncontainerizeNav) return;
    const el = document.querySelector('nav .container');
    if (!el) return;

    el.classList.remove('container');
    return () => {
      if (el) el.classList.add('container');
    };
  }, [uncontainerizeNav]);

  // brand size * line height + v padding
  const rem = 1.25 * 1.5 + 0.75 * 2;
  return (
    <div
      className={`relative ${className}`}
      style={{ height: `calc(100vh - ${rem}rem - 1px)` }}
    >
      <div className={`absolute inset-0 ${innerClassName}`}>{children}</div>
    </div>
  );
}

export default ScreenWrapper;
