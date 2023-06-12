import React from "react";

export type TabsProps = {
  activeTab: number;
  setActiveTab: (i: number) => void;
  items: string[];
  itemClassName?: string;
  className?: string;
};

export const Tabs: React.FC<React.PropsWithChildren<TabsProps>> = ({
  activeTab,
  setActiveTab,
  className,
  items,
  itemClassName,
  children,
}) => {
  return (
    <div>
      <ul className={"flex -mx-1" + (className ? ` ${className}` : "")}>
        {items.map((label, idx) => (
          <li className="mx-1 flex-1" key={idx}>
            <button
              className={
                "inline-block w-full text-center border-accent-200 py-1 px-3 rounded-t" +
                (itemClassName
                  ? ` ${itemClassName}`
                  : " hover:bg-paper-darker") +
                (activeTab === idx ? " border-b" : "")
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
};
