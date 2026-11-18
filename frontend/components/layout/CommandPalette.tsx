"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ChevronRight, X } from "lucide-react";
import { navigationItems } from "./Sidebar";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const router = useRouter();
  const [query, setQuery] = useState("");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (isOpen) onClose();
        else setQuery("");
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const allItems = navigationItems.flatMap((group) =>
    group.items.map((item) => ({ ...item, section: group.section }))
  );

  const filteredItems = query.trim()
    ? allItems.filter(
        (item) =>
          item.name.toLowerCase().includes(query.toLowerCase()) ||
          item.section.toLowerCase().includes(query.toLowerCase())
      )
    : allItems;

  const handleSelect = (href: string) => {
    router.push(href);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
            className="relative w-full max-w-lg bg-ios-card rounded-sheet shadow-2xl border border-ios-hairline overflow-hidden z-10"
          >
            <div className="flex items-center px-4 py-3.5 border-b border-ios-hairline">
              <Search className="w-5 h-5 text-ios-secondaryText mr-3 flex-shrink-0" />
              <input
                autoFocus
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Jump to page or tool..."
                className="w-full bg-transparent text-[16px] text-ios-text placeholder-ios-secondaryText focus:outline-none"
              />
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded-full text-ios-secondaryText hover:text-ios-text"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto p-2 divide-y divide-ios-hairline">
              {filteredItems.length === 0 ? (
                <div className="py-8 text-center text-[14px] text-ios-secondaryText">
                  No matching destinations found.
                </div>
              ) : (
                filteredItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.href}
                      onClick={() => handleSelect(item.href)}
                      className="flex items-center justify-between p-2.5 rounded-control cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors ios-press"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-control bg-ios-secondaryBg dark:bg-white/10 text-ios-blue">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-[14px] font-semibold text-ios-text">{item.name}</div>
                          <div className="text-[11px] text-ios-secondaryText">{item.section}</div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-ios-secondaryText" />
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

