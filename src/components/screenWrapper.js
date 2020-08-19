import React, { useEffect, useCallback, useRef } from 'react';

// brand size * line height + v padding
const navRem = 1.25 * 1.5 + 0.75 * 2;

function ScreenWrapper({
  className = '',
  innerClassName = '',
  uncontainerizeNav = false,
  children,
}) {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const main = document.querySelector('main');
    if (!main) return;
    const parentElements = [];
    let parent = main.parentElement;
    while (parent !== null) {
      parentElements.unshift(parent);
      parent = parent.parentElement;
    }
    const resizeRoot = () => {
      parentElements[0].style.height = '100vh';
      setTimeout(() => {
        if (parentElements[0].scrollHeight > window.innerHeight) {
          parentElements[0].style.height = `${window.innerHeight}px`;
        }
      }, 1);
    };
    resizeRoot();
    window.addEventListener('resize', resizeRoot);
    parentElements.slice(1).forEach(el => {
      el.classList.add('h-full');
    });
    main.classList.add('relative');
    main.style.height = `calc(100% - ${navRem}rem - 1px)`;

    return () => {
      parentElements[0].style.height = 'initial';
      window.removeEventListener('resize', resizeRoot);
      parentElements.slice(1).forEach(el => {
        el.classList.remove('h-full');
      });
      main.classList.remove('relative');
      main.style.height = 'unset';
    };
  }, []);
  const ref = useRef();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!uncontainerizeNav) return;
    const el = document.querySelector('nav .container');
    if (!el) return;

    el.classList.remove('container');
    return () => {
      if (el) el.classList.add('container');
    };
  }, [uncontainerizeNav]);

  return (
    <div className={`flex flex-col absolute inset-0 ${className}`} ref={ref}>
      <span id="viewport-log"></span>
      <div className={`flex-1 h-full max-h-full ${innerClassName}`}>
        {children}
      </div>
    </div>
  );
}

export default ScreenWrapper;
