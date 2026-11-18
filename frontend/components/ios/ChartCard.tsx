"use client";

import React, { useRef } from "react";
import { Download, Maximize2 } from "lucide-react";
import { Card } from "./Card";
import { cn } from "@/lib/utils";

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  onExportPng?: () => void;
}

export const ChartCard: React.FC<ChartCardProps> = ({
  title,
  subtitle,
  children,
  actions,
  className,
  onExportPng,
}) => {
  const chartRef = useRef<HTMLDivElement>(null);

  const handleExport = () => {
    if (onExportPng) {
      onExportPng();
      return;
    }
    // Generic canvas-based PNG export
    if (chartRef.current) {
      const canvas = chartRef.current.querySelector("canvas");
      if (canvas) {
        const link = document.createElement("a");
        link.download = `${title.toLowerCase().replace(/\s+/g, "_")}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
      }
    }
  };

  return (
    <Card className={cn("overflow-hidden flex flex-col", className)}>
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-ios-hairline">
        <div>
          <h3 className="text-[17px] font-semibold text-ios-text">{title}</h3>
          {subtitle && (
            <p className="text-[13px] text-ios-secondaryText">{subtitle}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {actions}
          <button
            type="button"
            onClick={handleExport}
            title="Export PNG"
            className="p-1.5 rounded-control bg-ios-secondaryBg dark:bg-white/10 text-ios-secondaryText hover:text-ios-text ios-press"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div ref={chartRef} className="w-full flex-1 min-h-[300px]">
        {children}
      </div>
    </Card>
  );
};
