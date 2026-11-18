"use client";

import React, { useState } from "react";
import { Sparkles, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { Card } from "@/components/ios/Card";
import { ChartCard } from "@/components/ios/ChartCard";
import { LineAreaChart } from "@/components/charts/2d/LineAreaChart";
import { Segmented } from "@/components/ios/Segmented";

export default function PredictionsPage() {
  const [filter, setFilter] = useState("all");

  const predictions = [
    {
      id: 1,
      symbol: "AAPL",
      model: "Random Forest Regressor v1.0",
      target_date: "2026-11-20",
      predicted: 235.4,
      actual: 236.1,
      confidence: 84,
      status: "verified",
      error: 0.7,
    },
    {
      id: 2,
      symbol: "NVDA",
      model: "Gradient Boosting v1.2",
      target_date: "2026-11-19",
      predicted: 148.2,
      actual: 147.5,
      confidence: 79,
      status: "verified",
      error: 0.7,
    },
    {
      id: 3,
      symbol: "MSFT",
      model: "XGBoost Regressor v2.0",
      target_date: "2026-11-25",
      predicted: 432.0,
      actual: null,
      confidence: 88,
      status: "pending",
      error: null,
    },
    {
      id: 4,
      symbol: "TSLA",
      model: "Directional Classifier v1.0",
      target_date: "2026-11-26",
      predicted: 224.5,
      actual: null,
      confidence: 72,
      status: "pending",
      error: null,
    },
  ];

  const filtered = filter === "all" ? predictions : predictions.filter((p) => p.status === filter);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[34px] font-bold tracking-tight text-ios-text">Predictions</h1>
          <p className="text-[15px] text-ios-secondaryText">
            Automated Accuracy Tracking, Historical Forecasts & Confidence Bounds
          </p>
        </div>

        <Segmented
          options={[
            { label: "All", value: "all" },
            { label: "Verified", value: "verified" },
            { label: "Pending", value: "pending" },
          ]}
          value={filter}
          onChange={(v) => setFilter(v)}
        />
      </div>

      {/* Persistent Disclaimer */}
      <div className="px-4 py-2.5 rounded-card bg-ios-yellow/10 border border-ios-yellow/30 text-[13px] text-ios-yellow font-medium">
        Not financial advice. Predictions are statistical estimates, not guarantees.
      </div>

      {/* Accuracy KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <div className="text-[12px] font-semibold text-ios-secondaryText uppercase tracking-wider">
            Directional Hit Rate
          </div>
          <div className="text-[24px] font-bold text-ios-green mt-1">78.5%</div>
          <div className="text-[12px] text-ios-secondaryText mt-1">Past 120 Forecasts</div>
        </Card>

        <Card>
          <div className="text-[12px] font-semibold text-ios-secondaryText uppercase tracking-wider">
            Mean Absolute Error (MAE)
          </div>
          <div className="text-[24px] font-bold text-ios-blue mt-1">$0.84</div>
          <div className="text-[12px] text-ios-secondaryText mt-1">Normalized Across Assets</div>
        </Card>

        <Card>
          <div className="text-[12px] font-semibold text-ios-secondaryText uppercase tracking-wider">
            Root Mean Squared Error
          </div>
          <div className="text-[24px] font-bold text-ios-purple mt-1">$1.18</div>
          <div className="text-[12px] text-ios-secondaryText mt-1">RMSE Performance</div>
        </Card>

        <Card>
          <div className="text-[12px] font-semibold text-ios-secondaryText uppercase tracking-wider">
            Active Pending
          </div>
          <div className="text-[24px] font-bold text-ios-orange mt-1">14</div>
          <div className="text-[12px] text-ios-secondaryText mt-1">Awaiting Market Close</div>
        </Card>
      </div>

      {/* Predictions Table */}
      <Card className="p-0 overflow-hidden border border-ios-hairline">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[14px]">
            <thead>
              <tr className="border-b border-ios-hairline bg-ios-secondaryBg/40 dark:bg-white/5 text-[12px] font-semibold uppercase tracking-wider text-ios-secondaryText">
                <th className="px-5 py-3">Symbol</th>
                <th className="px-5 py-3">Model Architecture</th>
                <th className="px-5 py-3">Target Date</th>
                <th className="px-5 py-3 text-right">Predicted</th>
                <th className="px-5 py-3 text-right">Actual</th>
                <th className="px-5 py-3 text-right">Error ($)</th>
                <th className="px-5 py-3 text-center">Confidence</th>
                <th className="px-5 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ios-hairline">
              {filtered.map((row) => (
                <tr key={row.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                  <td className="px-5 py-3.5 font-bold text-ios-blue">{row.symbol}</td>
                  <td className="px-5 py-3.5 text-ios-text">{row.model}</td>
                  <td className="px-5 py-3.5 text-ios-secondaryText font-mono">{row.target_date}</td>
                  <td className="px-5 py-3.5 text-right font-semibold text-ios-text">
                    ${row.predicted.toFixed(2)}
                  </td>
                  <td className="px-5 py-3.5 text-right font-semibold text-ios-text">
                    {row.actual ? `$${row.actual.toFixed(2)}` : "—"}
                  </td>
                  <td className="px-5 py-3.5 text-right font-mono text-ios-secondaryText">
                    {row.error !== null ? `$${row.error.toFixed(2)}` : "—"}
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <span className="px-2 py-0.5 rounded-full text-[12px] font-semibold bg-ios-blue/15 text-ios-blue">
                      {row.confidence}%
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase ${
                        row.status === "verified"
                          ? "bg-ios-green/15 text-ios-green"
                          : "bg-ios-orange/15 text-ios-orange"
                      }`}
                    >
                      {row.status === "verified" ? (
                        <CheckCircle2 className="w-3 h-3" />
                      ) : (
                        <Clock className="w-3 h-3" />
                      )}
                      <span>{row.status}</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
