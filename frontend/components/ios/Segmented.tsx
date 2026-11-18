"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SegmentedProps {
  options: { label: string; value: string }[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export const Segmented: React.FC<SegmentedProps> = ({ options, value, onChange, className }) => {
  return (
    <div
      className={cn(
        "relative flex p-1 bg-ios-secondaryBg dark:bg-[#2C2C2E] rounded-control border border-ios-hairline",
        className
      )}
    >
      {options.map((opt) => {
        const isSelected = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              "relative flex-1 py-1.5 px-3 text-center text-[13px] font-semibold transition-colors z-10",
              isSelected ? "text-ios-text" : "text-ios-secondaryText hover:text-ios-text"
            )}
          >
            {isSelected && (
              <motion.div
                layoutId="segmented-pill"
                className="absolute inset-0 bg-ios-card rounded-[8px] shadow-sm -z-10"
                transition={{ type: "spring", stiffness: 350, damping: 30 }}
              />
            )}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
};

