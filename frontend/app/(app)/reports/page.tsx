"use client";

import React, { useState } from "react";
import { FileText, Printer, Download, CheckSquare, Square, Sparkles, Shield, ChevronRight } from "lucide-react";
import { Card, Button, Input } from "@/components/ios";
import api from "@/lib/api";

export default function ReportsPage() {
  const [symbol, setSymbol] = useState("AAPL");
  const [includeSummary, setIncludeSummary] = useState(true);
  const [includeFundamentals, setIncludeFundamentals] = useState(true);
  const [includeTechnicals, setIncludeTechnicals] = useState(true);
  const [includeRisk, setIncludeRisk] = useState(true);
  const [includeMlForecast, setIncludeMlForecast] = useState(true);
  const [includeDisclaimer, setIncludeDisclaimer] = useState(true);

  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<any>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post("/reports/generate", {
        symbol: symbol.toUpperCase(),
        include_summary: includeSummary,
        include_fundamentals: includeFundamentals,
        include_technicals: includeTechnicals,
        include_risk: includeRisk,
        include_ml_forecast: includeMlForecast,
        include_disclaimer: includeDisclaimer,
      });
      setReport(res.data);
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to generate report.");
    } finally {
      setLoading(false);
    }
  };

  const handleExportJSON = () => {
    if (!report) return;
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ApxForge_Report_${report.symbol}_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    if (!report) return;
    let csv = "Section,Metric,Value\n";
    csv += `Header,Symbol,${report.symbol}\n`;
    csv += `Header,Price,${report.price}\n`;
    csv += `Header,Generated,${report.generated_at}\n`;

    if (report.executive_summary) {
      for (const [k, v] of Object.entries(report.executive_summary)) {
        csv += `Executive Summary,${k},"${v}"\n`;
      }
    }
    if (report.fundamentals) {
      for (const [k, v] of Object.entries(report.fundamentals)) {
        csv += `Fundamentals,${k},${v}\n`;
      }
    }
    if (report.technical_indicators) {
      for (const [k, v] of Object.entries(report.technical_indicators)) {
        csv += `Technicals,${k},${v}\n`;
      }
    }
    if (report.risk_profile) {
      for (const [k, v] of Object.entries(report.risk_profile)) {
        csv += `Risk Profile,${k},${v}\n`;
      }
    }

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ApxForge_Report_${report.symbol}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Non-print Header */}
      <div className="print:hidden flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-3">
            <FileText className="h-8 w-8 text-[#007AFF]" />
            Quantitative Dossier & Report Builder
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Assemble multi-dimensional asset intelligence into presentation-ready reports
          </p>
        </div>

        {report && (
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => window.print()}>
              <Printer className="h-4 w-4 mr-2" />
              Print / PDF
            </Button>
            <Button variant="secondary" onClick={handleExportCSV}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button variant="secondary" onClick={handleExportJSON}>
              <Download className="h-4 w-4 mr-2" />
              Export JSON
            </Button>
          </div>
        )}
      </div>

      {/* Report Builder Options Form (Hidden during print) */}
      <Card className="print:hidden p-6">
        <form onSubmit={handleGenerate} className="space-y-5">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="w-full md:w-64">
              <label className="text-xs font-semibold uppercase text-neutral-500">Asset Ticker</label>
              <Input
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                placeholder="AAPL, NVDA, SPY"
                required
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full md:w-auto px-8">
              <Sparkles className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              {loading ? "Synthesizing Dossier..." : "Generate Research Dossier"}
            </Button>
          </div>

          <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800">
            <p className="text-xs font-semibold uppercase text-neutral-500 mb-3">Include Modules</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { label: "Executive Summary", state: includeSummary, setter: setIncludeSummary },
                { label: "Fundamental Valuation", state: includeFundamentals, setter: setIncludeFundamentals },
                { label: "Technical Oscillators", state: includeTechnicals, setter: setIncludeTechnicals },
                { label: "Risk & Drawdown Profile", state: includeRisk, setter: setIncludeRisk },
                { label: "ML Predictive Horizon", state: includeMlForecast, setter: setIncludeMlForecast },
                { label: "Regulatory Disclaimer", state: includeDisclaimer, setter: setIncludeDisclaimer },
              ].map((m, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => m.setter(!m.state)}
                  className={`p-3 rounded-xl border text-left flex items-center justify-between text-xs font-medium transition-colors ${
                    m.state
                      ? "border-[#007AFF] bg-blue-50/40 dark:bg-blue-950/20 text-[#007AFF]"
                      : "border-neutral-200 dark:border-neutral-800 text-neutral-500"
                  }`}
                >
                  <span>{m.label}</span>
                  {m.state ? <CheckSquare className="h-4 w-4 shrink-0" /> : <Square className="h-4 w-4 shrink-0" />}
                </button>
              ))}
            </div>
          </div>
        </form>
      </Card>

      {/* Rendered Research Report (Visible in print and screen) */}
      {report && (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-8 space-y-8 shadow-sm print:border-none print:shadow-none print:p-0">
          {/* Document Header */}
          <div className="border-b border-neutral-200 dark:border-neutral-800 pb-6 flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs uppercase tracking-widest font-bold text-[#007AFF]">
                  ApxForge Quantitative Analytics
                </span>
                <span className="text-xs text-neutral-400">• Institutional Dossier</span>
              </div>
              <h2 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
                {report.name} ({report.symbol})
              </h2>
              <p className="text-xs text-neutral-500 mt-1">Generated: {report.generated_at}</p>
            </div>
            <div className="text-right">
              <span className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
                ${report.price.toFixed(2)}
              </span>
              <span className={`block text-xs font-semibold ${report.change_pct >= 0 ? "text-[#34C759]" : "text-[#FF3B30]"}`}>
                {report.change_pct >= 0 ? "+" : ""}{report.change_pct.toFixed(2)}% (24H)
              </span>
            </div>
          </div>

          {/* Executive Summary */}
          {report.executive_summary && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-500 border-b border-neutral-100 dark:border-neutral-800 pb-1">
                1. Executive Summary & Thesis
              </h3>
              <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
                {report.executive_summary.summary_thesis}
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
                <div className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800/60">
                  <span className="text-xs text-neutral-400">Sector</span>
                  <p className="text-sm font-semibold">{report.executive_summary.sector}</p>
                </div>
                <div className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800/60">
                  <span className="text-xs text-neutral-400">P/E Ratio</span>
                  <p className="text-sm font-semibold">{report.executive_summary.pe_ratio}</p>
                </div>
                <div className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800/60">
                  <span className="text-xs text-neutral-400">Beta</span>
                  <p className="text-sm font-semibold">{report.executive_summary.beta}</p>
                </div>
                <div className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800/60">
                  <span className="text-xs text-neutral-400">Market Cap</span>
                  <p className="text-sm font-semibold">${(report.executive_summary.market_cap / 1e9).toFixed(1)}B</p>
                </div>
              </div>
            </div>
          )}

          {/* Fundamentals */}
          {report.fundamentals && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-500 border-b border-neutral-100 dark:border-neutral-800 pb-1">
                2. Fundamental Valuation Multiples
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 rounded-lg border border-neutral-100 dark:border-neutral-800">
                  <span className="text-xs text-neutral-400">Forward P/E</span>
                  <p className="text-base font-semibold">{report.fundamentals.forward_pe}x</p>
                </div>
                <div className="p-3 rounded-lg border border-neutral-100 dark:border-neutral-800">
                  <span className="text-xs text-neutral-400">PEG Ratio</span>
                  <p className="text-base font-semibold">{report.fundamentals.peg_ratio}</p>
                </div>
                <div className="p-3 rounded-lg border border-neutral-100 dark:border-neutral-800">
                  <span className="text-xs text-neutral-400">Price / Book</span>
                  <p className="text-base font-semibold">{report.fundamentals.price_to_book}x</p>
                </div>
                <div className="p-3 rounded-lg border border-neutral-100 dark:border-neutral-800">
                  <span className="text-xs text-neutral-400">Consensus Target</span>
                  <p className="text-base font-semibold">${report.fundamentals.target_mean_price.toFixed(2)}</p>
                </div>
              </div>
            </div>
          )}

          {/* Technicals */}
          {report.technical_indicators && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-500 border-b border-neutral-100 dark:border-neutral-800 pb-1">
                3. Technical Indicators & Oscillators
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 rounded-lg border border-neutral-100 dark:border-neutral-800">
                  <span className="text-xs text-neutral-400">RSI (14D)</span>
                  <p className="text-base font-semibold">{report.technical_indicators.rsi_14}</p>
                </div>
                <div className="p-3 rounded-lg border border-neutral-100 dark:border-neutral-800">
                  <span className="text-xs text-neutral-400">MACD Histogram</span>
                  <p className="text-base font-semibold">{report.technical_indicators.macd}</p>
                </div>
                <div className="p-3 rounded-lg border border-neutral-100 dark:border-neutral-800">
                  <span className="text-xs text-neutral-400">50D / 200D SMA</span>
                  <p className="text-base font-semibold">${report.technical_indicators.sma_50} / ${report.technical_indicators.sma_200}</p>
                </div>
                <div className="p-3 rounded-lg border border-neutral-100 dark:border-neutral-800">
                  <span className="text-xs text-neutral-400">Composite Signal</span>
                  <p className="text-base font-bold text-emerald-600 dark:text-emerald-400">{report.technical_indicators.signal}</p>
                </div>
              </div>
            </div>
          )}

          {/* Risk Profile */}
          {report.risk_profile && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-500 border-b border-neutral-100 dark:border-neutral-800 pb-1">
                4. Statistical Risk Profile & Drawdowns
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800/60">
                  <span className="text-xs text-neutral-400">Sharpe Ratio</span>
                  <p className="text-base font-semibold">{report.risk_profile.sharpe_ratio}</p>
                </div>
                <div className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800/60">
                  <span className="text-xs text-neutral-400">Sortino Ratio</span>
                  <p className="text-base font-semibold">{report.risk_profile.sortino_ratio}</p>
                </div>
                <div className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800/60">
                  <span className="text-xs text-neutral-400">Max Drawdown</span>
                  <p className="text-base font-semibold text-[#FF3B30]">{report.risk_profile.max_drawdown_pct}%</p>
                </div>
                <div className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800/60">
                  <span className="text-xs text-neutral-400">Parametric VaR (95%)</span>
                  <p className="text-base font-semibold text-[#FF3B30]">{report.risk_profile.var_95_pct}%</p>
                </div>
              </div>
            </div>
          )}

          {/* ML Predictive Horizon */}
          {report.ml_forecast && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-500 border-b border-neutral-100 dark:border-neutral-800 pb-1">
                5. Machine Learning Predictive Forecast
              </h3>
              <div className="p-4 rounded-xl border border-blue-100 dark:border-blue-900/40 bg-blue-50/30 dark:bg-blue-950/20 space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-xs text-neutral-500">Architecture</span>
                    <p className="text-sm font-semibold">{report.ml_forecast.model}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-neutral-500">Confidence</span>
                    <p className="text-sm font-bold text-[#007AFF]">{(report.ml_forecast.confidence_level * 100).toFixed(0)}%</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center pt-2">
                  <div className="p-2 rounded bg-white dark:bg-neutral-800">
                    <span className="text-[11px] text-neutral-400 block">Lower 95% Bound</span>
                    <span className="text-sm font-mono font-medium">${report.ml_forecast.expected_price_range.lower_bound_95}</span>
                  </div>
                  <div className="p-2 rounded bg-white dark:bg-neutral-800 border border-blue-300 dark:border-blue-700">
                    <span className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold block">Point Forecast</span>
                    <span className="text-sm font-mono font-bold text-blue-600 dark:text-blue-400">${report.ml_forecast.expected_price_range.point_estimate}</span>
                  </div>
                  <div className="p-2 rounded bg-white dark:bg-neutral-800">
                    <span className="text-[11px] text-neutral-400 block">Upper 95% Bound</span>
                    <span className="text-sm font-mono font-medium">${report.ml_forecast.expected_price_range.upper_bound_95}</span>
                  </div>
                </div>

                <div className="text-xs text-neutral-500 pt-1">
                  Key Feature Drivers: {report.ml_forecast.top_drivers.join(" • ")}
                </div>
              </div>
            </div>
          )}

          {/* Disclaimer */}
          {report.regulatory_disclaimer && (
            <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 text-[11px] text-neutral-400 leading-relaxed italic">
              {report.regulatory_disclaimer}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

