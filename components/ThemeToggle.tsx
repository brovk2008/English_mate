'use client';

import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-9 h-9 rounded-full bg-sakura/5 animate-pulse" />
    );
  }

  const isDark = theme === 'dark';

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="p-2 rounded-full text-ink-muted hover:text-sakura hover:bg-sakura/10 transition-colors focus:outline-none focus:ring-2 focus:ring-sakura focus:ring-offset-2 cursor-pointer"
      aria-label="Toggle dark mode"
    >
      {isDark ? (
        <Sun className="w-5 h-5 transition-transform hover:rotate-45 duration-300" />
      ) : (
        <Moon className="w-5 h-5 transition-transform hover:-rotate-12 duration-300" />
      )}
    </button>
  );
}
