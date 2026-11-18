"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { TabBar } from "./TabBar";
import { CommandPalette } from "./CommandPalette";
import { ShortcutsOverlay } from "./ShortcutsOverlay";
import { useAuthStore } from "@/store/useAuthStore";
import { apiClient } from "@/lib/api";

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { user, setUser, token, logout, isLoading } = useAuthStore();
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  // Auth checking effect
  useEffect(() => {
    async function verifyUser() {
      const storedToken = localStorage.getItem("access_token");
      if (!storedToken) {
        if (pathname !== "/login") {
          router.push("/login");
        }
        return;
      }
      try {
        const userData = await apiClient<any>("/auth/me");
        setUser(userData);
      } catch {
        logout();
        router.push("/login");
      }
    }

    if (pathname !== "/login") {
      verifyUser();
    }
  }, [pathname, router, setUser, logout]);

  // Don't show shell on login page
  if (pathname === "/login") {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-ios-bg text-ios-text">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          onOpenCommand={() => setIsCommandOpen(true)}
          onOpenShortcuts={() => setIsShortcutsOpen(true)}
        />
        <main className="flex-1 p-4 sm:p-6 pb-20 md:pb-6 max-w-[1400px] w-full mx-auto">
          {children}
        </main>
        <TabBar onOpenMenu={() => setIsCommandOpen(true)} />
      </div>

      <CommandPalette isOpen={isCommandOpen} onClose={() => setIsCommandOpen(false)} />
      <ShortcutsOverlay isOpen={isShortcutsOpen} onClose={() => setIsShortcutsOpen(false)} />
    </div>
  );
};

