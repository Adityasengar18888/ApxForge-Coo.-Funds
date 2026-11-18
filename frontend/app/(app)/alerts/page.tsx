"use client";

import React, { useState, useEffect } from "react";
import { Bell, Plus, Trash2, RotateCcw, AlertTriangle, CheckCircle, ShieldAlert } from "lucide-react";
import { Card, Button, Input, Select, Skeleton } from "@/components/ios";
import api from "@/lib/api";

interface AlertItem {
  id: number;
  symbol: string;
  alert_type: string;
  condition: string;
  threshold: number;
  current_value: number;
  is_triggered: boolean;
  triggered_at: string | null;
  created_at: string;
}

export default function AlertsPage() {
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [showModal, setShowModal] = useState(false);

  // New alert form
  const [symbol, setSymbol] = useState("AAPL");
  const [alertType, setAlertType] = useState("price_above");
  const [condition, setCondition] = useState(">");
  const [threshold, setThreshold] = useState("250");

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const res = await api.get("/alerts/");
      setAlerts(res.data.alerts);
    } catch (err) {
      console.error("Failed to load alerts:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/alerts/", {
        symbol: symbol.toUpperCase(),
        alert_type: alertType,
        condition: condition,
        threshold: parseFloat(threshold),
      });
      setShowModal(false);
      fetchAlerts();
    } catch (err) {
      alert("Failed to create alert.");
    }
  };

  const handleReset = async (id: number) => {
    try {
      await api.post(`/alerts/${id}/reset`);
      fetchAlerts();
    } catch (err) {
      alert("Failed to reset alert.");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this alert?")) return;
    try {
      await api.delete(`/alerts/${id}`);
      fetchAlerts();
    } catch (err) {
      alert("Failed to delete alert.");
    }
  };

  const triggeredCount = alerts.filter((a) => a.is_triggered).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-3">
            <Bell className="h-8 w-8 text-[#007AFF]" />
            Quantitative Price & Technical Alerts
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Automated threshold surveillance for price, RSI boundaries, and volatility spikes
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => setShowModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Alert
          </Button>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase text-neutral-500 tracking-wider">Active Watchers</p>
          <h3 className="text-2xl font-bold mt-2 text-neutral-900 dark:text-neutral-100">
            {loading ? <Skeleton className="h-8 w-12" /> : alerts.length}
          </h3>
          <span className="text-xs text-neutral-400 mt-1 block">Continuous monitoring</span>
        </Card>

        <Card className="p-5">
          <p className="text-xs font-semibold uppercase text-rose-600 dark:text-rose-400 tracking-wider flex items-center gap-1.5">
            <AlertTriangle className="h-4 w-4" /> Triggered Events
          </p>
          <h3 className="text-2xl font-bold mt-2 text-rose-600 dark:text-rose-400">
            {loading ? <Skeleton className="h-8 w-12" /> : triggeredCount}
          </h3>
          <span className="text-xs text-neutral-400 mt-1 block">Awaiting user acknowledgement</span>
        </Card>

        <Card className="p-5">
          <p className="text-xs font-semibold uppercase text-emerald-600 dark:text-emerald-400 tracking-wider flex items-center gap-1.5">
            <CheckCircle className="h-4 w-4" /> Normal Thresholds
          </p>
          <h3 className="text-2xl font-bold mt-2 text-emerald-600 dark:text-emerald-400">
            {loading ? <Skeleton className="h-8 w-12" /> : alerts.length - triggeredCount}
          </h3>
          <span className="text-xs text-neutral-400 mt-1 block">Within acceptable bounds</span>
        </Card>

        <Card className="p-5">
          <p className="text-xs font-semibold uppercase text-neutral-500 tracking-wider">Poll Frequency</p>
          <h3 className="text-2xl font-bold mt-2 text-neutral-900 dark:text-neutral-100">
            60s
          </h3>
          <span className="text-xs text-neutral-400 mt-1 block">APScheduler background daemon</span>
        </Card>
      </div>

      {/* Alerts Table */}
      <Card className="overflow-hidden">
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
            Configured Surveillance Rules
          </h2>
          <span className="text-xs text-neutral-400">Database Synchronized</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-neutral-50/80 dark:bg-neutral-900/60 text-neutral-500 dark:text-neutral-400 text-xs uppercase tracking-wider">
                <th className="py-3 px-4">Symbol</th>
                <th className="py-3 px-4">Alert Condition</th>
                <th className="py-3 px-4 text-right">Target Threshold</th>
                <th className="py-3 px-4 text-right">Latest Live Value</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4">Triggered At</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {alerts.map((a) => (
                <tr key={a.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-900/40">
                  <td className="py-3 px-4 font-bold text-neutral-900 dark:text-neutral-100">{a.symbol}</td>
                  <td className="py-3 px-4">
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800">
                      {a.alert_type} ({a.condition})
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-semibold">${a.threshold.toFixed(2)}</td>
                  <td className="py-3 px-4 text-right font-mono">${a.current_value.toFixed(2)}</td>
                  <td className="py-3 px-4 text-center">
                    {a.is_triggered ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-400">
                        <AlertTriangle className="h-3 w-3 mr-1" /> TRIGGERED
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400">
                        <CheckCircle className="h-3 w-3 mr-1" /> WATCHING
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-xs text-neutral-400 font-mono">
                    {a.triggered_at ? new Date(a.triggered_at).toLocaleString() : "—"}
                  </td>
                  <td className="py-3 px-4 text-right space-x-2">
                    {a.is_triggered && (
                      <button
                        onClick={() => handleReset(a.id)}
                        className="text-neutral-400 hover:text-[#007AFF] transition-colors p-1"
                        title="Reset alert"
                      >
                        <RotateCcw className="h-4 w-4 inline" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(a.id)}
                      className="text-neutral-400 hover:text-[#FF3B30] transition-colors p-1"
                      title="Delete alert"
                    >
                      <Trash2 className="h-4 w-4 inline" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Create Alert Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md p-6 bg-white dark:bg-neutral-900 shadow-2xl">
            <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mb-4">
              Add New Surveillance Alert
            </h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-neutral-500 uppercase">Symbol</label>
                <Input
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value)}
                  placeholder="e.g. AAPL, NVDA"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-neutral-500 uppercase">Type</label>
                  <Select
                    value={alertType}
                    onChange={(e) => {
                      setAlertType(e.target.value);
                      if (e.target.value === "price_above") setCondition(">");
                      else if (e.target.value === "price_below") setCondition("<");
                      else if (e.target.value === "rsi_overbought") setCondition(">=");
                    }}
                  >
                    <option value="price_above">Price Above</option>
                    <option value="price_below">Price Below</option>
                    <option value="rsi_overbought">RSI Overbought</option>
                    <option value="rsi_oversold">RSI Oversold</option>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-neutral-500 uppercase">Condition</label>
                  <Select
                    value={condition}
                    onChange={(e) => setCondition(e.target.value)}
                  >
                    <option value=">">&gt; (Greater)</option>
                    <option value="<">&lt; (Less)</option>
                    <option value=">=">&gt;= (Greater or Equal)</option>
                    <option value="<=">&lt;= (Less or Equal)</option>
                  </Select>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-neutral-500 uppercase">Threshold Value</label>
                <Input
                  type="number"
                  step="any"
                  value={threshold}
                  onChange={(e) => setThreshold(e.target.value)}
                  required
                />
              </div>
              <div className="flex justify-end gap-3 pt-3">
                <Button variant="secondary" type="button" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Create Alert
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
