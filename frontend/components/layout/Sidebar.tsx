"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  TrendingUp,
  BarChart2,
  Filter,
  ArrowLeftRight,
  Bookmark,
  Briefcase,
  Layers,
  Sparkles,
  Cpu,
  Binary,
  History,
  ShieldAlert,
  Grid,
  Newspaper,
  Bell,
  FileText,
  Settings,
  User,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { cn } from "@/lib/utils";

// Items moved to the top Header Bar
export const headerNavItems = [
  { name: "Screener", href: "/screener", icon: Filter },
  { name: "Compare", href: "/compare", icon: ArrowLeftRight },
  { name: "Watchlist", href: "/watchlist", icon: Bookmark },
  { name: "Portfolio", href: "/portfolio", icon: Briefcase },
  { name: "News", href: "/news", icon: Newspaper },
  { name: "Alerts", href: "/alerts", icon: Bell },
  { name: "Reports", href: "/reports", icon: FileText },
];

// Left Sidebar Navigation Sections
export const sidebarNavigationItems = [
  {
    section: "Overview",
    items: [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { name: "Markets", href: "/markets", icon: TrendingUp },
      { name: "Stocks", href: "/stocks", icon: BarChart2 },
      { name: "Funds", href: "/funds", icon: Layers },
    ],
  },
  {
    section: "Data Science & ML",
    items: [
      { name: "Predictions", href: "/predictions", icon: Sparkles },
      { name: "Model Lab", href: "/model-lab", icon: Cpu },
      { name: "Stats Lab", href: "/stats-lab", icon: Binary },
      { name: "3D Visualizer", href: "/visualizer-3d", icon: Layers },
      { name: "Risk Lab", href: "/risk-lab", icon: ShieldAlert },
      { name: "Correlation", href: "/correlation", icon: Grid },
      { name: "Backtest", href: "/backtest", icon: History },
    ],
  },
  {
    section: "Account",
    items: [
      { name: "Settings", href: "/settings", icon: Settings },
      { name: "Profile", href: "/profile", icon: User },
    ],
  },
];

// Master list for CommandPalette search (Cmd/Ctrl+K)
export const navigationItems = [
  ...sidebarNavigationItems,
  {
    section: "Tools & Intelligence",
    items: headerNavItems,
  },
];

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { user } = useAuthStore();

  return (
    <aside className="hidden md:flex flex-col w-64 h-screen sticky top-0 bg-ios-bg border-r border-ios-hairline overflow-y-auto px-3 py-4 select-none shrink-0">
      <div className="flex items-center gap-2.5 px-3 mb-6">
        <div className="w-8 h-8 rounded-[10px] bg-ios-blue flex items-center justify-center text-white font-bold text-[17px] shadow-sm">
          A
        </div>
        <div>
          <h1 className="text-[17px] font-bold text-ios-text leading-tight">ApxForge</h1>
          <p className="text-[11px] font-medium text-ios-secondaryText">Funds & Risk Engine</p>
        </div>
      </div>

      <nav className="flex-1 space-y-5">
        {sidebarNavigationItems.map((group) => (
          <div key={group.section}>
            <div className="px-3 pb-1.5 text-[11px] font-semibold tracking-wider uppercase text-ios-secondaryText">
              {group.section}
            </div>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center justify-between px-3 py-2 rounded-control text-[14px] font-medium transition-colors ios-press",
                      isActive
                        ? "bg-ios-card shadow-sm text-ios-blue font-semibold border border-ios-hairline"
                        : "text-ios-text hover:bg-black/5 dark:hover:bg-white/5"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={cn("w-4 h-4", isActive ? "text-ios-blue" : "text-ios-secondaryText")} />
                      <span>{item.name}</span>
                    </div>
                    {isActive && <ChevronRight className="w-3.5 h-3.5 text-ios-blue" />}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        {user?.role === "admin" && (
          <div>
            <div className="px-3 pb-1.5 text-[11px] font-semibold tracking-wider uppercase text-ios-secondaryText">
              Administration
            </div>
            <Link
              href="/admin"
              className={cn(
                "flex items-center justify-between px-3 py-2 rounded-control text-[14px] font-medium transition-colors ios-press",
                pathname === "/admin"
                  ? "bg-ios-card shadow-sm text-ios-red font-semibold border border-ios-hairline"
                  : "text-ios-text hover:bg-black/5 dark:hover:bg-white/5"
              )}
            >
              <div className="flex items-center gap-3">
                <ShieldCheck className={cn("w-4 h-4", pathname === "/admin" ? "text-ios-red" : "text-ios-secondaryText")} />
                <span>Admin Console</span>
              </div>
            </Link>
          </div>
        )}
      </nav>
    </aside>
  );
};
