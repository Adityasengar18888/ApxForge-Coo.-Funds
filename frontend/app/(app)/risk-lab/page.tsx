"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ShieldAlert, Activity, AlertTriangle, TrendingDown } from "lucide-react";
import { Card } from "@/components/ios/Card";
import { Select } from "@/components/ios/Select";
import { ChartCard } from "@/components/ios/ChartCard";
import { GaugeChart } from "@/components/charts/2d/GaugeChart";
import { LineAreaChart } from "@/components/charts/2d/LineAreaChart";
import { apiClient } from "@/lib/api";

export default function RiskLabPage() {
  const [symbol, setSymbol] = useState("AAPL");

  const { data: quote } = useQuery({
    queryKey: ["riskQuote", symbol],
    queryFn: () => apiClient<any>(`/market/quote/${symbol}`),
  });

  const { data: optionData, isLoading } = useQuery({
    queryKey: ["riskOption", symbol],
    queryFn: () =>
      apiClient<any>(
        `/market/price-option?spot=180&strike=180&maturity_days=30&volatility=0.25&option_type=call`
      ),
  });

  const stressScenarios = [
    { name: "Market Crash (-20%)", delta: "-35.2%", risk: "Critical" },
    { name: "Volatility Spike (+50%)", delta: "+18.4%", risk: "High" },
    { name: "Time Decay (7 Days Elapsed)", delta: "-8.1%", risk: "Moderate" },
    { name: "Combined Stress Shock", delta: "-42.6%", risk: "Critical" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[34px] font-bold tracking-tight text-ios-text">Risk Lab</h1>
          <p className="text-[15px] text-ios-secondaryText">
            Value at Risk (VaR), Stress Scenarios, Greeks Sensitivity & Drawdown
          </p>
        </div>

        <Select
          options={[
            { label: "AAPL", value: "AAPL" },
            { label: "NVDA", value: "NVDA" },
            { label: "MSFT", value: "MSFT" },
            { label: "TSLA", value: "TSLA" },
          ]}
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          className="w-36"
        />
      </div>

      {/* Top Risk Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="text-[13px] text-ios-secondaryText">Value at Risk (95% Daily)</div>
          <div className="text-[24px] font-bold text-ios-red mt-1">$482.50</div>
          <div className="text-[12px] text-ios-secondaryText mt-1">Parametric 1-Day VaR</div>
        </Card>

        <Card>
          <div className="text-[13px] text-ios-secondaryText">Sharpe Ratio</div>
          <div className="text-[24px] font-bold text-ios-green mt-1">1.84</div>
          <div className="text-[12px] text-ios-secondaryText mt-1">Rf = 5.0% (Annualized)</div>
        </Card>

        <Card>
          <div className="text-[13px] text-ios-secondaryText">Sortino Ratio</div>
          <div className="text-[24px] font-bold text-ios-blue mt-1">2.41</div>
          <div className="text-[12px] text-ios-secondaryText mt-1">Downside Deviation adjusted</div>
        </Card>

        <Card>
          <div className="text-[13px] text-ios-secondaryText">Max Historical Drawdown</div>
          <div className="text-[24px] font-bold text-ios-red mt-1">-18.6%</div>
          <div className="text-[12px] text-ios-secondaryText mt-1">Peak-to-Trough 1Y</div>
        </Card>
      </div>

      {/* Risk Gauge & Factor Decomposition */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="flex flex-col items-center justify-between text-center p-6">
          <div className="w-full">
            <h3 className="text-[18px] font-bold text-ios-text">Composite Risk Score</h3>
            <p className="text-[13px] text-ios-secondaryText">ML-weighted risk assessment</p>
          </div>
          <div className="w-full my-4">
            <GaugeChart value={optionData?.risk_score || 58} title="RISK INDEX" height={240} />
          </div>
          <div className="px-4 py-2 rounded-full bg-ios-orange/15 text-ios-orange font-semibold text-[13px]">
            MODERATE RISK LEVEL
          </div>
        </Card>

        {/* Stress Testing Scenarios Table */}
        <Card className="lg:col-span-2 p-6">
          <h3 className="text-[18px] font-bold text-ios-text mb-4">Macro Stress Testing Scenarios</h3>
          <div className="space-y-3">
            {stressScenarios.map((scen) => (
              <div
                key={scen.name}
                className="flex items-center justify-between p-3.5 rounded-control bg-ios-secondaryBg/50 dark:bg-white/5 border border-ios-hairline"
              >
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-4 h-4 text-ios-orange flex-shrink-0" />
                  <div>
                    <div className="text-[15px] font-semibold text-ios-text">{scen.name}</div>
                    <div className="text-[12px] text-ios-secondaryText">
                      Portfolio Shock Simulation
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[16px] font-bold text-ios-red">{scen.delta}</div>
                  <div className="text-[11px] font-semibold text-ios-secondaryText uppercase">
                    {scen.risk}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

