import React from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "tinted" | "destructive" | "plain";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  children,
  className,
  disabled,
  ...props
}) => {
  const variantStyles = {
    primary: "bg-ios-blue text-white hover:bg-ios-blue/90 font-semibold shadow-sm",
    secondary: "bg-ios-secondaryBg dark:bg-white/10 text-ios-text hover:bg-black/10 dark:hover:bg-white/20 font-medium",
    tinted: "bg-ios-blue/15 text-ios-blue hover:bg-ios-blue/25 font-semibold",
    destructive: "bg-ios-red text-white hover:bg-ios-red/90 font-semibold shadow-sm",
    plain: "text-ios-blue hover:underline font-medium bg-transparent",
  };

  const sizeStyles = {
    sm: "px-3 py-1.5 text-[13px] rounded-[8px]",
    md: "px-4 py-2 text-[15px] rounded-[10px]",
    lg: "px-5 py-3 text-[17px] rounded-[14px]",
  };

  return (
    <button
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed select-none",
        !disabled && "ios-press",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};

