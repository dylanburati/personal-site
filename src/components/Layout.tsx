import React, { useEffect, useState, useCallback } from "react";
import { Header } from "./Header";

export type Theme = "light" | "dark";

export type LayoutProps = {
  navLinks: {
    featherIcon?: string;
    text: string;
    href: string;
  }[];
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

  const toggleTheme = useCallback(
    () => setTheme((b) => (b === "dark" ? "light" : "dark")),
    []
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
        toggleTheme={toggleTheme}
        themeIcon={theme === "dark" ? "Sun" : "Moon"}
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
