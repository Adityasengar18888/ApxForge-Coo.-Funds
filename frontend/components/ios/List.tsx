import React from "react";
import { cn } from "@/lib/utils";
export { ListRow } from "./ListRow";

interface ListProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  header?: string;
  footer?: string;
  className?: string;
}

export const List: React.FC<ListProps> = ({ children, header, footer, className, ...props }) => {
  return (
    <div className={cn("w-full mb-6", className)} {...props}>
      {header && (
        <div className="px-4 pb-2 text-[11px] font-semibold tracking-wider uppercase text-ios-secondaryText">
          {header}
        </div>
      )}
      <div className="rounded-card bg-ios-card border border-ios-hairline overflow-hidden shadow-sm divide-y divide-ios-hairline">
        {children}
      </div>
      {footer && (
        <div className="px-4 pt-2 text-[13px] text-ios-secondaryText">
          {footer}
        </div>
      )}
    </div>
  );
};
