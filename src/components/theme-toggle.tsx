'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

/**
 * ThemeToggle component for switching between light and dark modes
 * 
 * Features:
 * - Smooth transitions between themes
 * - System preference detection
 * - Accessible button with proper ARIA labels
 * - Loading state to prevent hydration mismatch
 */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Return a placeholder button with the same dimensions during SSR
    return (
      <button
        className="btn btn-ghost btn-sm"
        disabled
        aria-label="Loading theme toggle"
      >
        <div className="h-4 w-4" />
      </button>
    );
  }

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <button
      onClick={toggleTheme}
      className="btn btn-ghost btn-sm relative overflow-hidden"
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      <div className="relative h-4 w-4">
        <Sun
          className={`h-4 w-4 transition-all duration-300 ${
            theme === 'dark'
              ? 'rotate-90 scale-0 opacity-0'
              : 'rotate-0 scale-100 opacity-100'
          }`}
        />
        <Moon
          className={`absolute top-0 left-0 h-4 w-4 transition-all duration-300 ${
            theme === 'dark'
              ? 'rotate-0 scale-100 opacity-100'
              : '-rotate-90 scale-0 opacity-0'
          }`}
        />
      </div>
    </button>
  );
}

/**
 * ThemeToggleDropdown component with system option
 * 
 * Provides a dropdown menu with three options:
 * - Light mode
 * - Dark mode  
 * - System preference
 */
export function ThemeToggleDropdown() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="btn btn-ghost btn-sm">
        <div className="h-4 w-4" />
      </div>
    );
  }

  const themes = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Sun }, // Could use a different icon
  ];

  return (
    <div className="relative">
      <button
        className="btn btn-ghost btn-sm"
        aria-label="Theme options"
        title="Theme options"
      >
        {theme === 'light' && <Sun className="h-4 w-4" />}
        {theme === 'dark' && <Moon className="h-4 w-4" />}
        {theme === 'system' && <Sun className="h-4 w-4" />}
      </button>
      
      <div className="absolute right-0 top-full mt-2 w-32 rounded-md border bg-popover p-1 shadow-lg">
        {themes.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            onClick={() => setTheme(value)}
            className={`w-full rounded-sm px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent ${
              theme === value ? 'bg-accent' : ''
            }`}
          >
            <div className="flex items-center gap-2">
              <Icon className="h-4 w-4" />
              {label}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
