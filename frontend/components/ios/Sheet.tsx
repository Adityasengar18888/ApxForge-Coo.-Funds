"use client";

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export const Sheet: React.FC<SheetProps> = ({ isOpen, onClose, title, children, className }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-0 sm:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={cn(
              "relative w-full max-w-lg bg-ios-card rounded-t-sheet sm:rounded-sheet p-6 shadow-2xl z-10 max-h-[90vh] overflow-y-auto border border-ios-hairline",
              className
            )}
          >
            {/* Grabber indicator */}
            <div className="w-10 h-1.5 bg-ios-secondaryText/30 rounded-full mx-auto mb-4 sm:hidden" />
            <div className="flex items-center justify-between pb-4 border-b border-ios-hairline mb-4">
              {title && <h2 className="text-[20px] font-bold text-ios-text">{title}</h2>}
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-full bg-ios-secondaryBg dark:bg-white/10 text-ios-secondaryText hover:text-ios-text ios-press"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
