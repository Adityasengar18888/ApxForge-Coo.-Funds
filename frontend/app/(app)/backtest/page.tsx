"use client";

import React, { useState } from "react";
import { Play, TrendingUp, History, Shield, Zap, DollarSign, Award, ArrowUpRight } from "lucide-react";
import { Card, Button, Input, Select, Skeleton } from "@/components/ios";
import { LineAreaChart } from "@/components/charts/2d";
import api from "@/lib/api";

interface BacktestSummary {
  initial_capital: number;
  final_equity: number;
  total_return_pct: number;
  benchmark_return_pct: number;
  cagr: number;
  sharpe_ratio: number;
  sortino_ratio: number;
  max_drawdown_pct: number;
  total_trades: number;
  win_rate_pct: number;
  profit_factor: number;
}

interface Trade {
  entry_date: string;
  exit_date: string;
  direction: string;
  entry_price: number;
  exit_price: number;
  return_pct: number;
  pnl: number;
}

interface EquityPoint {
  date: string;
  equity: number;
  benchmark: number;
  in_market: number;
}

export default function BacktestPage() {
  const [symbol, setSymbol] = useState("AAPL");
  const [strategy, setStrategy] = useState("sma_crossover");
  const [period, setPeriod] = useState("2y");
  const [capital, setCapital] = useState("100000");
  const [commissionBps, setCommissionBps] = useState("10");

  // Strategy specific parameters
  const [fastPeriod, setFastPeriod] = useState("20");
  const [slowPeriod, setSlowPeriod] = useState("50");
  const [rsiPeriod, setRsiPeriod] = useState("14");
  const [oversold, setOversold] = useState("30");
  const [overbought, setOverbought] = useState("70");

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    summary: BacktestSummary;
    trades: Trade[];
    equity_curve: EquityPoint[];
  } | null>(null);

  const handleRunBacktest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const params: Record<string, any> = {};
      if (strategy === "sma_crossover") {
        params.fast_period = parseInt(fastPeriod);
        params.slow_period = parseInt(slowPeriod);
      } else if (strategy === "rsi_reversion") {
        params.rsi_period = parseInt(rsiPeriod);
        params.oversold = parseFloat(oversold);
        params.overbought = parseFloat(overbought);
      }

      const res = await api.post("/backtest/run", {
        symbol: symbol.toUpperCase(),
        strategy_name: strategy,
        period: period,
        initial_capital: parseFloat(capital),
        commission_bps: parseFloat(commissionBps),
        params: params,
      });

      setResult(res.data);
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to execute backtest simulation.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-3">
          <History className="h-8 w-8 text-[#007AFF]" />
          Algorithmic Backtesting Studio
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
          Historical simulation engine with 1-bar execution delay and commission accounting
        </p>
      </div>

      {/* Control Panel Card */}
      <Card className="p-6">
        <form onSubmit={handleRunBacktest} className="space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <label className="text-xs font-semibold text-neutral-500 uppercase">Symbol</label>
              <Input
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                placeholder="AAPL, MSFT, SPY"
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-neutral-500 uppercase">Strategy</label>
              <Select
                value={strategy}
                onChange={(e) => setStrategy(e.target.value)}
              >
                <option value="sma_crossover">SMA Crossover (Fast/Slow)</option>
                <option value="rsi_reversion">RSI Mean Reversion</option>
                <option value="macd_momentum">MACD Momentum</option>
                <option value="bollinger_reversal">Bollinger Bands Breakout</option>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold text-neutral-500 uppercase">Period</label>
              <Select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
              >
                <option value="1y">1 Year</option>
                <option value="2y">2 Years</option>
                <option value="5y">5 Years</option>
                <option value="max">Max Available</option>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold text-neutral-500 uppercase">Capital ($)</label>
              <Input
                type="number"
                value={capital}
                onChange={(e) => setCapital(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-neutral-500 uppercase">Fee (bps)</label>
              <Input
                type="number"
                value={commissionBps}
                onChange={(e) => setCommissionBps(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Strategy dynamic parameters */}
          {strategy === "sma_crossover" && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2 border-t border-neutral-100 dark:border-neutral-800">
              <div>
                <label className="text-xs text-neutral-500">Fast Period (Days)</label>
                <Input
                  type="number"
                  value={fastPeriod}
                  onChange={(e) => setFastPeriod(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-neutral-500">Slow Period (Days)</label>
                <Input
                  type="number"
                  value={slowPeriod}
                  onChange={(e) => setSlowPeriod(e.target.value)}
                />
              </div>
            </div>
          )}

          {strategy === "rsi_reversion" && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2 border-t border-neutral-100 dark:border-neutral-800">
              <div>
                <label className="text-xs text-neutral-500">RSI Period</label>
                <Input
                  type="number"
                  value={rsiPeriod}
                  onChange={(e) => setRsiPeriod(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-neutral-500">Oversold (Buy)</label>
                <Input
                  type="number"
                  value={oversold}
                  onChange={(e) => setOversold(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-neutral-500">Overbought (Sell)</label>
                <Input
                  type="number"
                  value={overbought}
                  onChange={(e) => setOverbought(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={loading} className="w-full md:w-auto px-8">
              <Play className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              {loading ? "Simulating Strategy..." : "Run Backtest"}
            </Button>
          </div>
        </form>
      </Card>

      {/* Results Section */}
      {result && (
        <div className="space-y-6">
          {/* Summary KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-5">
              <p className="text-xs font-semibold uppercase text-neutral-500 tracking-wider">Final Portfolio</p>
              <h3 className="text-2xl font-bold mt-2 text-neutral-900 dark:text-neutral-100">
                ${result.summary.final_equity.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </h3>
              <span className={`text-xs font-semibold mt-1 inline-flex items-center ${result.summary.total_return_pct >= 0 ? "text-[#34C759]" : "text-[#FF3B30]"}`}>
                {result.summary.total_return_pct >= 0 ? "+" : ""}{result.summary.total_return_pct}% Total Return
              </span>
            </Card>

            <Card className="p-5">
              <p className="text-xs font-semibold uppercase text-neutral-500 tracking-wider">CAGR</p>
              <h3 className="text-2xl font-bold mt-2 text-neutral-900 dark:text-neutral-100">
                {result.summary.cagr}%
              </h3>
              <span className="text-xs text-neutral-400 mt-1 block">
                Bench: {result.summary.benchmark_return_pct}%
              </span>
            </Card>

            <Card className="p-5">
              <p className="text-xs font-semibold uppercase text-neutral-500 tracking-wider">Sharpe / Sortino</p>
              <h3 className="text-2xl font-bold mt-2 text-neutral-900 dark:text-neutral-100">
                {result.summary.sharpe_ratio} / {result.summary.sortino_ratio}
              </h3>
              <span className="text-xs text-neutral-400 mt-1 block">Risk-adjusted returns</span>
            </Card>

            <Card className="p-5">
              <p className="text-xs font-semibold uppercase text-neutral-500 tracking-wider">Max Drawdown</p>
              <h3 className="text-2xl font-bold mt-2 text-[#FF3B30]">
                {result.summary.max_drawdown_pct.toFixed(2)}%
              </h3>
              <span className="text-xs text-neutral-400 mt-1 block">
                Win Rate: {result.summary.win_rate_pct.toFixed(1)}% ({result.summary.total_trades} trades)
              </span>
            </Card>
          </div>

          {/* Equity Curve Chart */}
          <Card className="p-6">
            <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
              Equity Curve vs. Buy & Hold Benchmark
            </h2>
            <p className="text-xs text-neutral-500 mb-4">
              Comparing simulated algorithmic capital trajectory against passive benchmark
            </p>
            <div className="h-80">
              <LineAreaChart
                dates={result.equity_curve.map((p) => p.date)}
                series={[
                  {
                    name: "Strategy Equity ($)",
                    data: result.equity_curve.map((p) => p.equity),
                    color: "#007AFF",
                    areaOpacity: 0.15,
                  },
                  {
                    name: "Buy & Hold ($)",
                    data: result.equity_curve.map((p) => p.benchmark),
                    color: "#8E8E93",
                    areaOpacity: 0.05,
                  },
                ]}
              />
            </div>
          </Card>

          {/* Trade Log */}
          <Card className="overflow-hidden">
            <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center">
              <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                Executed Trades Log ({result.trades.length})
              </h2>
              <span className="text-xs text-neutral-400">Profit Factor: {result.summary.profit_factor}</span>
            </div>
            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-left border-collapse text-sm">
                <thead className="sticky top-0 bg-neutral-100 dark:bg-neutral-800 text-xs uppercase tracking-wider text-neutral-500">
                  <tr>
                    <th className="py-2.5 px-4">Entry Date</th>
                    <th className="py-2.5 px-4">Exit Date</th>
                    <th className="py-2.5 px-4">Side</th>
                    <th className="py-2.5 px-4 text-right">Entry Price</th>
                    <th className="py-2.5 px-4 text-right">Exit Price</th>
                    <th className="py-2.5 px-4 text-right">Return %</th>
                    <th className="py-2.5 px-4 text-right">PnL ($)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {result.trades.map((t, i) => (
                    <tr key={i} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-900/40">
                      <td className="py-2 px-4 text-xs font-mono">{t.entry_date}</td>
                      <td className="py-2 px-4 text-xs font-mono">{t.exit_date}</td>
                      <td className="py-2 px-4 font-semibold text-xs text-blue-600 dark:text-blue-400">{t.direction}</td>
                      <td className="py-2 px-4 text-right">${t.entry_price.toFixed(2)}</td>
                      <td className="py-2 px-4 text-right">${t.exit_price.toFixed(2)}</td>
                      <td className={`py-2 px-4 text-right font-medium ${t.return_pct >= 0 ? "text-[#34C759]" : "text-[#FF3B30]"}`}>
                        {t.return_pct >= 0 ? "+" : ""}{t.return_pct.toFixed(2)}%
                      </td>
                      <td className={`py-2 px-4 text-right font-semibold ${t.pnl >= 0 ? "text-[#34C759]" : "text-[#FF3B30]"}`}>
                        {t.pnl >= 0 ? "+" : ""}${t.pnl.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

