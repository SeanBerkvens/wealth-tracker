"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const isDark = theme === "dark";

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        {isDark ? (
          <>
            <Moon className="h-4 w-4" />
            <span>DARK MODE</span>
          </>
        ) : (
          <>
            <Sun className="h-4 w-4" />
            <span>LIGHT MODE</span>
          </>
        )}
      </div>

      <button
  onClick={() => setTheme(isDark ? "light" : "dark")}
  className={`relative flex h-7 w-14 items-center rounded-full transition-all duration-300 ${
    isDark ? "bg-primary" : "bg-zinc-300"
  }`}
>
  <span
    className={`h-5 w-5 rounded-full bg-white shadow-md transition-all duration-300 ${
      isDark ? "ml-8" : "ml-1"
    }`}
  />
</button>
    </div>
  );
}