"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, HelpCircle, Sun, Moon, LogOut } from "lucide-react";
import { useTheme } from "next-themes";
import { useAuthStore } from "@/store/useAuthStore";
import { headerNavItems } from "./Sidebar";
import { cn } from "@/lib/utils";

interface HeaderProps {
  onOpenCommand: () => void;
  onOpenShortcuts: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenCommand, onOpenShortcuts }) => {
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuthStore();
  const pathname = usePathname();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-14 px-3 sm:px-6 ios-blur ios-hairline-b gap-2">
      {/* Search Bar / Command Palette Trigger */}
      <button
        type="button"
        onClick={onOpenCommand}
        className="flex items-center gap-2 px-3 py-1.5 rounded-control bg-ios-secondaryBg/80 dark:bg-white/10 text-ios-secondaryText hover:text-ios-text w-40 sm:w-52 md:w-56 text-left transition-colors ios-press border border-ios-hairline shrink-0"
      >
        <Search className="w-3.5 h-3.5 flex-shrink-0" />
        <span className="text-[12px] sm:text-[13px] flex-1 truncate">Quick Search...</span>
        <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-ios-card rounded shadow-xs border border-ios-hairline">
          ⌘K
        </kbd>
      </button>

      {/* Header Navigation Bar (Tools, Portfolios & Intelligence) */}
      <nav className="hidden md:flex items-center gap-1 overflow-x-auto no-scrollbar px-2 py-1">
        {headerNavItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-control text-[13px] font-medium whitespace-nowrap transition-all ios-press",
                isActive
                  ? "bg-ios-card text-ios-blue font-semibold shadow-xs border border-ios-hairline"
                  : "text-ios-secondaryText hover:text-ios-text hover:bg-black/5 dark:hover:bg-white/10"
              )}
            >
              <Icon className={cn("w-3.5 h-3.5", isActive ? "text-ios-blue" : "text-ios-secondaryText")} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Right Action Icons */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
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
          aria-label="Toggle theme"
        >
          {mounted ? (
            theme === "dark" ? (
              <Sun className="w-4 h-4 text-ios-yellow" />
            ) : (
              <Moon className="w-4 h-4 text-ios-indigo" />
            )
          ) : (
            <div className="w-4 h-4" />
          )}
        </button>

        {user && (
          <div className="flex items-center gap-2 sm:gap-3 pl-2 border-l border-ios-hairline">
            <div className="hidden lg:flex flex-col text-right">
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
