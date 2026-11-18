"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  TrendingUp,
  ShieldAlert,
  Download,
  Activity,
  Layers,
  ChevronRight,
} from "lucide-react";
import { Card } from "@/components/ios/Card";
import { Segmented } from "@/components/ios/Segmented";
import { Select } from "@/components/ios/Select";
import { Button } from "@/components/ios/Button";
import { ChartCard } from "@/components/ios/ChartCard";
import { CandlestickChart } from "@/components/charts/2d/CandlestickChart";
import { LineAreaChart } from "@/components/charts/2d/LineAreaChart";
import { GaugeChart } from "@/components/charts/2d/GaugeChart";
import { RadarChart } from "@/components/charts/2d/RadarChart";
import { Skeleton } from "@/components/ios/Skeleton";
import { apiClient } from "@/lib/api";
import { formatCurrency, formatPercent } from "@/lib/format";

export default function StocksPage() {
  const [ticker, setTicker] = useState("AAPL");
  const [optionType, setOptionType] = useState<string>("call");
  const [expiryDays, setExpiryDays] = useState(30);
  const [volScenario, setVolScenario] = useState("current");
  const [pricingMode, setPricingMode] = useState("black_scholes");

  const tickers = ["AAPL", "MSFT", "NVDA", "TSLA", "AMZN", "META", "GOOGL"];

  // 1. Fetch quote
  const { data: quote, isLoading: quoteLoading } = useQuery({
    queryKey: ["stockQuote", ticker],
    queryFn: () => apiClient<any>(`/market/quote/${ticker}`),
  });

  // 2. Fetch history
  const { data: history, isLoading: historyLoading } = useQuery({
    queryKey: ["stockHistory", ticker],
    queryFn: () => apiClient<any>(`/market/history/${ticker}?period=1y`),
  });

  // 3. Fetch fundamentals
  const { data: fundamentals } = useQuery({
    queryKey: ["stockFundamentals", ticker],
    queryFn: () => apiClient<any>(`/market/fundamentals/${ticker}`),
  });

  // 4. Calculate options pricing & Greeks
  const spotPrice = quote?.price || 150.0;
  const strike = Math.round(spotPrice);
  const baseVol = history?.historical_volatility || 0.25;
  const vol = volScenario === "low" ? baseVol * 0.8 : volScenario === "high" ? baseVol * 1.2 : baseVol;

  const { data: optionCalc, isLoading: calcLoading } = useQuery({
    queryKey: ["optionCalc", spotPrice, strike, expiryDays, vol, optionType],
    queryFn: () =>
      apiClient<any>(
        `/market/price-option?spot=${spotPrice}&strike=${strike}&maturity_days=${expiryDays}&volatility=${vol}&option_type=${optionType}&risk_free_rate=0.05`
      ),
    enabled: !!spotPrice,
  });

  const exportCsv = () => {
    if (!history?.data) return;
    const headers = ["Date", "Open", "High", "Low", "Close", "Volume", "RSI", "MACD"];
    const rows = history.data.map((r: any) =>
      [r.date, r.open, r.high, r.low, r.close, r.volume, r.rsi, r.macd].join(",")
    );
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = `${ticker}_analytics.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Controls Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-[34px] font-bold tracking-tight text-ios-text">
            {ticker} Analysis & Options
          </h1>
          <p className="text-[15px] text-ios-secondaryText">
            Full Black-Scholes Pricing, Greeks, Risk Meter & Technical Indicators
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Select
            options={tickers.map((t) => ({ label: t, value: t }))}
            value={ticker}
            onChange={(e) => setTicker(e.target.value)}
            className="w-32"
          />
          <Segmented
            options={[
              { label: "Call", value: "call" },
              { label: "Put", value: "put" },
            ]}
            value={optionType}
            onChange={(val) => setOptionType(val)}
          />
          <Button variant="secondary" size="md" onClick={exportCsv} className="gap-2">
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <div className="text-[13px] font-medium text-ios-secondaryText">Spot Price</div>
          <div className="text-[24px] font-bold text-ios-text mt-1">
            {quoteLoading ? <Skeleton className="h-7 w-20" /> : `$${quote?.price}`}
          </div>
          <div className="text-[13px] font-semibold text-ios-green mt-1">
            {quote?.change_pct ? `${quote.change_pct > 0 ? "+" : ""}${quote.change_pct}%` : ""}
          </div>
        </Card>

        <Card>
          <div className="text-[13px] font-medium text-ios-secondaryText">ATM Strike (K)</div>
          <div className="text-[24px] font-bold text-ios-text mt-1">${strike}</div>
          <div className="text-[13px] text-ios-secondaryText mt-1">Expiry: {expiryDays}d</div>
        </Card>

        <Card>
          <div className="text-[13px] font-medium text-ios-secondaryText">Theoretical Price</div>
          <div className="text-[24px] font-bold text-ios-blue mt-1">
            {calcLoading ? <Skeleton className="h-7 w-20" /> : `$${optionCalc?.theoretical_price}`}
          </div>
          <div className="text-[13px] text-ios-secondaryText mt-1">Black-Scholes</div>
        </Card>

        <Card>
          <div className="text-[13px] font-medium text-ios-secondaryText">Delta Hedge</div>
          <div className="text-[24px] font-bold text-ios-indigo mt-1">
            {calcLoading ? <Skeleton className="h-7 w-20" /> : `${optionCalc?.delta_hedge_shares}`}
          </div>
          <div className="text-[13px] text-ios-secondaryText mt-1">Shares per option</div>
        </Card>
      </div>

      {/* Controls & Scenarios Bar */}
      <Card className="p-4 bg-ios-secondaryBg/40 dark:bg-white/5 border border-ios-hairline">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
          <div>
            <label className="block text-[12px] font-semibold text-ios-secondaryText mb-1">
              Time to Expiry: {expiryDays} days
            </label>
            <input
              type="range"
              min={7}
              max={365}
              value={expiryDays}
              onChange={(e) => setExpiryDays(Number(e.target.value))}
              className="w-full accent-ios-blue"
            />
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-ios-secondaryText mb-1">
              Volatility Scenario
            </label>
            <Segmented
              options={[
                { label: "Current", value: "current" },
                { label: "Low (-20%)", value: "low" },
                { label: "High (+20%)", value: "high" },
              ]}
              value={volScenario}
              onChange={(v) => setVolScenario(v)}
            />
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-ios-secondaryText mb-1">
              Pricing Engine
            </label>
            <Segmented
              options={[
                { label: "Black-Scholes", value: "black_scholes" },
                { label: "ML-Adjusted", value: "ml_adjusted" },
              ]}
              value={pricingMode}
              onChange={(v) => setPricingMode(v)}
            />
          </div>
        </div>
      </Card>

      {/* Greeks & Risk Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Greeks Table */}
        <Card className="lg:col-span-2">
          <h3 className="text-[17px] font-semibold text-ios-text mb-3">Analytical Greeks</h3>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
            <div className="p-3 rounded-control bg-ios-secondaryBg/60 dark:bg-white/5">
              <div className="text-[11px] font-semibold uppercase text-ios-secondaryText">Delta (Δ)</div>
              <div className="text-[18px] font-bold text-ios-text mt-1">{optionCalc?.greeks?.delta}</div>
            </div>
            <div className="p-3 rounded-control bg-ios-secondaryBg/60 dark:bg-white/5">
              <div className="text-[11px] font-semibold uppercase text-ios-secondaryText">Gamma (Γ)</div>
              <div className="text-[18px] font-bold text-ios-text mt-1">{optionCalc?.greeks?.gamma}</div>
            </div>
            <div className="p-3 rounded-control bg-ios-secondaryBg/60 dark:bg-white/5">
              <div className="text-[11px] font-semibold uppercase text-ios-secondaryText">Theta (Θ/day)</div>
              <div className="text-[18px] font-bold text-ios-text mt-1">{optionCalc?.greeks?.theta}</div>
            </div>
            <div className="p-3 rounded-control bg-ios-secondaryBg/60 dark:bg-white/5">
              <div className="text-[11px] font-semibold uppercase text-ios-secondaryText">Vega (ν/1%)</div>
              <div className="text-[18px] font-bold text-ios-text mt-1">{optionCalc?.greeks?.vega}</div>
            </div>
            <div className="p-3 rounded-control bg-ios-secondaryBg/60 dark:bg-white/5">
              <div className="text-[11px] font-semibold uppercase text-ios-secondaryText">Rho (ρ/1%)</div>
              <div className="text-[18px] font-bold text-ios-text mt-1">{optionCalc?.greeks?.rho}</div>
            </div>
          </div>

          {/* Payoff Curve */}
          <div className="mt-6">
            <h4 className="text-[15px] font-semibold text-ios-text mb-2">Option Payoff at Expiry</h4>
            <LineAreaChart
              dates={(optionCalc?.payoff_curve || []).map((p: any) => `$${p.price}`)}
              series={[
                {
                  name: "P&L at Expiry",
                  data: (optionCalc?.payoff_curve || []).map((p: any) => p.pnl),
                  color: "#007AFF",
                  area: true,
                },
              ]}
              height={260}
              yAxisLabel="Profit / Loss ($)"
            />
          </div>
        </Card>

        {/* Risk Meter Gauge */}
        <Card className="flex flex-col items-center justify-between text-center">
          <div className="w-full">
            <h3 className="text-[17px] font-semibold text-ios-text">ML Risk Meter</h3>
            <p className="text-[12px] text-ios-secondaryText">Weighted multi-factor score</p>
          </div>
          <div className="w-full my-auto">
            <GaugeChart value={optionCalc?.risk_score || 50} title={optionCalc?.risk_level || "RISK"} />
          </div>
          <div className="w-full pt-3 border-t border-ios-hairline text-left space-y-2">
            {optionCalc?.risk_factors &&
              Object.entries(optionCalc.risk_factors).map(([factor, score]: [string, any]) => (
                <div key={factor} className="flex items-center justify-between text-[13px]">
                  <span className="text-ios-secondaryText capitalize">{factor.replace("_", " ")}</span>
                  <span className="font-semibold text-ios-text">{score} / 100</span>
                </div>
              ))}
          </div>
        </Card>
      </div>

      {/* Candlestick & Technical Indicators Chart */}
      <ChartCard
        title={`${ticker} Technical Price Action & Volume`}
        subtitle="Daily Candlestick with RSI, MACD & Bollinger Bands"
      >
        {historyLoading ? (
          <Skeleton className="w-full h-96" />
        ) : (
          <CandlestickChart data={history?.data || []} height={420} />
        )}
      </ChartCard>
    </div>
  );
}

