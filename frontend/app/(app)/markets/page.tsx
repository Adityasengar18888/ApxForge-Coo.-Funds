"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, TrendingDown, Activity, Globe } from "lucide-react";
import { Card } from "@/components/ios/Card";
import { ChartCard } from "@/components/ios/ChartCard";
import { LineAreaChart } from "@/components/charts/2d/LineAreaChart";
import { TreemapChart } from "@/components/charts/2d/TreemapChart";
import { GaugeChart } from "@/components/charts/2d/GaugeChart";
import { Skeleton } from "@/components/ios/Skeleton";
import { apiClient } from "@/lib/api";

export default function MarketsPage() {
  const [selectedBenchmark, setSelectedBenchmark] = useState("SPY");

  const { data: quoteData, isLoading: quoteLoading } = useQuery({
    queryKey: ["marketQuote", selectedBenchmark],
    queryFn: () => apiClient<any>(`/market/quote/${selectedBenchmark}`),
  });

  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ["marketHistory", selectedBenchmark],
    queryFn: () => apiClient<any>(`/market/history/${selectedBenchmark}?period=6mo`),
  });

  const sectorExposure = [
    { name: "Information Technology", value: 31.5 },
    { name: "Financials", value: 13.2 },
    { name: "Health Care", value: 11.8 },
    { name: "Consumer Discretionary", value: 10.4 },
    { name: "Communication Services", value: 9.1 },
    { name: "Industrials", value: 8.5 },
    { name: "Consumer Staples", value: 5.9 },
    { name: "Energy", value: 3.8 },
    { name: "Utilities", value: 2.5 },
    { name: "Real Estate", value: 2.1 },
  ];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-[34px] font-bold tracking-tight text-ios-text">Markets</h1>
        <p className="text-[15px] text-ios-secondaryText">
          Macro Benchmarks, Sector Breadth & Regime Tracking
        </p>
      </div>

      {/* Benchmark Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {["SPY", "QQQ", "IWM", "DIA"].map((sym) => {
          const isSelected = selectedBenchmark === sym;
          return (
            <Card
              key={sym}
              onClick={() => setSelectedBenchmark(sym)}
              className={`cursor-pointer transition-all ios-press ${
                isSelected ? "border-ios-blue shadow-md" : ""
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[17px] font-bold text-ios-text">{sym}</span>
                <span className="text-[11px] font-semibold uppercase px-2 py-0.5 rounded-full bg-ios-secondaryBg dark:bg-white/10 text-ios-secondaryText">
                  ETF
                </span>
              </div>
              <div className="text-[24px] font-bold text-ios-text leading-tight">
                {quoteLoading ? <Skeleton className="h-7 w-24" /> : `$${quoteData?.price || "..."}`}
              </div>
              <div className="flex items-center gap-1.5 mt-1.5 text-[13px] font-medium text-ios-green">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>+0.85% today</span>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Main Historical Chart */}
      <ChartCard
        title={`${selectedBenchmark} Benchmark Performance (6 Months)`}
        subtitle="Daily closing prices and volume distribution"
      >
        {historyLoading ? (
          <Skeleton className="w-full h-80" />
        ) : (
          <LineAreaChart
            dates={(historyData?.data || []).map((d: any) => d.date)}
            series={[
              {
                name: selectedBenchmark,
                data: (historyData?.data || []).map((d: any) => d.close),
                color: "#007AFF",
                area: true,
              },
            ]}
            height={360}
          />
        )}
      </ChartCard>

      {/* Sector Exposure Treemap & Market Breadth Gauge */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ChartCard
            title="S&P 500 Sector Exposure"
            subtitle="Relative weighting across market sectors"
          >
            <TreemapChart data={sectorExposure} height={320} />
          </ChartCard>
        </div>

        <div>
          <ChartCard title="Market Sentiment & Breadth" subtitle="Composite Fear & Greed Index">
            <GaugeChart value={68} title="Greed" height={260} />
            <div className="text-center text-[13px] text-ios-secondaryText mt-2">
              Breadth: 72% of components trading above 50-day SMA.
            </div>
          </ChartCard>
        </div>
      </div>
    </div>
  );
}
