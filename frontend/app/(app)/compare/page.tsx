"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeftRight, Plus, X } from "lucide-react";
import { Card } from "@/components/ios/Card";
import { Button } from "@/components/ios/Button";
import { Input } from "@/components/ios/Input";
import { ChartCard } from "@/components/ios/ChartCard";
import { LineAreaChart } from "@/components/charts/2d/LineAreaChart";
import { Skeleton } from "@/components/ios/Skeleton";
import { apiClient } from "@/lib/api";

export default function ComparePage() {
  const [symbols, setSymbols] = useState<string[]>(["AAPL", "MSFT", "NVDA"]);
  const [inputSymbol, setInputSymbol] = useState("");

  const symbolsParam = symbols.join(",");

  const { data, isLoading } = useQuery({
    queryKey: ["compareSymbols", symbolsParam],
    queryFn: () => apiClient<any>(`/compare/?symbols=${symbolsParam}`),
    enabled: symbols.length > 0,
  });

  const addSymbol = () => {
    const s = inputSymbol.trim().toUpperCase();
    if (s && !symbols.includes(s) && symbols.length < 5) {
      setSymbols([...symbols, s]);
      setInputSymbol("");
    }
  };

  const removeSymbol = (s: string) => {
    if (symbols.length > 1) {
      setSymbols(symbols.filter((item) => item !== s));
    }
  };

  const colors = ["#007AFF", "#34C759", "#AF52DE", "#FF9500", "#FF2D55"];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[34px] font-bold tracking-tight text-ios-text">Asset Comparison</h1>
        <p className="text-[15px] text-ios-secondaryText">
          Compare up to 5 securities with base-100 normalized historical performance
        </p>
      </div>

      {/* Symbol Chips & Adder */}
      <div className="flex flex-wrap items-center gap-3">
        {symbols.map((sym, idx) => (
          <div
            key={sym}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-ios-card shadow-sm border border-ios-hairline text-[14px] font-semibold text-ios-text"
          >
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: colors[idx % colors.length] }}
            />
            <span>{sym}</span>
            {symbols.length > 1 && (
              <button
                type="button"
                onClick={() => removeSymbol(sym)}
                className="text-ios-secondaryText hover:text-ios-red transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ))}

        {symbols.length < 5 && (
          <div className="flex items-center gap-2">
            <Input
              placeholder="Add symbol (e.g. TSLA)"
              value={inputSymbol}
              onChange={(e) => setInputSymbol(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addSymbol()}
              className="w-48 py-1.5 text-[13px]"
            />
            <Button variant="secondary" size="sm" onClick={addSymbol} className="gap-1">
              <Plus className="w-4 h-4" />
              Add
            </Button>
          </div>
        )}
      </div>

      {/* Normalized Chart */}
      <ChartCard
        title="Normalized Performance (Base 100)"
        subtitle="1-Year daily compounded relative returns"
      >
        {isLoading ? (
          <Skeleton className="w-full h-80" />
        ) : (
          <LineAreaChart
            dates={(data?.timeline || []).map((t: any) => t.date)}
            series={symbols.map((sym, idx) => ({
              name: sym,
              data: (data?.timeline || []).map((t: any) => t[sym] || 100),
              color: colors[idx % colors.length],
            }))}
            height={380}
            yAxisLabel="Normalized Level"
          />
        )}
      </ChartCard>

      {/* Summary Performance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {(data?.summaries || []).map((summary: any, idx: number) => {
          const isUp = summary.total_return_pct >= 0;
          return (
            <Card key={summary.symbol}>
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: colors[idx % colors.length] }}
                />
                <h3 className="text-[17px] font-bold text-ios-text">{summary.symbol}</h3>
              </div>
              <div className="text-[13px] text-ios-secondaryText">1Y Total Return</div>
              <div
                className={`text-[20px] font-bold mt-0.5 ${isUp ? "text-ios-green" : "text-ios-red"
                  }`}
              >
                {isUp ? "+" : ""}
                {summary.total_return_pct}%
              </div>
              <div className="text-[12px] text-ios-secondaryText mt-1">
                CAGR: {summary.annualized_return_pct}%
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

