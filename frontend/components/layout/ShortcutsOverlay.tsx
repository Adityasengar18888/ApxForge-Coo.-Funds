"use client";

import React, { useEffect } from "react";
import { Sheet } from "@/components/ios/Sheet";

interface ShortcutsOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsOverlay: React.FC<ShortcutsOverlayProps> = ({ isOpen, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "?" && !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)) {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const shortcuts = [
    { key: "⌘ K / Ctrl K", action: "Open Quick Command Palette" },
    { key: "?", action: "Open Keyboard Shortcuts Sheet" },
    { key: "Esc", action: "Close modal / sheet / search" },
    { key: "Tab", action: "Focus next control" },
    { key: "Enter", action: "Submit / Select highlighted item" },
  ];

  return (
    <Sheet isOpen={isOpen} onClose={onClose} title="Keyboard Shortcuts">
      <div className="space-y-3">
        {shortcuts.map((sc) => (
          <div
            key={sc.key}
            className="flex items-center justify-between p-3 rounded-control bg-ios-secondaryBg/60 dark:bg-white/5 border border-ios-hairline"
          >
            <span className="text-[14px] text-ios-text font-medium">{sc.action}</span>
            <kbd className="px-2.5 py-1 text-[12px] font-mono font-bold bg-ios-card rounded shadow-xs border border-ios-hairline text-ios-blue">
              {sc.key}
            </kbd>
          </div>
        ))}
      </div>
    </Sheet>
  );
};
