"use client";

import { useEffect, useRef, useState } from "react";
import { useEstate } from "./EstateProvider";

type ThemeMode = "auto" | "dark" | "light";

const themeLabels: Record<ThemeMode, string> = {
  auto: "Auto",
  dark: "Dark",
  light: "Light",
};

function ThemeCaretIcon() {
  return (
    <svg className="theme-caret" viewBox="0 0 20 20" aria-hidden="true">
      <path d="m5.75 7.75 4.25 4.5 4.25-4.5" />
    </svg>
  );
}

export function EstateHeader() {
  const { model, counts, visibleUnits } = useEstate();
  const [theme, setTheme] = useState<ThemeMode>("auto");
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);
  const themeMenu = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (theme === "auto") {
      delete document.documentElement.dataset.estateTheme;
      document.documentElement.style.colorScheme = "light dark";
      return;
    }
    document.documentElement.dataset.estateTheme = theme;
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  useEffect(() => {
    const closeMenu = (event: PointerEvent) => {
      if (!themeMenu.current?.contains(event.target as Node))
        setThemeMenuOpen(false);
    };
    document.addEventListener("pointerdown", closeMenu);
    return () => document.removeEventListener("pointerdown", closeMenu);
  }, []);

  return (
    <header className="estate-header">
      <div className="estate-brand">
        <strong>{model.meta.estate}</strong>
        <small>IBEFUN · OGUN STATE · 150 HA PHASE</small>
      </div>
      <div className="estate-tally">
        <span>
          <i className="dot available" />{" "}
          <b>{counts.available.toLocaleString()}</b> Available
        </span>
        <span>
          <i className="dot allocated" />{" "}
          <b>{counts.allocated.toLocaleString()}</b> Allocated
        </span>
        <span>
          <b>{visibleUnits.length.toLocaleString()}</b> Shown
        </span>
        <div className="theme-picker" ref={themeMenu}>
          <button
            className="estate-button"
            type="button"
            aria-haspopup="menu"
            aria-expanded={themeMenuOpen}
            onClick={() => setThemeMenuOpen((open) => !open)}
          >
            <span>{themeLabels[theme]}</span>
            <ThemeCaretIcon />
          </button>
          {themeMenuOpen && (
            <div className="theme-menu" role="menu">
              {(["auto", "dark", "light"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  role="menuitemradio"
                  aria-checked={theme === mode}
                  onClick={() => {
                    setTheme(mode);
                    setThemeMenuOpen(false);
                  }}
                >
                  <span>{themeLabels[mode]}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
