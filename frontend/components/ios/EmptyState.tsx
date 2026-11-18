import React from "react";
import { FolderOpen } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className,
}) => {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center p-8 rounded-card border border-dashed border-ios-hairline bg-ios-card/50",
        className
      )}
    >
      <div className="w-12 h-12 rounded-full bg-ios-secondaryBg dark:bg-white/10 flex items-center justify-center text-ios-secondaryText mb-3">
        {icon || <FolderOpen className="w-6 h-6" />}
      </div>
      <h3 className="text-[17px] font-semibold text-ios-text mb-1">{title}</h3>
      {description && (
        <p className="text-[13px] text-ios-secondaryText max-w-sm mb-4">{description}</p>
      )}
      {action && <div>{action}</div>}
    </div>
  );
};

