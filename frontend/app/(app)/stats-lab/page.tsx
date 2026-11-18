"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Binary,
  CheckCircle,
  AlertCircle,
  Sliders,
  TrendingDown,
  Activity,
  Layers,
} from "lucide-react";
import { Card } from "@/components/ios/Card";
import { Segmented } from "@/components/ios/Segmented";
import { Button } from "@/components/ios/Button";
import { ChartCard } from "@/components/ios/ChartCard";
import { LineAreaChart } from "@/components/charts/2d/LineAreaChart";
import { Skeleton } from "@/components/ios/Skeleton";
import { apiClient } from "@/lib/api";

export default function StatsLabPage() {
  const [activeTab, setActiveTab] = useState("hypothesis");
  const [alpha, setAlpha] = useState(0.05);

  // 1. Hypothesis test mutation
  const hypothesisMutation = useMutation({
    mutationFn: () =>
      apiClient<any>("/stats-lab/hypothesis-test", {
        method: "POST",
        body: JSON.stringify({
          sample_a: [0.012, 0.015, -0.008, 0.024, 0.018, 0.009, 0.014, -0.002, 0.021, 0.011],
          sample_b: [0.004, 0.002, 0.001, -0.005, 0.003, 0.006, -0.001, 0.002, 0.005, 0.001],
          pop_mean: 0.0,
          alpha,
        }),
      }),
  });

  // 2. ANOVA query
  const { data: anovaData, isLoading: anovaLoading } = useQuery({
    queryKey: ["anovaData"],
    queryFn: () => apiClient<any>("/stats-lab/anova"),
    enabled: activeTab === "anova",
  });

  // 3. Bias-variance sweep query
  const { data: biasVarianceData, isLoading: bvLoading } = useQuery({
    queryKey: ["biasVarianceSweep"],
    queryFn: () => apiClient<any[]>("/stats-lab/bias-variance"),
    enabled: activeTab === "bias_variance",
  });

  // 4. Cross validation query
  const { data: cvData, isLoading: cvLoading } = useQuery({
    queryKey: ["cvData"],
    queryFn: () => apiClient<any>("/stats-lab/cross-validation?symbol=AAPL"),
    enabled: activeTab === "cv",
  });

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[34px] font-bold tracking-tight text-ios-text">Statistics Lab</h1>
          <p className="text-[15px] text-ios-secondaryText">
            Hypothesis Testing, ANOVA, Bias-Variance Sweep & Cross-Validation Diagnostics
          </p>
        </div>

        <Segmented
          options={[
            { label: "Hypothesis", value: "hypothesis" },
            { label: "ANOVA", value: "anova" },
            { label: "Bias-Variance", value: "bias_variance" },
            { label: "CV Explorer", value: "cv" },
          ]}
          value={activeTab}
          onChange={(v) => setActiveTab(v)}
        />
      </div>

      {/* TAB 1: HYPOTHESIS TESTING */}
      {activeTab === "hypothesis" && (
        <div className="space-y-6">
          <Card className="p-5 border border-ios-hairline">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-[18px] font-bold text-ios-text">
                  Two-Sample T-Test & Welch Diagnostics
                </h3>
                <p className="text-[13px] text-ios-secondaryText mt-0.5">
                  Compare Asset Alpha against Risk-Free Benchmark or Peer Strategy
                </p>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-semibold text-ios-secondaryText">
                    Significance (α):
                  </span>
                  <Segmented
                    options={[
                      { label: "0.01 (99%)", value: "0.01" },
                      { label: "0.05 (95%)", value: "0.05" },
                      { label: "0.10 (90%)", value: "0.10" },
                    ]}
                    value={String(alpha)}
                    onChange={(v) => setAlpha(Number(v))}
                  />
                </div>

                <Button
                  variant="primary"
                  size="md"
                  onClick={() => hypothesisMutation.mutate()}
                  disabled={hypothesisMutation.isPending}
                >
                  {hypothesisMutation.isPending ? "Calculating..." : "Run Test"}
                </Button>
              </div>
            </div>
          </Card>

          {hypothesisMutation.data ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* One Sample T-Test Card */}
              <Card className="p-5 border border-ios-hairline">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-ios-secondaryText">
                  One-Sample T-Test
                </div>
                <div className="text-[28px] font-bold text-ios-blue mt-1">
                  t = {hypothesisMutation.data.one_sample_t_test?.test_stat}
                </div>
                <div className="text-[13px] text-ios-secondaryText mt-1">
                  p-value: <b>{hypothesisMutation.data.one_sample_t_test?.p_value}</b>
                </div>
                <div className="text-[13px] text-ios-text mt-3 pt-3 border-t border-ios-hairline">
                  {hypothesisMutation.data.one_sample_t_test?.interpretation}
                </div>
                <div className="mt-2 text-[12px] text-ios-secondaryText">
                  Effect Size (Cohen's d):{" "}
                  <b>{hypothesisMutation.data.one_sample_t_test?.effect_size_cohens_d}</b>
                </div>
              </Card>

              {/* Two Sample Student's T-Test */}
              <Card className="p-5 border border-ios-hairline">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-ios-secondaryText">
                  Two-Sample T-Test (Equal Var)
                </div>
                <div className="text-[28px] font-bold text-ios-green mt-1">
                  t = {hypothesisMutation.data.two_sample_t_test?.test_stat}
                </div>
                <div className="text-[13px] text-ios-secondaryText mt-1">
                  p-value: <b>{hypothesisMutation.data.two_sample_t_test?.p_value}</b>
                </div>
                <div className="text-[13px] text-ios-text mt-3 pt-3 border-t border-ios-hairline">
                  {hypothesisMutation.data.two_sample_t_test?.interpretation}
                </div>
                <div className="mt-2 text-[12px] text-ios-secondaryText">
                  Effect Size (Cohen's d):{" "}
                  <b>{hypothesisMutation.data.two_sample_t_test?.effect_size_cohens_d}</b>
                </div>
              </Card>

              {/* Welch's T-Test */}
              <Card className="p-5 border border-ios-hairline">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-ios-secondaryText">
                  Welch's T-Test (Unequal Var)
                </div>
                <div className="text-[28px] font-bold text-ios-purple mt-1">
                  t = {hypothesisMutation.data.welch_t_test?.test_stat}
                </div>
                <div className="text-[13px] text-ios-secondaryText mt-1">
                  p-value: <b>{hypothesisMutation.data.welch_t_test?.p_value}</b>
                </div>
                <div className="text-[13px] text-ios-text mt-3 pt-3 border-t border-ios-hairline">
                  {hypothesisMutation.data.welch_t_test?.interpretation}
                </div>
                <div className="mt-2 text-[12px] text-ios-secondaryText">
                  F-test Variance p-value:{" "}
                  <b>{hypothesisMutation.data.f_test_variance?.p_value}</b>
                </div>
              </Card>
            </div>
          ) : (
            <Card className="p-8 text-center text-ios-secondaryText border border-dashed border-ios-hairline">
              Click "Run Test" above to execute parametric hypothesis tests with Cohen's d effect sizes.
            </Card>
          )}
        </div>
      )}

      {/* TAB 2: ANOVA & TUKEY POST-HOC */}
      {activeTab === "anova" && (
        <div className="space-y-6">
          {anovaLoading ? (
            <Skeleton className="w-full h-80" />
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card>
                  <div className="text-[12px] font-semibold text-ios-secondaryText uppercase">
                    F-Statistic
                  </div>
                  <div className="text-[24px] font-bold text-ios-blue mt-1">
                    {anovaData?.f_statistic}
                  </div>
                </Card>

                <Card>
                  <div className="text-[12px] font-semibold text-ios-secondaryText uppercase">
                    p-value
                  </div>
                  <div className="text-[24px] font-bold text-ios-purple mt-1">
                    {anovaData?.p_value}
                  </div>
                </Card>

                <Card>
                  <div className="text-[12px] font-semibold text-ios-secondaryText uppercase">
                    Effect Size (η²)
                  </div>
                  <div className="text-[24px] font-bold text-ios-green mt-1">
                    {anovaData?.eta_squared}
                  </div>
                </Card>
              </div>

              {/* Tukey HSD Table */}
              <Card className="p-0 overflow-hidden border border-ios-hairline">
                <div className="px-5 py-3 border-b border-ios-hairline bg-ios-secondaryBg/40 dark:bg-white/5">
                  <h4 className="text-[15px] font-bold text-ios-text">
                    Tukey HSD Post-Hoc Pairwise Comparisons
                  </h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-[14px]">
                    <thead>
                      <tr className="border-b border-ios-hairline text-[12px] font-semibold uppercase tracking-wider text-ios-secondaryText">
                        <th className="px-5 py-3">Group 1</th>
                        <th className="px-5 py-3">Group 2</th>
                        <th className="px-5 py-3 text-right">Mean Diff</th>
                        <th className="px-5 py-3 text-right">Adjusted p-value</th>
                        <th className="px-5 py-3 text-center">Significant?</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-ios-hairline">
                      {(anovaData?.tukey_posthoc || []).map((row: any, i: number) => (
                        <tr key={i} className="hover:bg-black/5 dark:hover:bg-white/5">
                          <td className="px-5 py-3.5 font-medium text-ios-text">{row.group1}</td>
                          <td className="px-5 py-3.5 font-medium text-ios-text">{row.group2}</td>
                          <td className="px-5 py-3.5 text-right font-mono">{row.meandiff}</td>
                          <td className="px-5 py-3.5 text-right font-mono">{row.p_adj}</td>
                          <td className="px-5 py-3.5 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase ${
                                row.reject ? "bg-ios-green/15 text-ios-green" : "bg-black/5 dark:bg-white/10 text-ios-secondaryText"
                              }`}
                            >
                              {row.reject ? "Reject H0" : "Fail to reject"}
                            </span>
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
      )}

      {/* TAB 3: BIAS-VARIANCE SWEEP */}
      {activeTab === "bias_variance" && (
        <div className="space-y-6">
          <ChartCard
            title="Bias-Variance Polynomial Complexity Sweep"
            subtitle="Training error vs Validation error across model degrees (Underfitting to Overfitting)"
          >
            {bvLoading ? (
              <Skeleton className="w-full h-80" />
            ) : (
              <LineAreaChart
                dates={(biasVarianceData || []).map((d: any) => `Degree ${d.degree}`)}
                series={[
                  {
                    name: "Train MSE (Bias)",
                    data: (biasVarianceData || []).map((d: any) => d.train_mse),
                    color: "#007AFF",
                  },
                  {
                    name: "Validation MSE (Variance)",
                    data: (biasVarianceData || []).map((d: any) => d.test_mse),
                    color: "#FF3B30",
                  },
                ]}
                height={350}
                yAxisLabel="Mean Squared Error"
              />
            )}
          </ChartCard>
        </div>
      )}

      {/* TAB 4: CROSS-VALIDATION EXPLORER */}
      {activeTab === "cv" && (
        <div className="space-y-6">
          {cvLoading ? (
            <Skeleton className="w-full h-80" />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-5 border border-ios-hairline">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[17px] font-bold text-ios-text">K-Fold Cross-Validation</h3>
                  <span className="text-[13px] font-bold text-ios-blue">
                    Mean RMSE: {cvData?.k_fold?.mean_rmse} ± {cvData?.k_fold?.std_rmse}
                  </span>
                </div>
                <div className="space-y-2">
                  {(cvData?.k_fold?.folds || []).map((f: any) => (
                    <div
                      key={f.fold}
                      className="flex items-center justify-between p-2.5 rounded-control bg-ios-secondaryBg/40 dark:bg-white/5 text-[14px]"
                    >
                      <span className="text-ios-secondaryText">Fold #{f.fold}</span>
                      <span className="font-mono font-semibold text-ios-text">{f.rmse}</span>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-5 border border-ios-hairline">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[17px] font-bold text-ios-text">TimeSeriesSplit (Temporal)</h3>
                  <span className="text-[13px] font-bold text-ios-purple">
                    Mean RMSE: {cvData?.time_series_split?.mean_rmse} ±{" "}
                    {cvData?.time_series_split?.std_rmse}
                  </span>
                </div>
                <div className="space-y-2">
                  {(cvData?.time_series_split?.folds || []).map((f: any) => (
                    <div
                      key={f.fold}
                      className="flex items-center justify-between p-2.5 rounded-control bg-ios-secondaryBg/40 dark:bg-white/5 text-[14px]"
                    >
                      <span className="text-ios-secondaryText">Fold #{f.fold} (Forward Window)</span>
                      <span className="font-mono font-semibold text-ios-text">{f.rmse}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
