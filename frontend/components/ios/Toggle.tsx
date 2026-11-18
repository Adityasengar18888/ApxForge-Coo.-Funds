"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export const Toggle: React.FC<ToggleProps> = ({ checked, onChange, disabled = false, className }) => {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-[31px] w-[51px] shrink-0 cursor-pointer rounded-full p-[2px] transition-colors focus:outline-none focus:ring-2 focus:ring-ios-blue/40",
        checked ? "bg-ios-green" : "bg-ios-secondaryBg dark:bg-[#39393D]",
        disabled ? "opacity-50 cursor-not-allowed" : "ios-press",
        className
      )}
    >
      <motion.span
        layout
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className={cn(
          "pointer-events-none block h-[27px] w-[27px] rounded-full bg-white shadow-md",
          checked ? "translate-x-[20px]" : "translate-x-0"
        )}
      />
    </button>
  );
};
