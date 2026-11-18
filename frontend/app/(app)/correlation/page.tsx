"use client";

import React from "react";
import ReactECharts from "echarts-for-react";
import { useTheme } from "next-themes";
import { Card } from "@/components/ios/Card";
import { ChartCard } from "@/components/ios/ChartCard";

export default function CorrelationPage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const symbols = ["AAPL", "MSFT", "NVDA", "TSLA", "AMZN", "META", "GOOGL"];

  // Pairwise correlation matrix
  const matrix = [
    [1.00, 0.78, 0.65, 0.42, 0.71, 0.68, 0.74],
    [0.78, 1.00, 0.72, 0.38, 0.82, 0.75, 0.86],
    [0.65, 0.72, 1.00, 0.51, 0.69, 0.64, 0.70],
    [0.42, 0.38, 0.51, 1.00, 0.46, 0.41, 0.39],
    [0.71, 0.82, 0.69, 0.46, 1.00, 0.79, 0.83],
    [0.68, 0.75, 0.64, 0.41, 0.79, 1.00, 0.81],
    [0.74, 0.86, 0.70, 0.39, 0.83, 0.81, 1.00],
  ];

  const heatmapData: [number, number, number][] = [];
  matrix.forEach((row, i) => {
    row.forEach((val, j) => {
      heatmapData.push([j, i, val]);
    });
  });

  const option = {
    tooltip: {
      position: "top",
      formatter: (p: any) => {
        return `${symbols[p.value[1]]} vs ${symbols[p.value[0]]}: <b>${p.value[2]}</b>`;
      },
    },
    grid: { left: "10%", right: "8%", top: "5%", bottom: "12%" },
    xAxis: {
      type: "category",
      data: symbols,
      splitArea: { show: true },
      axisLabel: { color: isDark ? "#FFF" : "#000", fontWeight: "bold" },
    },
    yAxis: {
      type: "category",
      data: symbols,
      splitArea: { show: true },
      axisLabel: { color: isDark ? "#FFF" : "#000", fontWeight: "bold" },
    },
    visualMap: {
      min: 0,
      max: 1,
      calculable: true,
      orient: "horizontal",
      left: "center",
      bottom: "0%",
      inRange: {
        color: ["#5AC8FA", "#007AFF", "#5856D6", "#AF52DE"],
      },
      textStyle: { color: isDark ? "#8E8E93" : "#666" },
    },
    series: [
      {
        name: "Correlation",
        type: "heatmap",
        data: heatmapData,
        label: {
          show: true,
          color: "#FFFFFF",
          fontWeight: "bold",
        },
        emphasis: {
          itemStyle: { shadowBlur: 10, shadowColor: "rgba(0, 0, 0, 0.5)" },
        },
      },
    ],
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[34px] font-bold tracking-tight text-ios-text">Asset Correlation</h1>
        <p className="text-[15px] text-ios-secondaryText">
          Pairwise Pearson correlation matrix across top portfolio assets
        </p>
      </div>

      <ChartCard
        title="1-Year Daily Log Return Correlation Heatmap"
        subtitle="Values near 1.0 indicate high co-movement; lower values provide diversification"
      >
        <ReactECharts option={option} style={{ height: "450px", width: "100%" }} />
      </ChartCard>
    </div>
  );
}
