"use client";

import React from "react";
import ReactECharts from "echarts-for-react";
import { useTheme } from "next-themes";

interface RadarChartProps {
  indicators: { name: string; max: number }[];
  seriesData: { name: string; value: number[]; color?: string }[];
  height?: number;
}

export const RadarChart: React.FC<RadarChartProps> = ({
  indicators,
  seriesData,
  height = 350,
}) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const option = {
    tooltip: {
      backgroundColor: isDark ? "rgba(28,28,30,0.9)" : "rgba(255,255,255,0.9)",
      borderColor: isDark ? "#48484A" : "#E5E5EA",
      textStyle: { color: isDark ? "#FFFFFF" : "#000000" },
    },
    legend: {
      data: seriesData.map((s) => s.name),
      bottom: 0,
      textStyle: { color: isDark ? "#8E8E93" : "#666" },
    },
    radar: {
      indicator: indicators,
      axisName: { color: isDark ? "#8E8E93" : "#666", fontSize: 11 },
      splitLine: { lineStyle: { color: isDark ? "#2C2C2E" : "#E5E5EA" } },
      splitArea: { show: false },
      axisLine: { lineStyle: { color: isDark ? "#39393D" : "#E5E5EA" } },
    },
    series: [
      {
        type: "radar",
        data: seriesData.map((s, idx) => ({
          name: s.name,
          value: s.value,
          itemStyle: { color: s.color || "#007AFF" },
          areaStyle: { opacity: 0.25 },
        })),
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: `${height}px`, width: "100%" }} />;
};

