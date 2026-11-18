"use client";

import React from "react";
import { Search, HelpCircle, Sun, Moon, LogOut } from "lucide-react";
import { useTheme } from "next-themes";
import { useAuthStore } from "@/store/useAuthStore";

interface HeaderProps {
  onOpenCommand: () => void;
  onOpenShortcuts: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenCommand, onOpenShortcuts }) => {
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuthStore();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-14 px-4 sm:px-6 ios-blur ios-hairline-b">
      {/* Search Bar / Command Palette Trigger */}
      <button
        type="button"
        onClick={onOpenCommand}
        className="flex items-center gap-2 px-3 py-1.5 rounded-control bg-ios-secondaryBg/80 dark:bg-white/10 text-ios-secondaryText hover:text-ios-text w-52 sm:w-72 text-left transition-colors ios-press border border-ios-hairline"
      >
        <Search className="w-4 h-4 flex-shrink-0" />
        <span className="text-[13px] flex-1 truncate">Quick Search (⌘K)...</span>
        <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-ios-card rounded shadow-xs border border-ios-hairline">
          ⌘K
        </kbd>
      </button>

      {/* Right Action Icons */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onOpenShortcuts}
          title="Keyboard Shortcuts (?)"
          className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-ios-secondaryText hover:text-ios-text transition-colors ios-press"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          title="Toggle Light/Dark Theme"
          className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-ios-secondaryText hover:text-ios-text transition-colors ios-press"
        >
          {theme === "dark" ? <Sun className="w-4 h-4 text-ios-yellow" /> : <Moon className="w-4 h-4 text-ios-indigo" />}
        </button>

        {user && (
          <div className="flex items-center gap-3 pl-2 border-l border-ios-hairline">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-[13px] font-semibold text-ios-text leading-tight">
                {user.username}
              </span>
              <span className="text-[11px] font-medium text-ios-secondaryText capitalize">
                {user.role}
              </span>
            </div>
            <div className="w-8 h-8 rounded-full bg-ios-blue text-white flex items-center justify-center font-bold text-[13px] shadow-sm">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <button
              type="button"
              onClick={logout}
              title="Logout"
              className="p-1.5 rounded-full hover:bg-ios-red/10 text-ios-red transition-colors ios-press"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
