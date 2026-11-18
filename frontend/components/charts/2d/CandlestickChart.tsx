"use client";

import React from "react";
import ReactECharts from "echarts-for-react";
import { useTheme } from "next-themes";

interface CandlestickDataPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

interface CandlestickChartProps {
  data: CandlestickDataPoint[];
  height?: number;
}

export const CandlestickChart: React.FC<CandlestickChartProps> = ({ data, height = 400 }) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const dates = data.map((d) => d.date);
  const values = data.map((d) => [d.open, d.close, d.low, d.high]);
  const volumes = data.map((d, i) => [i, d.volume || 0, d.open > d.close ? -1 : 1]);

  const option = {
    animation: false,
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "cross" },
      backgroundColor: isDark ? "rgba(28,28,30,0.9)" : "rgba(255,255,255,0.9)",
      borderColor: isDark ? "#48484A" : "#E5E5EA",
      textStyle: { color: isDark ? "#FFFFFF" : "#000000" },
    },
    axisPointer: { link: [{ xAxisIndex: "all" }] },
    grid: [
      { left: "8%", right: "4%", top: "8%", height: "62%" },
      { left: "8%", right: "4%", top: "74%", height: "18%" },
    ],
    xAxis: [
      {
        type: "category",
        data: dates,
        boundaryGap: false,
        axisLine: { lineStyle: { color: isDark ? "#48484A" : "#E5E5EA" } },
        axisLabel: { color: isDark ? "#8E8E93" : "#666" },
        splitLine: { show: false },
        min: "dataMin",
        max: "dataMax",
      },
      {
        type: "category",
        gridIndex: 1,
        data: dates,
        boundaryGap: false,
        axisLine: { lineStyle: { color: isDark ? "#48484A" : "#E5E5EA" } },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { show: false },
        min: "dataMin",
        max: "dataMax",
      },
    ],
    yAxis: [
      {
        scale: true,
        splitArea: { show: false },
        axisLabel: { color: isDark ? "#8E8E93" : "#666" },
        splitLine: { lineStyle: { color: isDark ? "#2C2C2E" : "#F2F2F7" } },
      },
      {
        scale: true,
        gridIndex: 1,
        splitNumber: 2,
        axisLabel: { show: false },
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { show: false },
      },
    ],
    series: [
      {
        name: "Price",
        type: "candlestick",
        data: values,
        itemStyle: {
          color: "#34C759", // Up (green)
          color0: "#FF3B30", // Down (red)
          borderColor: "#34C759",
          borderColor0: "#FF3B30",
        },
      },
      {
        name: "Volume",
        type: "bar",
        xAxisIndex: 1,
        yAxisIndex: 1,
        data: volumes.map((v) => v[1]),
        itemStyle: {
          color: (params: any) =>
            volumes[params.dataIndex][2] === 1 ? "rgba(52, 199, 89, 0.4)" : "rgba(255, 59, 48, 0.4)",
        },
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: `${height}px`, width: "100%" }} />;
};

