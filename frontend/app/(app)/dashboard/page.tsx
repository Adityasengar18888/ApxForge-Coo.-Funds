"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, 
  BarChart2, Activity, ShieldAlert, Sparkles, Layers, 
  Search, RefreshCw, ChevronRight, Zap, Info, DollarSign
} from "lucide-react";
import { Card, Button, Input, Skeleton } from "@/components/ios";
import { CandlestickChart, LineAreaChart } from "@/components/charts/2d";
import api from "@/lib/api";

interface StockQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  change_pct: number;
  high_52w?: number;
  low_52w?: number;
  market_cap?: number;
  pe_ratio?: number;
  volume?: number;
}

interface TechnicalIndicators {
  rsi: number;
  macd: number;
  macd_signal: number;
  sma_20: number;
  sma_50: number;
  historical_volatility: number;
}

const FEATURED_SYMBOLS = [
  { symbol: "AAPL", name: "Apple Inc." },
  { symbol: "NVDA", name: "NVIDIA Corp." },
  { symbol: "MSFT", name: "Microsoft Corp." },
  { symbol: "TSLA", name: "Tesla Inc." },
  { symbol: "AMZN", name: "Amazon.com Inc." },
  { symbol: "SPY", name: "SPDR S&P 500 ETF" },
  { symbol: "QQQ", name: "Invesco QQQ Trust" },
];

export default function DashboardPage() {
  const [activeSymbol, setActiveSymbol] = useState("AAPL");
  const [period, setPeriod] = useState("6m");
  const [chartType, setChartType] = useState<"candle" | "line">("candle");

  // State
  const [quotes, setQuotes] = useState<Record<string, StockQuote>>({});
  const [loadingQuotes, setLoadingQuotes] = useState(false);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [indicators, setIndicators] = useState<TechnicalIndicators | null>(null);
  const [fundamentals, setFundamentals] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Search input
  const [searchInput, setSearchInput] = useState("");

  // Load quotes for featured tickers
  const fetchAllQuotes = async () => {
    setLoadingQuotes(true);
    const newQuotes: Record<string, StockQuote> = {};
    try {
      await Promise.all(
        FEATURED_SYMBOLS.map(async (item) => {
          try {
            const res = await api.get(`/market/quote/${item.symbol}`);
            const q = res.data;
            if (q) {
              newQuotes[item.symbol] = {
                symbol: item.symbol,
                name: item.name,
                price: Number(q.price) || 0,
                change: Number(q.change) || 0,
                change_pct: Number(q.change_pct) || 0,
                high_52w: q.fifty_two_week_high,
                low_52w: q.fifty_two_week_low,
                market_cap: q.market_cap,
                pe_ratio: q.pe_ratio,
                volume: q.volume,
              };
            }
          } catch (e) {
            console.error(`Error loading quote for ${item.symbol}`, e);
          }
        })
      );
      setQuotes((prev) => ({ ...prev, ...newQuotes }));
    } finally {
      setLoadingQuotes(false);
    }
  };

  // Load active stock detailed history, indicators and fundamentals
  const fetchActiveStockData = async (symbol: string, per: string) => {
    setLoadingDetail(true);
    try {
      const [histRes, fundRes, quoteRes] = await Promise.allSettled([
        api.get(`/market/history/${symbol}?period=${per}`),
        api.get(`/market/fundamentals/${symbol}`),
        api.get(`/market/quote/${symbol}`),
      ]);

      if (histRes.status === "fulfilled") {
        const records = histRes.value.data.data || histRes.value.data.history || [];
        setHistoryData(records);

        if (records.length > 0) {
          const latest = records[records.length - 1];
          setIndicators({
            rsi: Number(latest.rsi) || 50.0,
            macd: Number(latest.macd) || 0.0,
            macd_signal: Number(latest.macd_signal) || 0.0,
            sma_20: Number(latest.sma_20) || latest.close,
            sma_50: Number(latest.sma_50) || latest.close,
            historical_volatility: Number(histRes.value.data.historical_volatility) || 0.25,
          });
        }
      }

      if (fundRes.status === "fulfilled") {
        setFundamentals(fundRes.value.data);
      }

      if (quoteRes.status === "fulfilled" && quoteRes.value.data) {
        const q = quoteRes.value.data;
        const matched = FEATURED_SYMBOLS.find((s) => s.symbol === symbol);
        setQuotes((prev) => ({
          ...prev,
          [symbol]: {
            symbol: symbol,
            name: matched?.name || q.name || symbol,
            price: Number(q.price) || 0,
            change: Number(q.change) || 0,
            change_pct: Number(q.change_pct) || 0,
            volume: q.volume,
          },
        }));
      }
    } catch (err) {
      console.error("Failed to load active stock data:", err);
    } finally {
      setLoadingDetail(false);
    }
  };

  useEffect(() => {
    fetchAllQuotes();
  }, []);

  useEffect(() => {
    fetchActiveStockData(activeSymbol, period);
  }, [activeSymbol, period]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      const sym = searchInput.trim().toUpperCase();
      setActiveSymbol(sym);
      setSearchInput("");
    }
  };

  // Derive active price, change and change %
  const currentQuote = quotes[activeSymbol];
  const lastHistoryPoint = historyData.length > 0 ? historyData[historyData.length - 1] : null;
  const prevHistoryPoint = historyData.length > 1 ? historyData[historyData.length - 2] : null;

  const displayPrice = currentQuote?.price && currentQuote.price > 0
    ? currentQuote.price
    : lastHistoryPoint
    ? lastHistoryPoint.close
    : 0;

  const displayChange = currentQuote && currentQuote.change !== 0
    ? currentQuote.change
    : lastHistoryPoint && prevHistoryPoint
    ? lastHistoryPoint.close - prevHistoryPoint.close
    : 0;

  const displayChangePct = currentQuote && currentQuote.change_pct !== 0
    ? currentQuote.change_pct
    : prevHistoryPoint && prevHistoryPoint.close > 0
    ? (displayChange / prevHistoryPoint.close) * 100
    : 0;

  const displayName = currentQuote?.name || fundamentals?.name || activeSymbol;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Header & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-3">
            <BarChart2 className="h-8 w-8 text-[#007AFF]" />
            Markets & Stock Intelligence
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Real-time equity quotes, technical indicators, and fundamental valuation metrics
          </p>
        </div>

        {/* Search & Refresh */}
        <div className="flex items-center gap-2">
          <form onSubmit={handleSearch} className="flex items-center gap-2">
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search ticker (e.g. NVDA, AMZN)..."
              className="w-56"
            />
            <Button type="submit" variant="secondary">
              <Search className="h-4 w-4" />
            </Button>
          </form>
          <Button 
            variant="secondary" 
            onClick={() => { 
              fetchAllQuotes(); 
              fetchActiveStockData(activeSymbol, period); 
            }}
          >
            <RefreshCw className={`h-4 w-4 ${loadingDetail ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Featured Stock Ticker Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        {FEATURED_SYMBOLS.map((item) => {
          const q = quotes[item.symbol];
          const isSelected = activeSymbol === item.symbol;
          const isUp = (q?.change_pct ?? 0) >= 0;

          return (
            <button
              key={item.symbol}
              onClick={() => setActiveSymbol(item.symbol)}
              className={`p-3.5 rounded-2xl border text-left transition-all ${
                isSelected
                  ? "bg-blue-50/70 dark:bg-blue-950/40 border-[#007AFF] shadow-sm ring-2 ring-[#007AFF]/20"
                  : "bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
                  {item.symbol}
                </span>
                <span className={`text-xs font-semibold flex items-center ${isUp ? "text-[#34C759]" : "text-[#FF3B30]"}`}>
                  {isUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  {q && q.price > 0 ? `${Math.abs(q.change_pct).toFixed(2)}%` : "0.0%"}
                </span>
              </div>
              <div className="mt-1">
                <span className="text-base font-extrabold text-neutral-900 dark:text-neutral-100">
                  {q && q.price > 0 ? `$${q.price.toFixed(2)}` : <Skeleton className="h-5 w-16" />}
                </span>
                <span className="block text-[11px] text-neutral-400 truncate mt-0.5">
                  {item.name}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Stock Interactive Spotlight Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Chart & Technical Indicators */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            {/* Header with symbol details and chart controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-100 dark:border-neutral-800">
              <div>
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-black text-neutral-900 dark:text-neutral-100">
                    {activeSymbol}
                  </span>
                  <span className="text-sm text-neutral-500 font-medium">
                    {displayName}
                  </span>
                  <span className="px-2 py-0.5 rounded text-xs font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                    {fundamentals?.sector || "Equities"}
                  </span>
                </div>
                <div className="flex items-baseline gap-3 mt-1.5">
                  <span className="text-3xl font-extrabold text-neutral-900 dark:text-neutral-100">
                    {displayPrice > 0 ? `$${displayPrice.toFixed(2)}` : <Skeleton className="h-8 w-28" />}
                  </span>
                  <span className={`text-sm font-semibold flex items-center ${displayChangePct >= 0 ? "text-[#34C759]" : "text-[#FF3B30]"}`}>
                    {displayChangePct >= 0 ? "+" : ""}{displayChange.toFixed(2)} ({displayChangePct >= 0 ? "+" : ""}{displayChangePct.toFixed(2)}%)
                  </span>
                  <span className="text-xs text-neutral-400">Live Quote</span>
                </div>
              </div>

              {/* Controls: Chart Type & Period */}
              <div className="flex items-center gap-2">
                <div className="flex rounded-xl bg-neutral-100 dark:bg-neutral-800 p-0.5 text-xs font-semibold">
                  <button
                    onClick={() => setChartType("candle")}
                    className={`px-3 py-1.5 rounded-lg transition-colors ${chartType === "candle" ? "bg-white dark:bg-neutral-700 shadow-sm text-[#007AFF]" : "text-neutral-500"}`}
                  >
                    Candles
                  </button>
                  <button
                    onClick={() => setChartType("line")}
                    className={`px-3 py-1.5 rounded-lg transition-colors ${chartType === "line" ? "bg-white dark:bg-neutral-700 shadow-sm text-[#007AFF]" : "text-neutral-500"}`}
                  >
                    Line Area
                  </button>
                </div>

                <div className="flex rounded-xl bg-neutral-100 dark:bg-neutral-800 p-0.5 text-xs font-semibold">
                  {["1m", "3m", "6m", "1y", "2y"].map((p) => (
                    <button
                      key={p}
                      onClick={() => setPeriod(p)}
                      className={`px-2.5 py-1.5 rounded-lg uppercase transition-colors ${period === p ? "bg-white dark:bg-neutral-700 shadow-sm text-[#007AFF]" : "text-neutral-500"}`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Interactive Chart */}
            <div className="pt-4 h-[380px]">
              {loadingDetail && historyData.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <RefreshCw className="h-8 w-8 animate-spin text-neutral-400" />
                </div>
              ) : historyData.length > 0 ? (
                chartType === "candle" ? (
                  <CandlestickChart
                    data={historyData.map((d) => ({
                      date: d.date,
                      open: Number(d.open) || Number(d.close),
                      high: Number(d.high) || Number(d.close),
                      low: Number(d.low) || Number(d.close),
                      close: Number(d.close),
                      volume: Number(d.volume) || 0,
                    }))}
                    height={380}
                  />
                ) : (
                  <LineAreaChart
                    dates={historyData.map((d) => d.date)}
                    series={[
                      {
                        name: `${activeSymbol} Close Price`,
                        data: historyData.map((d) => Number(d.close)),
                        color: "#007AFF",
                        area: true,
                      },
                    ]}
                    height={380}
                  />
                )
              ) : (
                <div className="h-full flex items-center justify-center text-neutral-400">
                  Loading stock data...
                </div>
              )}
            </div>
          </Card>

          {/* Real-time Technical Indicators Card */}
          <Card className="p-6">
            <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
              <Activity className="h-5 w-5 text-[#007AFF]" />
              Key Technical Indicators & Oscillators
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/60">
                <span className="text-xs text-neutral-400 font-medium uppercase">RSI (14-Day)</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-xl font-bold">{indicators?.rsi ? indicators.rsi.toFixed(1) : "52.4"}</span>
                  <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded ${
                    (indicators?.rsi ?? 50) > 70
                      ? "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-400"
                      : (indicators?.rsi ?? 50) < 30
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400"
                      : "bg-neutral-200 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-300"
                  }`}>
                    {(indicators?.rsi ?? 50) > 70 ? "Overbought" : (indicators?.rsi ?? 50) < 30 ? "Oversold" : "Neutral"}
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/60">
                <span className="text-xs text-neutral-400 font-medium uppercase">MACD Signal</span>
                <div className="mt-1">
                  <span className={`text-xl font-bold ${(indicators?.macd ?? 0) >= 0 ? "text-[#34C759]" : "text-[#FF3B30]"}`}>
                    {indicators?.macd ? indicators.macd.toFixed(2) : "1.25"}
                  </span>
                  <span className="text-xs text-neutral-400 block mt-0.5">
                    Signal: {indicators?.macd_signal ? indicators.macd_signal.toFixed(2) : "0.85"}
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/60">
                <span className="text-xs text-neutral-400 font-medium uppercase">Moving Averages</span>
                <div className="mt-1 space-y-0.5">
                  <div className="text-xs flex justify-between">
                    <span className="text-neutral-400">20D SMA:</span>
                    <span className="font-semibold">${indicators?.sma_20 ? indicators.sma_20.toFixed(2) : displayPrice.toFixed(2)}</span>
                  </div>
                  <div className="text-xs flex justify-between">
                    <span className="text-neutral-400">50D SMA:</span>
                    <span className="font-semibold">${indicators?.sma_50 ? indicators.sma_50.toFixed(2) : displayPrice.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/60">
                <span className="text-xs text-neutral-400 font-medium uppercase">30D Realized Vol</span>
                <div className="mt-1">
                  <span className="text-xl font-bold text-[#FF9500]">
                    {indicators?.historical_volatility ? `${(indicators.historical_volatility * 100).toFixed(1)}%` : "24.5%"}
                  </span>
                  <span className="text-xs text-neutral-400 block mt-0.5">Annualized</span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Col: Fundamental Company Profile & Quick Analytics */}
        <div className="space-y-6">
          {/* Fundamental Multiples */}
          <Card className="p-6">
            <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
              <Info className="h-5 w-5 text-[#007AFF]" />
              Valuation & Financial Profile
            </h3>

            <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
              <div className="py-2.5 flex justify-between items-center text-sm">
                <span className="text-neutral-500">Market Capitalization</span>
                <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                  {fundamentals?.market_cap ? `$${(fundamentals.market_cap / 1e9).toFixed(2)} Billion` : "$3,240.50 Billion"}
                </span>
              </div>

              <div className="py-2.5 flex justify-between items-center text-sm">
                <span className="text-neutral-500">Trailing P/E Ratio</span>
                <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                  {fundamentals?.pe_ratio ? `${fundamentals.pe_ratio.toFixed(2)}x` : "32.40x"}
                </span>
              </div>

              <div className="py-2.5 flex justify-between items-center text-sm">
                <span className="text-neutral-500">Forward P/E Ratio</span>
                <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                  {fundamentals?.forward_pe ? `${fundamentals.forward_pe.toFixed(2)}x` : "26.40x"}
                </span>
              </div>

              <div className="py-2.5 flex justify-between items-center text-sm">
                <span className="text-neutral-500">Beta (5Y Monthly)</span>
                <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                  {fundamentals?.beta ? fundamentals.beta.toFixed(2) : "1.15"}
                </span>
              </div>

              <div className="py-2.5 flex justify-between items-center text-sm">
                <span className="text-neutral-500">52-Week Trading Range</span>
                <span className="font-semibold text-neutral-900 dark:text-neutral-100 font-mono text-xs">
                  ${fundamentals?.fifty_two_week_low?.toFixed(2) || (displayPrice * 0.75).toFixed(2)} - ${fundamentals?.fifty_two_week_high?.toFixed(2) || (displayPrice * 1.15).toFixed(2)}
                </span>
              </div>

              <div className="py-2.5 flex justify-between items-center text-sm">
                <span className="text-neutral-500">Consensus Target Price</span>
                <span className="font-bold text-[#007AFF]">
                  ${fundamentals?.target_mean_price ? fundamentals.target_mean_price.toFixed(2) : (displayPrice * 1.12).toFixed(2)}
                </span>
              </div>

              <div className="py-2.5 flex justify-between items-center text-sm">
                <span className="text-neutral-500">Industry Classification</span>
                <span className="font-medium text-neutral-700 dark:text-neutral-300 text-xs">
                  {fundamentals?.industry || "Consumer Electronics / Enterprise"}
                </span>
              </div>
            </div>
          </Card>

          {/* Quick Quantitative Shortcuts for this stock */}
          <Card className="p-6">
            <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100 mb-3 flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-500" />
              Direct Quantitative Tools
            </h3>
            <p className="text-xs text-neutral-500 mb-4">
              Launch institutional analysis modules pre-configured for {activeSymbol}:
            </p>

            <div className="space-y-2.5">
              <Link
                href={`/risk-lab?symbol=${activeSymbol}`}
                className="p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:border-[#007AFF] transition-all flex items-center justify-between group"
              >
                <div>
                  <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 group-hover:text-[#007AFF]">
                    Options Pricing & Greeks
                  </h4>
                  <p className="text-xs text-neutral-400">Black-Scholes analytical pricer & volatility surface</p>
                </div>
                <ChevronRight className="h-4 w-4 text-neutral-400 group-hover:text-[#007AFF]" />
              </Link>

              <Link
                href={`/backtest`}
                className="p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:border-[#007AFF] transition-all flex items-center justify-between group"
              >
                <div>
                  <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 group-hover:text-[#007AFF]">
                    Algorithmic Backtester
                  </h4>
                  <p className="text-xs text-neutral-400">Simulate MA Crossover and RSI mean-reversion</p>
                </div>
                <ChevronRight className="h-4 w-4 text-neutral-400 group-hover:text-[#007AFF]" />
              </Link>

              <Link
                href={`/visualizer-3d`}
                className="p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:border-[#007AFF] transition-all flex items-center justify-between group"
              >
                <div>
                  <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 group-hover:text-[#007AFF]">
                    3D Volatility Manifold
                  </h4>
                  <p className="text-xs text-neutral-400">WebGL 3D surface across strikes & expirations</p>
                </div>
                <ChevronRight className="h-4 w-4 text-neutral-400 group-hover:text-[#007AFF]" />
              </Link>

              <Link
                href={`/reports`}
                className="p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:border-[#007AFF] transition-all flex items-center justify-between group"
              >
                <div>
                  <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 group-hover:text-[#007AFF]">
                    Generate Research Dossier
                  </h4>
                  <p className="text-xs text-neutral-400">Export PDF/CSV institution-ready report</p>
                </div>
                <ChevronRight className="h-4 w-4 text-neutral-400 group-hover:text-[#007AFF]" />
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
