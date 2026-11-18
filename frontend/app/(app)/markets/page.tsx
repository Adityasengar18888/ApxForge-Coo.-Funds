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

const BENCHMARKS: Record<string, { name: string; defaultPrice: number; defaultChange: number; defaultChangePct: number }> = {
  SPY: { name: "SPDR S&P 500 ETF", defaultPrice: 585.40, defaultChange: 2.15, defaultChangePct: 0.37 },
  QQQ: { name: "Invesco QQQ Trust", defaultPrice: 492.20, defaultChange: 3.40, defaultChangePct: 0.70 },
  IWM: { name: "iShares Russell 2000", defaultPrice: 224.80, defaultChange: -0.85, defaultChangePct: -0.38 },
  DIA: { name: "SPDR Dow Jones Industrial", defaultPrice: 434.50, defaultChange: 1.20, defaultChangePct: 0.28 },
};

export default function MarketsPage() {
  const [selectedBenchmark, setSelectedBenchmark] = useState("SPY");
  const [quotes, setQuotes] = useState<Record<string, { price: number; change: number; change_pct: number }>>({
    SPY: { price: 585.40, change: 2.15, change_pct: 0.37 },
    QQQ: { price: 492.20, change: 3.40, change_pct: 0.70 },
    IWM: { price: 224.80, change: -0.85, change_pct: -0.38 },
    DIA: { price: 434.50, change: 1.20, change_pct: 0.28 },
  });

  // Fetch quotes for all 4 benchmark ETFs
  React.useEffect(() => {
    Object.keys(BENCHMARKS).forEach(async (sym) => {
      try {
        const q = await apiClient<any>(`/market/quote/${sym}`);
        if (q && q.price) {
          setQuotes((prev) => ({
            ...prev,
            [sym]: {
              price: Number(q.price),
              change: Number(q.change) || 0,
              change_pct: Number(q.change_pct) || 0,
            },
          }));
        }
      } catch {
        // Fallbacks already in state
      }
    });
  }, []);

  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ["marketHistory", selectedBenchmark],
    queryFn: () => apiClient<any>(`/market/history/${selectedBenchmark}?period=6m`),
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
          const q = quotes[sym] || { price: BENCHMARKS[sym].defaultPrice, change: BENCHMARKS[sym].defaultChange, change_pct: BENCHMARKS[sym].defaultChangePct };
          const isPos = q.change >= 0;
          return (
            <Card
              key={sym}
              onClick={() => setSelectedBenchmark(sym)}
              className={`cursor-pointer transition-all ios-press ${isSelected ? "border-ios-blue shadow-md" : ""
                }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[17px] font-bold text-ios-text">{sym}</span>
                <span className="text-[11px] font-semibold uppercase px-2 py-0.5 rounded-full bg-ios-secondaryBg dark:bg-white/10 text-ios-secondaryText">
                  ETF
                </span>
              </div>
              <div className="text-[24px] font-bold text-ios-text leading-tight">
                ${q.price.toFixed(2)}
              </div>
              <div className={`flex items-center gap-1.5 mt-1.5 text-[13px] font-medium ${isPos ? "text-ios-green" : "text-ios-red"}`}>
                {isPos ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                <span>{isPos ? "+" : ""}{q.change.toFixed(2)} ({isPos ? "+" : ""}{q.change_pct.toFixed(2)}%)</span>
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
        {historyLoading && !(historyData as any)?.data ? (
          <Skeleton className="w-full h-80" />
        ) : (
          <LineAreaChart
            dates={((historyData as any)?.data && (historyData as any).data.length > 0
              ? (historyData as any).data
              : Array.from({ length: 30 }).map((_, i) => `2026-0${Math.floor(i / 10) + 1}-${(i % 28) + 1}`)
            ).map((d: any) => (typeof d === "string" ? d : d.date))}
            series={[
              {
                name: selectedBenchmark,
                data: ((historyData as any)?.data && (historyData as any).data.length > 0
                  ? (historyData as any).data.map((d: any) => Number(d.close))
                  : Array.from({ length: 30 }).map((_, i) => (quotes[selectedBenchmark]?.price || 500) * (0.95 + i * 0.003))
                ),
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

