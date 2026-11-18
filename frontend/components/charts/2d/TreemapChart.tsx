"use client";

import React from "react";
import ReactECharts from "echarts-for-react";
import { useTheme } from "next-themes";

interface TreemapItem {
  name: string;
  value: number;
  change?: number;
  children?: TreemapItem[];
}

interface TreemapChartProps {
  data: TreemapItem[];
  height?: number;
}

export const TreemapChart: React.FC<TreemapChartProps> = ({ data, height = 350 }) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const option = {
    tooltip: {
      formatter: (info: any) => {
        const val = info.value;
        const name = info.name;
        return `<div class="font-sans font-semibold">${name}</div><div>Weight / Value: ${val}</div>`;
      },
    },
    series: [
      {
        type: "treemap",
        data,
        leafDepth: 1,
        roam: false,
        label: {
          show: true,
          formatter: "{b}\n{c}",
          fontSize: 12,
          color: "#FFFFFF",
        },
        itemStyle: {
          borderColor: isDark ? "#000000" : "#FFFFFF",
          borderWidth: 2,
          gapWidth: 2,
        },
        levels: [
          {
            itemStyle: { borderColor: isDark ? "#1C1C1E" : "#F2F2F7", borderWidth: 4, gapWidth: 4 },
          },
          {
            colorSaturation: [0.35, 0.6],
            itemStyle: { borderColorSaturation: 0.7, gapWidth: 2, borderWidth: 2 },
          },
        ],
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: `${height}px`, width: "100%" }} />;
};

