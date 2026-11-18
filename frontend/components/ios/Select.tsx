import React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface SelectOption {
  label: string;
  value: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  error?: string;
}

export const Select: React.FC<SelectProps> = ({ label, options, error, className, ...props }) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-[13px] font-semibold text-ios-secondaryText mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          className={cn(
            "w-full appearance-none rounded-control bg-ios-secondaryBg/70 dark:bg-[#1C1C1E] border border-ios-hairline px-3.5 py-2.5 pr-10 text-[15px] text-ios-text focus:outline-none focus:ring-2 focus:ring-ios-blue/40 transition-all",
            error && "border-ios-red focus:ring-ios-red/40",
            className
          )}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-ios-card text-ios-text">
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ios-secondaryText pointer-events-none" />
      </div>
      {error && <p className="text-[12px] text-ios-red mt-1">{error}</p>}
    </div>
  );
};
