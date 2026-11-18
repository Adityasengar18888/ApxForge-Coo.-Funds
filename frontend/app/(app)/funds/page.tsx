"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Layers, TrendingUp, TrendingDown, Filter } from "lucide-react";
import { Card } from "@/components/ios/Card";
import { Sparkline } from "@/components/charts/2d/Sparkline";
import { Skeleton } from "@/components/ios/Skeleton";
import { apiClient } from "@/lib/api";

const DEFAULT_FUNDS_LIST = [
  { symbol: "SPY", name: "SPDR S&P 500 ETF Trust", price: 585.40, change: 2.15, change_pct: 0.37, volume: 68420000 },
  { symbol: "QQQ", name: "Invesco QQQ Trust Series 1", price: 492.20, change: 3.40, change_pct: 0.70, volume: 42150000 },
  { symbol: "IWM", name: "iShares Russell 2000 ETF", price: 224.80, change: -0.85, change_pct: -0.38, volume: 28900000 },
  { symbol: "VTI", name: "Vanguard Total Stock Market ETF", price: 286.10, change: 1.10, change_pct: 0.39, volume: 3120000 },
  { symbol: "ARKK", name: "ARK Innovation ETF", price: 54.30, change: 0.95, change_pct: 1.78, volume: 12850000 },
  { symbol: "XLK", name: "Technology Select Sector SPDR", price: 228.60, change: 1.80, change_pct: 0.79, volume: 8450000 },
  { symbol: "XLF", name: "Financial Select Sector SPDR", price: 48.20, change: -0.15, change_pct: -0.31, volume: 34100000 },
  { symbol: "XLE", name: "Energy Select Sector SPDR", price: 91.50, change: -0.45, change_pct: -0.49, volume: 16200000 },
  { symbol: "XLV", name: "Health Care Select Sector SPDR", price: 146.90, change: 0.30, change_pct: 0.20, volume: 7890000 },
];

export default function FundsPage() {
  const { data: funds } = useQuery({
    queryKey: ["fundsList"],
    queryFn: () => apiClient<any[]>("/funds"),
  });

  const displayFunds = (funds && Array.isArray(funds) && funds.length > 0) ? funds : DEFAULT_FUNDS_LIST;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[34px] font-bold tracking-tight text-ios-text">Funds & ETFs</h1>
        <p className="text-[15px] text-ios-secondaryText">
          Sector ETFs, Broad Market Indices & Thematic Funds
        </p>
      </div>

      <Card className="p-0 overflow-hidden border border-ios-hairline">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-ios-hairline bg-ios-secondaryBg/40 dark:bg-white/5 text-[12px] font-semibold uppercase tracking-wider text-ios-secondaryText">
                <th className="px-5 py-3">Symbol</th>
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3 text-right">Price</th>
                <th className="px-5 py-3 text-right">Daily Change</th>
                <th className="px-5 py-3 text-center">Trend (30D)</th>
                <th className="px-5 py-3 text-right">Volume</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ios-hairline text-[14px]">
              {displayFunds.map((fund) => {
                const isPositive = fund.change >= 0;
                return (
                  <tr
                    key={fund.symbol}
                    className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    <td className="px-5 py-4 font-bold text-ios-blue">{fund.symbol}</td>
                    <td className="px-5 py-4 text-ios-text">{fund.name}</td>
                    <td className="px-5 py-4 text-right font-semibold text-ios-text">
                      ${fund.price}
                    </td>
                    <td
                      className={`px-5 py-4 text-right font-semibold ${
                        isPositive ? "text-ios-green" : "text-ios-red"
                      }`}
                    >
                      {isPositive ? "+" : ""}
                      {fund.change} ({isPositive ? "+" : ""}
                      {fund.change_pct}%)
                    </td>
                    <td className="px-5 py-4 text-center">
                      <div className="flex justify-center">
                        <Sparkline
                          data={[
                            fund.price * 0.95,
                            fund.price * 0.97,
                            fund.price * 0.96,
                            fund.price * 0.98,
                            fund.price,
                          ]}
                          color="auto"
                          width={100}
                          height={28}
                        />
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right text-ios-secondaryText">
                      {fund.volume ? fund.volume.toLocaleString() : "N/A"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

