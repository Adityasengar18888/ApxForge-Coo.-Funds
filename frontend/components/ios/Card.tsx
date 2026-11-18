import React from "react";
import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  glass?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className, glass = false, ...props }) => {
  return (
    <div
      className={cn(
        "rounded-card p-5 transition-shadow",
        glass ? "ios-card-blur ios-hairline" : "bg-ios-card shadow-sm border border-ios-hairline",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

