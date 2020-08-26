import React from 'react';

export function Tabs({
  activeTab,
  setActiveTab,
  className,
  items,
  itemClassName,
  children,
}) {
  return (
    <div>
      <ul className={'flex -mx-1' + (className ? ` ${className}` : '')}>
        {items.map((label, idx) => (
          <li className="mx-1 flex-1" key={idx}>
            <button
              className={
                'inline-block w-full text-center border-accent-200 py-1 px-3' +
                (itemClassName
                  ? ` ${itemClassName}`
                  : 'hover:bg-paper-darker') +
                (activeTab === idx ? ' border-b' : '')
              }
              onClick={() => setActiveTab(idx)}
            >
              {label}
            </button>
          </li>
        ))}
      </ul>
      {children}
    </div>
  );
}
