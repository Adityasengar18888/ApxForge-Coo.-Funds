import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "./Button";
import { cn } from "@/lib/utils";

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = "Error loading data",
  message,
  onRetry,
  className,
}) => {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center p-6 rounded-card border border-ios-red/30 bg-ios-red/5",
        className
      )}
    >
      <div className="w-12 h-12 rounded-full bg-ios-red/15 flex items-center justify-center text-ios-red mb-3">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h3 className="text-[17px] font-semibold text-ios-text mb-1">{title}</h3>
      <p className="text-[13px] text-ios-secondaryText max-w-md mb-4">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Retry
        </Button>
      )}
    </div>
  );
};
