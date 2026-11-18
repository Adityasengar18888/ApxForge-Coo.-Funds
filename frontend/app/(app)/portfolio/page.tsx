"use client";

import React, { useState, useEffect } from "react";
import { 
  Briefcase, Plus, ArrowUpRight, ArrowDownRight, RefreshCw, 
  Trash2, DollarSign, PieChart as PieIcon, ShieldAlert 
} from "lucide-react";
import { Card, Button, Input, Select, Skeleton } from "@/components/ios";
import { WaterfallChart } from "@/components/charts/2d";
import api from "@/lib/api";

interface Holding {
  id: number;
  symbol: string;
  name: string;
  asset_type: string;
  shares: number;
  avg_cost: number;
  current_price: number;
  market_value: number;
  cost_basis: number;
  unrealized_pnl: number;
  return_pct: number;
  target_allocation_pct: number;
  actual_allocation_pct: number;
  rebalance_delta_usd: number;
  rebalance_action: string;
}

interface PortfolioSummary {
  total_market_value: number;
  total_cost_basis: number;
  total_unrealized_pnl: number;
  total_return_pct: number;
  positions_count: number;
}

export default function PortfolioPage() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<PortfolioSummary | null>(null);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);

  // New position form
  const [newSymbol, setNewSymbol] = useState("");
  const [newShares, setNewShares] = useState("10");
  const [newAvgCost, setNewAvgCost] = useState("150");
  const [newTarget, setNewTarget] = useState("20");
  const [newAssetType, setNewAssetType] = useState("stock");

  const fetchPortfolio = async () => {
    try {
      setLoading(true);
      const res = await api.get("/portfolio/");
      setSummary(res.data.summary);
      setHoldings(res.data.holdings);
    } catch (err) {
      console.error("Failed to load portfolio:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortfolio();
  }, []);

  const handleAddHolding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSymbol) return;
    try {
      await api.post("/portfolio/", {
        symbol: newSymbol.toUpperCase(),
        shares: parseFloat(newShares),
        avg_cost: parseFloat(newAvgCost),
        target_allocation_pct: parseFloat(newTarget),
        asset_type: newAssetType,
      });
      setShowAddModal(false);
      setNewSymbol("");
      fetchPortfolio();
    } catch (err) {
      alert("Error adding holding. Please verify inputs.");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to remove this position?")) return;
    try {
      await api.delete(`/portfolio/${id}`);
      fetchPortfolio();
    } catch (err) {
      alert("Failed to delete position.");
    }
  };

  // Prepare waterfall items
  const waterfallItems = holdings.map((h) => ({
    name: h.symbol,
    value: h.unrealized_pnl,
  }));

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-3">
            <Briefcase className="h-8 w-8 text-[#007AFF]" />
            Portfolio & Risk Management
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Real-time positions, automated rebalancing deviations, and asset allocation
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={fetchPortfolio} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Position
          </Button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase text-neutral-500 dark:text-neutral-400 tracking-wider">
            Total Value
          </p>
          <h3 className="text-2xl font-bold mt-2 text-neutral-900 dark:text-neutral-100">
            {summary ? `$${summary.total_market_value.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : <Skeleton className="h-8 w-24" />}
          </h3>
          <span className="text-xs text-neutral-400 mt-1 block">
            Cost Basis: ${summary?.total_cost_basis.toLocaleString(undefined, { minimumFractionDigits: 2 }) ?? "..."}
          </span>
        </Card>

        <Card className="p-5">
          <p className="text-xs font-semibold uppercase text-neutral-500 dark:text-neutral-400 tracking-wider">
            Total Return
          </p>
          <div className="flex items-baseline gap-2 mt-2">
            <h3 className={`text-2xl font-bold ${(summary?.total_unrealized_pnl ?? 0) >= 0 ? "text-[#34C759]" : "text-[#FF3B30]"}`}>
              {summary ? `${(summary.total_unrealized_pnl >= 0 ? "+" : "")}$${summary.total_unrealized_pnl.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : <Skeleton className="h-8 w-24" />}
            </h3>
            <span className={`text-sm font-semibold flex items-center ${(summary?.total_return_pct ?? 0) >= 0 ? "text-[#34C759]" : "text-[#FF3B30]"}`}>
              {(summary?.total_return_pct ?? 0) >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
              {summary ? `${Math.abs(summary.total_return_pct)}%` : ""}
            </span>
          </div>
          <span className="text-xs text-neutral-400 mt-1 block">Unrealized P&L</span>
        </Card>

        <Card className="p-5">
          <p className="text-xs font-semibold uppercase text-neutral-500 dark:text-neutral-400 tracking-wider">
            Active Holdings
          </p>
          <h3 className="text-2xl font-bold mt-2 text-neutral-900 dark:text-neutral-100">
            {summary ? summary.positions_count : <Skeleton className="h-8 w-12" />}
          </h3>
          <span className="text-xs text-neutral-400 mt-1 block">Across Stocks & Funds</span>
        </Card>

        <Card className="p-5">
          <p className="text-xs font-semibold uppercase text-neutral-500 dark:text-neutral-400 tracking-wider">
            Rebalancing Status
          </p>
          <div className="mt-2 flex items-center gap-2">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400">
              Optimal Variance
            </span>
          </div>
          <span className="text-xs text-neutral-400 mt-1 block">Tracking target weights</span>
        </Card>
      </div>

      {/* Holdings & Rebalancing Table */}
      <Card className="overflow-hidden">
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
            Holdings & Rebalance Allocations
          </h2>
          <span className="text-xs text-neutral-500">Live Quote Synchronization</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-neutral-50/80 dark:bg-neutral-900/60 text-neutral-500 dark:text-neutral-400 text-xs uppercase tracking-wider">
                <th className="py-3 px-4">Asset</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4 text-right">Shares</th>
                <th className="py-3 px-4 text-right">Avg Cost</th>
                <th className="py-3 px-4 text-right">Price</th>
                <th className="py-3 px-4 text-right">Market Value</th>
                <th className="py-3 px-4 text-right">Unrealized P&L</th>
                <th className="py-3 px-4 text-center">Actual / Target</th>
                <th className="py-3 px-4 text-center">Rebalance Action</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {holdings.map((h) => (
                <tr key={h.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-900/40 transition-colors">
                  <td className="py-3 px-4 font-semibold text-neutral-900 dark:text-neutral-100">
                    <div>{h.symbol}</div>
                    <div className="text-xs font-normal text-neutral-400">{h.name}</div>
                  </td>
                  <td className="py-3 px-4 uppercase text-xs text-neutral-500">{h.asset_type}</td>
                  <td className="py-3 px-4 text-right">{h.shares}</td>
                  <td className="py-3 px-4 text-right">${h.avg_cost.toFixed(2)}</td>
                  <td className="py-3 px-4 text-right font-medium">${h.current_price.toFixed(2)}</td>
                  <td className="py-3 px-4 text-right font-semibold">${h.market_value.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  <td className="py-3 px-4 text-right">
                    <span className={`font-medium ${h.unrealized_pnl >= 0 ? "text-[#34C759]" : "text-[#FF3B30]"}`}>
                      {(h.unrealized_pnl >= 0 ? "+" : "")}${h.unrealized_pnl.toFixed(2)}
                    </span>
                    <span className="text-xs text-neutral-400 block">
                      ({h.return_pct >= 0 ? "+" : ""}{h.return_pct.toFixed(2)}%)
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="font-semibold text-neutral-800 dark:text-neutral-200">{h.actual_allocation_pct}%</span>
                    <span className="text-xs text-neutral-400"> / {h.target_allocation_pct}%</span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${
                      h.rebalance_action === "BUY"
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400"
                        : h.rebalance_action === "SELL"
                        ? "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-400"
                        : "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"
                    }`}>
                      {h.rebalance_action} {h.rebalance_delta_usd !== 0 ? `($${Math.abs(h.rebalance_delta_usd).toFixed(0)})` : ""}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleDelete(h.id)}
                      className="text-neutral-400 hover:text-[#FF3B30] transition-colors p-1"
                      title="Delete holding"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* P&L Waterfall Chart */}
      {waterfallItems.length > 0 && (
        <Card className="p-6">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
            Unrealized P&L Contribution by Position
          </h2>
          <p className="text-xs text-neutral-500 mb-4">
            Visual breakdown of gains and losses across all portfolio holdings
          </p>
          <div className="h-72">
            <WaterfallChart
              items={waterfallItems}
              totalLabel="Total Unrealized P&L"
            />
          </div>
        </Card>
      )}

      {/* Add Position Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md p-6 bg-white dark:bg-neutral-900 shadow-2xl">
            <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mb-4">
              Add Portfolio Holding
            </h3>
            <form onSubmit={handleAddHolding} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-neutral-500 uppercase">Symbol / Ticker</label>
                <Input
                  value={newSymbol}
                  onChange={(e) => setNewSymbol(e.target.value)}
                  placeholder="e.g. AAPL, QQQ, VOO"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-neutral-500 uppercase">Shares</label>
                  <Input
                    type="number"
                    step="any"
                    value={newShares}
                    onChange={(e) => setNewShares(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-neutral-500 uppercase">Avg Cost ($)</label>
                  <Input
                    type="number"
                    step="any"
                    value={newAvgCost}
                    onChange={(e) => setNewAvgCost(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-neutral-500 uppercase">Target Alloc (%)</label>
                  <Input
                    type="number"
                    step="any"
                    value={newTarget}
                    onChange={(e) => setNewTarget(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-neutral-500 uppercase">Asset Type</label>
                  <Select
                    value={newAssetType}
                    onChange={(e) => setNewAssetType(e.target.value)}
                  >
                    <option value="stock">Stock</option>
                    <option value="fund">ETF / Fund</option>
                    <option value="option">Option</option>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-3">
                <Button variant="secondary" type="button" onClick={() => setShowAddModal(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Save Position
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}

