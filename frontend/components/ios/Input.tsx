import React from "react";
import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({ label, error, icon, className, ...props }) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-[13px] font-semibold text-ios-secondaryText mb-1.5">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {icon && <div className="absolute left-3.5 text-ios-secondaryText">{icon}</div>}
        <input
          className={cn(
            "w-full rounded-control bg-ios-secondaryBg/70 dark:bg-[#1C1C1E] border border-ios-hairline px-3.5 py-2.5 text-[15px] text-ios-text placeholder-ios-secondaryText focus:outline-none focus:ring-2 focus:ring-ios-blue/40 transition-all",
            icon && "pl-10",
            error && "border-ios-red focus:ring-ios-red/40",
            className
          )}
          {...props}
        />
      </div>
      {error && <p className="text-[12px] text-ios-red mt-1">{error}</p>}
    </div>
  );
};

