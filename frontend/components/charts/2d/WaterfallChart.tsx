"use client";

import React from "react";
import ReactECharts from "echarts-for-react";
import { useTheme } from "next-themes";

interface WaterfallItem {
  name: string;
  value: number;
}

interface WaterfallChartProps {
  items: WaterfallItem[];
  height?: number;
  totalLabel?: string;
}

export const WaterfallChart: React.FC<WaterfallChartProps> = ({ items, height = 350, totalLabel = "Total" }) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const names = items.map((i) => i.name);
  const values = items.map((i) => i.value);

  // Compute waterfall base (transparent baseline) and delta
  let cumulative = 0;
  const baseData: number[] = [];
  const barData: number[] = [];
  const colors: string[] = [];

  items.forEach((item, idx) => {
    if (idx === 0 || idx === items.length - 1) {
      baseData.push(0);
      barData.push(Math.abs(item.value));
      colors.push(item.value >= 0 ? "#007AFF" : "#FF3B30");
      cumulative = item.value;
    } else {
      if (item.value >= 0) {
        baseData.push(cumulative);
        barData.push(item.value);
        colors.push("#34C759");
        cumulative += item.value;
      } else {
        cumulative += item.value;
        baseData.push(cumulative);
        barData.push(Math.abs(item.value));
        colors.push("#FF3B30");
      }
    }
  });

  const option = {
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      formatter: (params: any[]) => {
        const p = params[1] || params[0];
        const val = items[p.dataIndex].value;
        return `${p.name}: <b>${val >= 0 ? "+" : ""}${val}</b>`;
      },
    },
    grid: { left: "5%", right: "4%", top: "8%", bottom: "10%", containLabel: true },
    xAxis: {
      type: "category",
      data: names,
      axisLabel: { color: isDark ? "#8E8E93" : "#666", fontSize: 11 },
      axisLine: { lineStyle: { color: isDark ? "#48484A" : "#E5E5EA" } },
    },
    yAxis: {
      type: "value",
      axisLabel: { color: isDark ? "#8E8E93" : "#666" },
      splitLine: { lineStyle: { color: isDark ? "#2C2C2E" : "#F2F2F7" } },
    },
    series: [
      {
        name: "Base",
        type: "bar",
        stack: "Total",
        itemStyle: { borderColor: "transparent", color: "transparent" },
        emphasis: { itemStyle: { borderColor: "transparent", color: "transparent" } },
        data: baseData,
      },
      {
        name: "P&L",
        type: "bar",
        stack: "Total",
        label: { show: true, position: "top", color: isDark ? "#FFF" : "#000", fontSize: 11 },
        data: barData.map((val, idx) => ({
          value: val,
          itemStyle: { color: colors[idx] },
        })),
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: `${height}px`, width: "100%" }} />;
};
