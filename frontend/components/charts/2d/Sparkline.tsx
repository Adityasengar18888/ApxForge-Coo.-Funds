"use client";

import React from "react";
import ReactECharts from "echarts-for-react";

interface SparklineProps {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
}

export const Sparkline: React.FC<SparklineProps> = ({
  data,
  color = "#007AFF",
  width = 120,
  height = 36,
}) => {
  const isUp = data.length > 1 && data[data.length - 1] >= data[0];
  const strokeColor = color === "auto" ? (isUp ? "#34C759" : "#FF3B30") : color;

  const option = {
    grid: { left: 0, right: 0, top: 2, bottom: 2 },
    xAxis: { type: "category", show: false },
    yAxis: { type: "value", show: false, min: "dataMin", max: "dataMax" },
    series: [
      {
        type: "line",
        smooth: true,
        showSymbol: false,
        data,
        lineStyle: { width: 1.5, color: strokeColor },
        areaStyle: {
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: `${strokeColor}33` },
              { offset: 1, color: `${strokeColor}00` },
            ],
          },
        },
      },
    ],
  };

  return <ReactECharts option={option} style={{ width: `${width}px`, height: `${height}px` }} />;
};
