"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Filter, Bookmark, RefreshCw } from "lucide-react";
import { Card } from "@/components/ios/Card";
import { Input } from "@/components/ios/Input";
import { Select } from "@/components/ios/Select";
import { Button } from "@/components/ios/Button";
import { Skeleton } from "@/components/ios/Skeleton";
import { apiClient } from "@/lib/api";

export default function ScreenerPage() {
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minVolume, setMinVolume] = useState("");
  const [maxPe, setMaxPe] = useState("");
  const [sector, setSector] = useState("");

  const queryParams = new URLSearchParams();
  if (minPrice) queryParams.set("min_price", minPrice);
  if (maxPrice) queryParams.set("max_price", maxPrice);
  if (minVolume) queryParams.set("min_volume", minVolume);
  if (maxPe) queryParams.set("max_pe", maxPe);
  if (sector && sector !== "all") queryParams.set("sector", sector);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["screener", queryParams.toString()],
    queryFn: () => apiClient<any>(`/screener/?${queryParams.toString()}`),
  });

  const { data: presets } = useQuery({
    queryKey: ["screenerPresets"],
    queryFn: () => apiClient<any[]>("/screener/presets"),
  });

  const applyPreset = (p: any) => {
    if (p.filters.min_price) setMinPrice(String(p.filters.min_price));
    if (p.filters.max_price) setMaxPrice(String(p.filters.max_price));
    if (p.filters.min_volume) setMinVolume(String(p.filters.min_volume));
    if (p.filters.max_pe) setMaxPe(String(p.filters.max_pe));
    if (p.filters.sector) setSector(p.filters.sector);
  };

  const resetFilters = () => {
    setMinPrice("");
    setMaxPrice("");
    setMinVolume("");
    setMaxPe("");
    setSector("");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[34px] font-bold tracking-tight text-ios-text">Asset Screener</h1>
        <p className="text-[15px] text-ios-secondaryText">
          SQL-Safe Filter Builder with Saved Presets
        </p>
      </div>

      {/* Preset Pills */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[12px] font-semibold text-ios-secondaryText uppercase tracking-wider mr-1">
          Presets:
        </span>
        {(presets || []).map((preset) => (
          <button
            key={preset.name}
            type="button"
            onClick={() => applyPreset(preset)}
            className="px-3 py-1.5 rounded-full bg-ios-secondaryBg dark:bg-white/10 hover:bg-ios-blue/15 hover:text-ios-blue text-[13px] font-medium text-ios-text transition-colors ios-press border border-ios-hairline"
          >
            {preset.name}
          </button>
        ))}
        <button
          type="button"
          onClick={resetFilters}
          className="px-3 py-1.5 rounded-full text-ios-secondaryText hover:text-ios-text text-[13px] font-medium transition-colors"
        >
          Reset
        </button>
      </div>

      {/* Filter Control Box */}
      <Card className="p-5 border border-ios-hairline">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Input
            label="Min Price ($)"
            type="number"
            placeholder="0"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
          />
          <Input
            label="Max Price ($)"
            type="number"
            placeholder="500"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
          />
          <Input
            label="Min Volume"
            type="number"
            placeholder="1000000"
            value={minVolume}
            onChange={(e) => setMinVolume(e.target.value)}
          />
          <Input
            label="Max P/E Ratio"
            type="number"
            placeholder="35"
            value={maxPe}
            onChange={(e) => setMaxPe(e.target.value)}
          />
          <Select
            label="Sector"
            options={[
              { label: "All Sectors", value: "all" },
              { label: "Technology", value: "Technology" },
              { label: "Financials", value: "Financials" },
              { label: "Health Care", value: "Health Care" },
              { label: "Consumer", value: "Consumer" },
            ]}
            value={sector}
            onChange={(e) => setSector(e.target.value)}
          />
        </div>
      </Card>

      {/* Results Table */}
      <Card className="p-0 overflow-hidden border border-ios-hairline">
        <div className="px-5 py-3 border-b border-ios-hairline flex items-center justify-between">
          <span className="text-[13px] font-semibold text-ios-secondaryText">
            Results ({data?.total || 0} matches)
          </span>
          <Button variant="secondary" size="sm" onClick={() => refetch()} className="gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-ios-hairline bg-ios-secondaryBg/40 dark:bg-white/5 text-[12px] font-semibold uppercase tracking-wider text-ios-secondaryText">
                <th className="px-5 py-3">Symbol</th>
                <th className="px-5 py-3 text-right">Price</th>
                <th className="px-5 py-3 text-right">Change</th>
                <th className="px-5 py-3 text-right">Volume</th>
                <th className="px-5 py-3 text-right">P/E Ratio</th>
                <th className="px-5 py-3">Sector</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ios-hairline text-[14px]">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6} className="px-5 py-4">
                      <Skeleton className="h-5 w-full" />
                    </td>
                  </tr>
                ))
              ) : (data?.results || []).length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-ios-secondaryText">
                    No securities match the selected screener criteria.
                  </td>
                </tr>
              ) : (
                (data?.results || []).map((row: any) => (
                  <tr
                    key={row.symbol}
                    className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    <td className="px-5 py-4 font-bold text-ios-blue">{row.symbol}</td>
                    <td className="px-5 py-4 text-right font-semibold text-ios-text">
                      ${row.price}
                    </td>
                    <td
                      className={`px-5 py-4 text-right font-semibold ${
                        row.change >= 0 ? "text-ios-green" : "text-ios-red"
                      }`}
                    >
                      {row.change >= 0 ? "+" : ""}
                      {row.change} ({row.change_pct}%)
                    </td>
                    <td className="px-5 py-4 text-right text-ios-secondaryText">
                      {row.volume.toLocaleString()}
                    </td>
                    <td className="px-5 py-4 text-right text-ios-text">{row.pe_ratio}</td>
                    <td className="px-5 py-4 text-ios-secondaryText">{row.sector}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
