"use client";

import { useEffect, useState } from "react";

type ThemeMode = "system" | "light" | "dark";

const STORAGE_KEY = "fieldkit-theme";

const themes: { value: ThemeMode; label: string; icon: React.ReactNode }[] = [
  {
    value: "system",
    label: "System theme",
    icon: (
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <path d="M8 21h8" />
        <path d="M12 17v4" />
      </svg>
    ),
  },
  {
    value: "light",
    label: "Light theme",
    icon: (
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2" />
        <path d="M12 20v2" />
        <path d="m4.93 4.93 1.41 1.41" />
        <path d="m17.66 17.66 1.41 1.41" />
        <path d="M2 12h2" />
        <path d="M20 12h2" />
        <path d="m6.34 17.66-1.41 1.41" />
        <path d="m19.07 4.93-1.41 1.41" />
      </svg>
    ),
  },
  {
    value: "dark",
    label: "Dark theme",
    icon: (
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
      </svg>
    ),
  },
];

function applyTheme(mode: ThemeMode) {
  const root = document.documentElement;
  let useDark: boolean;

  if (mode === "system") {
    useDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  } else {
    useDark = mode === "dark";
  }

  if (useDark) {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}

export default function ThemeToggle() {
  const [mode, setMode] = useState<ThemeMode>("system");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = window.localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
    if (saved === "system" || saved === "light" || saved === "dark") {
      setMode(saved);
      applyTheme(saved);
    } else {
      applyTheme("system");
    }
  }, []);

  // Listen for system theme changes when in "system" mode
  useEffect(() => {
    if (mode !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => applyTheme("system");
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [mode]);

  if (!mounted) {
    return <div className="h-[30px] w-[94px]" aria-hidden="true" />;
  }

  const activeIndex = themes.findIndex((t) => t.value === mode);

  function selectTheme(value: ThemeMode) {
    setMode(value);
    applyTheme(value);
    window.localStorage.setItem(STORAGE_KEY, value);
  }

  return (
    <div
      className="relative flex items-center rounded-full border border-[var(--border)] bg-[var(--card)] p-[3px]"
      role="radiogroup"
      aria-label="Theme"
    >
      {/* Sliding indicator */}
      <div
        className="absolute top-[3px] left-[3px] h-[24px] w-[28px] rounded-full bg-[var(--accent)] transition-transform duration-200 ease-out"
        style={{ transform: `translateX(${activeIndex * 28}px)` }}
        aria-hidden="true"
      />

      {themes.map(({ value, label, icon }) => (
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={mode === value}
          aria-label={label}
          title={label}
          onClick={() => selectTheme(value)}
          className={`relative z-10 flex h-[24px] w-[28px] items-center justify-center rounded-full transition-colors duration-200 cursor-pointer ${
            mode === value
              ? "text-[var(--primary)]"
              : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          }`}
        >
          {icon}
        </button>
      ))}
    </div>
  );
}
