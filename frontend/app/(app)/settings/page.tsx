"use client";

import React, { useState, useEffect } from "react";
import { Settings, Sliders, Moon, Sun, Monitor, Bell, Shield, Check, Save } from "lucide-react";
import { Card, Button, Input, Select, Toggle } from "@/components/ios";
import { useTheme } from "next-themes";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();

  // Settings state
  const [defaultTicker, setDefaultTicker] = useState("AAPL");
  const [defaultOptionType, setDefaultOptionType] = useState("call");
  const [riskTolerance, setRiskTolerance] = useState("moderate");
  const [riskFreeRate, setRiskFreeRate] = useState("4.5");
  const [enable3D, setEnable3D] = useState(true);
  const [enableAlerts, setEnableAlerts] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    // Load from localStorage if present
    const saved = localStorage.getItem("apxforge_user_prefs");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.defaultTicker) setDefaultTicker(parsed.defaultTicker);
        if (parsed.defaultOptionType) setDefaultOptionType(parsed.defaultOptionType);
        if (parsed.riskTolerance) setRiskTolerance(parsed.riskTolerance);
        if (parsed.riskFreeRate) setRiskFreeRate(parsed.riskFreeRate);
        if (parsed.enable3D !== undefined) setEnable3D(parsed.enable3D);
        if (parsed.enableAlerts !== undefined) setEnableAlerts(parsed.enableAlerts);
      } catch (e) {
        console.error("Failed to parse prefs:", e);
      }
    }
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const prefs = {
      defaultTicker,
      defaultOptionType,
      riskTolerance,
      riskFreeRate,
      enable3D,
      enableAlerts,
    };
    localStorage.setItem("apxforge_user_prefs", JSON.stringify(prefs));
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-3">
            <Settings className="h-8 w-8 text-[#007AFF]" />
            Application Preferences
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Configure analytical assumptions, visual rendering modes, and UI ergonomics
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Appearance Card */}
        <Card className="p-6">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2 mb-4">
            <Sun className="h-4 w-4 text-amber-500" />
            Appearance & Visual Theme
          </h2>
          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setTheme("light")}
              className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                theme === "light"
                  ? "border-[#007AFF] bg-blue-50/50 dark:bg-blue-950/20 text-[#007AFF] font-semibold"
                  : "border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:border-neutral-300"
              }`}
            >
              <Sun className="h-5 w-5" />
              <span className="text-sm">Light HIG</span>
            </button>

            <button
              type="button"
              onClick={() => setTheme("dark")}
              className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                theme === "dark"
                  ? "border-[#007AFF] bg-blue-50/50 dark:bg-blue-950/20 text-[#007AFF] font-semibold"
                  : "border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:border-neutral-300"
              }`}
            >
              <Moon className="h-5 w-5" />
              <span className="text-sm">Dark HIG</span>
            </button>

            <button
              type="button"
              onClick={() => setTheme("system")}
              className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                theme === "system"
                  ? "border-[#007AFF] bg-blue-50/50 dark:bg-blue-950/20 text-[#007AFF] font-semibold"
                  : "border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:border-neutral-300"
              }`}
            >
              <Monitor className="h-5 w-5" />
              <span className="text-sm">System Match</span>
            </button>
          </div>
        </Card>

        {/* Quantitative Defaults */}
        <Card className="p-6">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2 mb-4">
            <Sliders className="h-4 w-4 text-[#007AFF]" />
            Quantitative & Pricing Assumptions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-neutral-500 uppercase">Default Active Ticker</label>
              <Input
                value={defaultTicker}
                onChange={(e) => setDefaultTicker(e.target.value.toUpperCase())}
                placeholder="AAPL"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-500 uppercase">Default Option Direction</label>
              <Select
                value={defaultOptionType}
                onChange={(e) => setDefaultOptionType(e.target.value)}
              >
                <option value="call">Call Option</option>
                <option value="put">Put Option</option>
              </Select>
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-500 uppercase">Risk-Free Rate (% p.a.)</label>
              <Input
                type="number"
                step="0.1"
                value={riskFreeRate}
                onChange={(e) => setRiskFreeRate(e.target.value)}
              />
              <span className="text-[11px] text-neutral-400 mt-1 block">Used in Black-Scholes and Sharpe calculations</span>
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-500 uppercase">Risk Tolerance Model</label>
              <Select
                value={riskTolerance}
                onChange={(e) => setRiskTolerance(e.target.value)}
              >
                <option value="conservative">Conservative (Min Volatility)</option>
                <option value="moderate">Moderate (Balanced Sharpe)</option>
                <option value="aggressive">Aggressive (High Momentum)</option>
              </Select>
            </div>
          </div>
        </Card>

        {/* Visual Engine & Alerts */}
        <Card className="p-6 divide-y divide-neutral-100 dark:divide-neutral-800">
          <div className="flex items-center justify-between pb-4">
            <div>
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                Three.js 3D Acceleration
              </h3>
              <p className="text-xs text-neutral-500">
                Render interactive 3D WebGL volatility surfaces and manifolds
              </p>
            </div>
            <Toggle checked={enable3D} onChange={setEnable3D} />
          </div>

          <div className="flex items-center justify-between pt-4">
            <div>
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                Live Notification Toasts
              </h3>
              <p className="text-xs text-neutral-500">
                Deliver alerts when price breaches surveillance thresholds
              </p>
            </div>
            <Toggle checked={enableAlerts} onChange={setEnableAlerts} />
          </div>
        </Card>

        {/* Submit */}
        <div className="flex items-center justify-between pt-2">
          {savedSuccess ? (
            <span className="text-sm font-medium text-[#34C759] flex items-center gap-1.5">
              <Check className="h-4 w-4" /> Preferences successfully saved!
            </span>
          ) : (
            <span />
          )}
          <Button type="submit" className="px-6">
            <Save className="h-4 w-4 mr-2" />
            Save Preferences
          </Button>
        </div>
      </form>
    </div>
  );
}
