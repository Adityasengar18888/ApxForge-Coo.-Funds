"use client";

import React from "react";
import ReactECharts from "echarts-for-react";
import { useTheme } from "next-themes";

interface GaugeChartProps {
  value: number; // 0 to 100
  title?: string;
  height?: number;
}

export const GaugeChart: React.FC<GaugeChartProps> = ({
  value,
  title = "Risk Index",
  height = 260,
}) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const option = {
    series: [
      {
        type: "gauge",
        startAngle: 180,
        endAngle: 0,
        min: 0,
        max: 100,
        splitNumber: 5,
        itemStyle: {
          color: value >= 70 ? "#FF3B30" : value >= 40 ? "#FF9500" : "#34C759",
        },
        progress: {
          show: true,
          roundCap: true,
          width: 14,
        },
        pointer: {
          icon: "path://M12.8,0.7l12,40.1H0.7L12.8,0.7z",
          length: "12%",
          width: 12,
          offsetCenter: [0, "-55%"],
          itemStyle: {
            color: "auto",
          },
        },
        axisLine: {
          roundCap: true,
          lineStyle: {
            width: 14,
            color: [
              [0.4, "#34C759"],
              [0.7, "#FF9500"],
              [1, "#FF3B30"],
            ],
          },
        },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: {
          distance: -20,
          color: isDark ? "#8E8E93" : "#999",
          fontSize: 10,
        },
        title: {
          offsetCenter: [0, "15%"],
          fontSize: 13,
          color: isDark ? "#8E8E93" : "#666",
        },
        detail: {
          fontSize: 28,
          offsetCenter: [0, "-15%"],
          valueAnimation: true,
          formatter: "{value}",
          color: "inherit",
          fontWeight: "bold",
        },
        data: [{ value: Math.round(value), name: title }],
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: `${height}px`, width: "100%" }} />;
};
