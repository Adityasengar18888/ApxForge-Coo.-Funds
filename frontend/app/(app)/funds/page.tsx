"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Layers, TrendingUp, TrendingDown, Filter } from "lucide-react";
import { Card } from "@/components/ios/Card";
import { Sparkline } from "@/components/charts/2d/Sparkline";
import { Skeleton } from "@/components/ios/Skeleton";
import { apiClient } from "@/lib/api";

export default function FundsPage() {
  const { data: funds, isLoading } = useQuery({
    queryKey: ["fundsList"],
    queryFn: () => apiClient<any[]>("/funds/"),
  });

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
              {isLoading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={6} className="px-5 py-4">
                        <Skeleton className="h-5 w-full" />
                      </td>
                    </tr>
                  ))
                : (funds || []).map((fund) => {
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
