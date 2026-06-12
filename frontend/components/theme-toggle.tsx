"use client";

import { useSyncExternalStore } from "react";
import { CloudMoon, CloudSun } from "lucide-react";

const themeEvent = "fino-theme-change";

function subscribe(callback: () => void) {
  window.addEventListener(themeEvent, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(themeEvent, callback);
    window.removeEventListener("storage", callback);
  };
}

function getSnapshot() {
  return document.documentElement.classList.contains("dark");
}

export function ThemeToggle() {
  const dark = useSyncExternalStore(subscribe, getSnapshot, () => false);

  function toggleTheme() {
    const nextDark = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", nextDark);
    localStorage.setItem("fino-theme", nextDark ? "dark" : "light");
    window.dispatchEvent(new Event(themeEvent));
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={dark ? "Ativar modo claro" : "Ativar modo noturno"}
      title={dark ? "Ativar modo claro" : "Ativar modo noturno"}
      className="theme-toggle fixed right-4 top-4 z-[60] flex h-11 w-11 items-center justify-center rounded-full border border-[#dcded6] bg-[#fbfbf8] text-[#56615b] shadow-lg transition hover:-translate-y-0.5 sm:right-6 sm:top-6"
    >
      {dark ? <CloudSun size={21} /> : <CloudMoon size={21} />}
    </button>
  );
}

