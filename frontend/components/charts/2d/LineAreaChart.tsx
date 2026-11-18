"use client";

import React from "react";
import ReactECharts from "echarts-for-react";
import { useTheme } from "next-themes";

interface LineAreaChartProps {
  dates: string[];
  series: {
    name: string;
    data: number[];
    color?: string;
    area?: boolean;
    areaOpacity?: number;
  }[];
  height?: number;
  yAxisLabel?: string;
}

export const LineAreaChart: React.FC<LineAreaChartProps> = ({
  dates,
  series,
  height = 350,
  yAxisLabel,
}) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const defaultColors = ["#007AFF", "#34C759", "#AF52DE", "#FF9500", "#5AC8FA"];

  const option = {
    tooltip: {
      trigger: "axis",
      backgroundColor: isDark ? "rgba(28,28,30,0.9)" : "rgba(255,255,255,0.9)",
      borderColor: isDark ? "#48484A" : "#E5E5EA",
      textStyle: { color: isDark ? "#FFFFFF" : "#000000" },
    },
    legend: {
      data: series.map((s) => s.name),
      textStyle: { color: isDark ? "#8E8E93" : "#666" },
      bottom: 0,
    },
    grid: { left: "5%", right: "4%", top: "8%", bottom: "12%", containLabel: true },
    xAxis: {
      type: "category",
      data: dates,
      boundaryGap: false,
      axisLine: { lineStyle: { color: isDark ? "#48484A" : "#E5E5EA" } },
      axisLabel: { color: isDark ? "#8E8E93" : "#666" },
      splitLine: { show: false },
    },
    yAxis: {
      type: "value",
      name: yAxisLabel,
      scale: true,
      axisLabel: { color: isDark ? "#8E8E93" : "#666" },
      splitLine: { lineStyle: { color: isDark ? "#2C2C2E" : "#F2F2F7" } },
    },
    series: series.map((s, idx) => {
      const col = s.color || defaultColors[idx % defaultColors.length];
      return {
        name: s.name,
        type: "line",
        smooth: true,
        showSymbol: false,
        data: s.data,
        itemStyle: { color: col },
        lineStyle: { width: 2.5 },
        areaStyle: (s.area || s.areaOpacity !== undefined)
          ? {
              color: {
                type: "linear",
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  { offset: 0, color: `${col}${s.areaOpacity ? Math.round(s.areaOpacity * 255).toString(16).padStart(2, '0') : '40'}` },
                  { offset: 1, color: `${col}00` },
                ],
              },
            }
          : undefined,
      };
    }),
  };

  return <ReactECharts option={option} style={{ height: `${height}px`, width: "100%" }} />;
};
