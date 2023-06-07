import React, { useEffect, useState, useCallback } from "react";
import { Header, LinkObject, Theme } from "./Header";

export type LayoutProps = {
  navLinks: LinkObject[];
  className?: string;
  hideFooter?: boolean;
};

export const Layout: React.FC<React.PropsWithChildren<LayoutProps>> = ({
  navLinks,
  className,
  children,
  hideFooter = false,
}) => {
  const [theme, setTheme] = useState<Theme>(() =>
    typeof window !== "undefined" && localStorage.theme === "dark"
      ? "dark"
      : "light"
  );

  useEffect(() => {
    document.documentElement.dataset.mounted = "";

    return () => {
      delete document.documentElement.dataset.mounted;
    };
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      document.documentElement.dataset.theme = theme;
      localStorage.setItem("theme", theme);
    }
  }, [theme]);

  return (
    <>
      <Header
        links={navLinks}
        theme={theme}
        setTheme={setTheme}
      />
      <main className={className}>{children}</main>
      {!hideFooter && (
        <footer className="px-5 mt-10">
          <div className="container mx-auto pt-5 pb-10 text-sm parskip-0">
            <p>© Dylan Burati {new Date().getFullYear()}</p>
          </div>
        </footer>
      )}
    </>
  );
};
