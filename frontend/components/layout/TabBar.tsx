"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, TrendingUp, Sparkles, Briefcase, Menu } from "lucide-react";
import { cn } from "@/lib/utils";

export const TabBar: React.FC<{ onOpenMenu?: () => void }> = ({ onOpenMenu }) => {
  const pathname = usePathname();

  const tabs = [
    { name: "Home", href: "/dashboard", icon: LayoutDashboard },
    { name: "Markets", href: "/markets", icon: TrendingUp },
    { name: "Portfolio", href: "/portfolio", icon: Briefcase },
    { name: "ML Lab", href: "/model-lab", icon: Sparkles },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 ios-blur ios-hairline-t pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-14">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full gap-0.5 ios-press",
                isActive ? "text-ios-blue" : "text-ios-secondaryText"
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{tab.name}</span>
            </Link>
          );
        })}
        {onOpenMenu && (
          <button
            type="button"
            onClick={onOpenMenu}
            className="flex flex-col items-center justify-center flex-1 h-full gap-0.5 text-ios-secondaryText ios-press"
          >
            <Menu className="w-5 h-5" />
            <span className="text-[10px] font-medium">More</span>
          </button>
        )}
      </div>
    </div>
  );
};

