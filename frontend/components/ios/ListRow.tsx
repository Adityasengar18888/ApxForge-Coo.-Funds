import React from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ListRowProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  detail?: React.ReactNode;
  showChevron?: boolean;
  onClick?: () => void;
  className?: string;
}

export const ListRow: React.FC<ListRowProps> = ({
  icon,
  title,
  subtitle,
  detail,
  showChevron = false,
  onClick,
  className,
  ...props
}) => {
  return (
    <div
      onClick={onClick}
      className={cn(
        "flex items-center justify-between px-4 py-3.5 transition-colors",
        onClick ? "cursor-pointer active:bg-black/5 dark:active:bg-white/5 ios-press" : "",
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-3.5 min-w-0">
        {icon && <div className="flex-shrink-0 text-ios-blue">{icon}</div>}
        <div className="min-w-0">
          <div className="text-[17px] font-medium text-ios-text truncate">{title}</div>
          {subtitle && (
            <div className="text-[13px] text-ios-secondaryText truncate">{subtitle}</div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 pl-3 flex-shrink-0">
        {detail && <div className="text-[15px] text-ios-secondaryText">{detail}</div>}
        {showChevron && <ChevronRight className="w-4 h-4 text-ios-secondaryText" />}
      </div>
    </div>
  );
};

