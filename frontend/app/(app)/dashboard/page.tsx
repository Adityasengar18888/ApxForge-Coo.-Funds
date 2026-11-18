"use client";

import React from "react";
import Link from "next/link";
import {
  TrendingUp,
  ShieldAlert,
  Sparkles,
  BarChart2,
  Binary,
  Layers,
  ArrowRight,
} from "lucide-react";
import { Card } from "@/components/ios/Card";
import { List, ListRow } from "@/components/ios/List";
import { ChartCard } from "@/components/ios/ChartCard";

export default function DashboardPage() {
  const quickTiles = [
    { name: "Options & Pricing", desc: "Black-Scholes, Greeks, and Hedging", href: "/stocks", icon: BarChart2, color: "text-ios-blue" },
    { name: "Risk Meter", desc: "Live ML-adjusted risk assessment", href: "/risk-lab", icon: ShieldAlert, color: "text-ios-red" },
    { name: "Machine Learning Lab", desc: "Multi-model training and predictions", href: "/model-lab", icon: Sparkles, color: "text-ios-purple" },
    { name: "Statistics Lab", desc: "Hypothesis testing and ANOVA", href: "/stats-lab", icon: Binary, color: "text-ios-teal" },
    { name: "Market Overview", desc: "Broad market indices and sentiment", href: "/markets", icon: TrendingUp, color: "text-ios-green" },
    { name: "Funds & ETFs", desc: "Sector and thematic ETF analytics", href: "/funds", icon: Layers, color: "text-ios-indigo" },
  ];

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-[34px] font-bold tracking-tight text-ios-text">Dashboard</h1>
        <p className="text-[15px] text-ios-secondaryText">
          ApxForge Quantitative Analytics & Risk Engine
        </p>
      </div>

      {/* Persistent Disclaimer as requested in Guardrails */}
      <div className="px-4 py-2.5 rounded-card bg-ios-yellow/10 border border-ios-yellow/30 text-[13px] text-ios-yellow font-medium">
        Not financial advice. Predictions are statistical estimates, not guarantees.
      </div>

      {/* Quick Launch Shortcut Grid */}
      <div>
        <div className="px-1 pb-2 text-[11px] font-semibold tracking-wider uppercase text-ios-secondaryText">
          Quick Access
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickTiles.map((tile) => {
            const Icon = tile.icon;
            return (
              <Link key={tile.href} href={tile.href} className="block group">
                <Card className="h-full p-4 hover:shadow-md transition-all ios-press border border-ios-hairline group-hover:border-ios-blue/40">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-control bg-ios-secondaryBg dark:bg-white/10 ${tile.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-[16px] font-semibold text-ios-text group-hover:text-ios-blue transition-colors">
                          {tile.name}
                        </h3>
                        <p className="text-[13px] text-ios-secondaryText mt-0.5 line-clamp-1">
                          {tile.desc}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-ios-secondaryText group-hover:text-ios-blue group-hover:translate-x-1 transition-all" />
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

