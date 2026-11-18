"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Cpu,
  Play,
  RotateCw,
  Sliders,
  CheckCircle,
  HelpCircle,
  Sparkles,
  BarChart2,
  GitBranch,
} from "lucide-react";
import { Card } from "@/components/ios/Card";
import { Segmented } from "@/components/ios/Segmented";
import { Select } from "@/components/ios/Select";
import { Button } from "@/components/ios/Button";
import { ChartCard } from "@/components/ios/ChartCard";
import { LineAreaChart } from "@/components/charts/2d/LineAreaChart";
import { Skeleton } from "@/components/ios/Skeleton";
import { apiClient } from "@/lib/api";

export default function ModelLabPage() {
  const [activeTab, setActiveTab] = useState("training");
  const [symbol, setSymbol] = useState("AAPL");
  const [taskType, setTaskType] = useState("regression");
  const [modelName, setModelName] = useState("random_forest");
  const [imbalancedStrategy, setImbalancedStrategy] = useState("smote");

  // Model training mutation
  const trainMutation = useMutation({
    mutationFn: () =>
      apiClient<any>("/model-lab/train", {
        method: "POST",
        body: JSON.stringify({
          symbol,
          task_type: taskType,
          model_name: modelName,
          imbalanced_strategy: taskType === "classification" ? imbalancedStrategy : undefined,
        }),
      }),
  });

  // Model registry query
  const { data: registry, refetch: refetchRegistry } = useQuery({
    queryKey: ["modelRegistry"],
    queryFn: () => apiClient<any[]>("/model-lab/registry"),
  });

  // AutoML query
  const { data: automlData, isFetching: automlLoading, refetch: runAutoML } = useQuery({
    queryKey: ["automlSearch", symbol],
    queryFn: () => apiClient<any>(`/model-lab/automl?symbol=${symbol}&budget_seconds=10`),
    enabled: activeTab === "automl",
  });

  // Optuna tuning query
  const { data: tuningData, isFetching: tuningLoading, refetch: runTuning } = useQuery({
    queryKey: ["tuning", symbol],
    queryFn: () => apiClient<any>(`/model-lab/tuning?symbol=${symbol}&strategy=optuna&n_trials=10`),
    enabled: activeTab === "tuning",
  });

  const retrainModelMutation = useMutation({
    mutationFn: (name: string) =>
      apiClient<any>(`/model-lab/retrain/${name}`, { method: "POST" }),
    onSuccess: () => refetchRegistry(),
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[34px] font-bold tracking-tight text-ios-text">Model Lab</h1>
          <p className="text-[15px] text-ios-secondaryText">
            Machine Learning Lifecycle, AutoML, Hyperparameter Tuning & Model Registry
          </p>
        </div>

        <Segmented
          options={[
            { label: "Training", value: "training" },
            { label: "AutoML", value: "automl" },
            { label: "Tuning", value: "tuning" },
            { label: "Registry", value: "registry" },
          ]}
          value={activeTab}
          onChange={(v) => setActiveTab(v)}
        />
      </div>

      {/* Persistent Disclaimer */}
      <div className="px-4 py-2.5 rounded-card bg-ios-yellow/10 border border-ios-yellow/30 text-[13px] text-ios-yellow font-medium">
        Not financial advice. Predictions are statistical estimates, not guarantees.
      </div>

      {/* TAB 1: TRAINING */}
      {activeTab === "training" && (
        <div className="space-y-6">
          <Card className="p-5 border border-ios-hairline">
            <h3 className="text-[18px] font-bold text-ios-text mb-4">Architecture Configuration</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Select
                label="Target Symbol"
                options={[
                  { label: "AAPL", value: "AAPL" },
                  { label: "MSFT", value: "MSFT" },
                  { label: "NVDA", value: "NVDA" },
                  { label: "TSLA", value: "TSLA" },
                ]}
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
              />

              <Select
                label="Objective Task"
                options={[
                  { label: "Next Price Regression", value: "regression" },
                  { label: "Directional Up/Down", value: "classification" },
                ]}
                value={taskType}
                onChange={(e) => setTaskType(e.target.value)}
              />

              <Select
                label="Model Algorithm"
                options={[
                  { label: "Random Forest", value: "random_forest" },
                  { label: "Gradient Boosting", value: "gradient_boosting" },
                  { label: "XGBoost", value: "xgboost" },
                  { label: "LightGBM", value: "lightgbm" },
                  { label: "Ridge Regression", value: "ridge" },
                  { label: "ElasticNet", value: "elasticnet" },
                  { label: "Voting Ensemble", value: "voting" },
                  { label: "Stacking Regressor", value: "stacking" },
                ]}
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
              />

              {taskType === "classification" ? (
                <Select
                  label="Imbalance Resampling"
                  options={[
                    { label: "SMOTE (Synthetic)", value: "smote" },
                    { label: "ADASYN", value: "adasyn" },
                    { label: "None (Raw)", value: "none" },
                  ]}
                  value={imbalancedStrategy}
                  onChange={(e) => setImbalancedStrategy(e.target.value)}
                />
              ) : (
                <div className="flex items-end">
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => trainMutation.mutate()}
                    disabled={trainMutation.isPending}
                    className="w-full gap-2"
                  >
                    <Play className="w-4 h-4" />
                    <span>{trainMutation.isPending ? "Training..." : "Train Model"}</span>
                  </Button>
                </div>
              )}
            </div>

            {taskType === "classification" && (
              <div className="mt-4 flex justify-end">
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => trainMutation.mutate()}
                  disabled={trainMutation.isPending}
                  className="gap-2"
                >
                  <Play className="w-4 h-4" />
                  <span>{trainMutation.isPending ? "Training..." : "Train Model"}</span>
                </Button>
              </div>
            )}
          </Card>

          {/* Training Results */}
          {trainMutation.data && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {Object.entries(trainMutation.data.metrics || {}).map(([key, val]: [string, any]) => (
                  <Card key={key}>
                    <div className="text-[12px] font-semibold text-ios-secondaryText uppercase tracking-wider">
                      {key}
                    </div>
                    <div className="text-[24px] font-bold text-ios-blue mt-1">{val}</div>
                  </Card>
                ))}
              </div>

              {/* Feature Importance & SHAP Waterfall */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartCard
                  title="SHAP Global Feature Importance"
                  subtitle="Mean absolute Shapley impact across test set"
                >
                  <div className="space-y-3 pt-2">
                    {(trainMutation.data.shap_summary || []).map((feat: any) => (
                      <div key={feat.feature} className="space-y-1">
                        <div className="flex justify-between text-[13px] font-medium">
                          <span className="text-ios-text">{feat.feature}</span>
                          <span className="text-ios-secondaryText">{feat.mean_abs_shap}</span>
                        </div>
                        <div className="w-full bg-ios-secondaryBg dark:bg-white/10 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-ios-purple h-full rounded-full"
                            style={{ width: `${Math.min(100, feat.mean_abs_shap * 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </ChartCard>

                <ChartCard
                  title="Permutation Feature Ranking"
                  subtitle="Empirical model degradation when feature is randomized"
                >
                  <div className="space-y-3 pt-2">
                    {(trainMutation.data.feature_importance || []).map((feat: any) => (
                      <div key={feat.feature} className="space-y-1">
                        <div className="flex justify-between text-[13px] font-medium">
                          <span className="text-ios-text">{feat.feature}</span>
                          <span className="text-ios-green font-semibold">+{feat.importance}</span>
                        </div>
                        <div className="w-full bg-ios-secondaryBg dark:bg-white/10 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-ios-green h-full rounded-full"
                            style={{ width: `${Math.min(100, Math.max(5, feat.importance * 100))}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </ChartCard>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: AUTOML */}
      {activeTab === "automl" && (
        <div className="space-y-6">
          <Card className="p-5 flex items-center justify-between">
            <div>
              <h3 className="text-[18px] font-bold text-ios-text">Automated Machine Learning</h3>
              <p className="text-[13px] text-ios-secondaryText mt-0.5">
                Evaluates candidate regressors × preprocessing variants within time budget
              </p>
            </div>
            <Button
              variant="primary"
              size="md"
              onClick={() => runAutoML()}
              disabled={automlLoading}
              className="gap-2"
            >
              <RotateCw className={`w-4 h-4 ${automlLoading ? "animate-spin" : ""}`} />
              <span>{automlLoading ? "Evaluating..." : "Run AutoML Search"}</span>
            </Button>
          </Card>

          {automlData && (
            <Card className="p-0 overflow-hidden border border-ios-hairline">
              <div className="px-5 py-3 border-b border-ios-hairline bg-ios-secondaryBg/40 dark:bg-white/5 flex items-center justify-between">
                <span className="text-[14px] font-bold text-ios-text">
                  AutoML Leaderboard ({automlData.total_evaluated} models scored in{" "}
                  {automlData.elapsed_seconds}s)
                </span>
                <span className="text-[12px] font-semibold text-ios-green">
                  Champion: {automlData.best_model?.model_name}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-ios-hairline text-[12px] font-semibold uppercase tracking-wider text-ios-secondaryText">
                      <th className="px-5 py-3">Rank</th>
                      <th className="px-5 py-3">Model</th>
                      <th className="px-5 py-3">Scaler</th>
                      <th className="px-5 py-3 text-right">RMSE (Lower is better)</th>
                      <th className="px-5 py-3 text-right">MAE</th>
                      <th className="px-5 py-3 text-right">R²</th>
                      <th className="px-5 py-3 text-right">Fit Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ios-hairline text-[14px]">
                    {(automlData.leaderboard || []).map((row: any) => (
                      <tr
                        key={`${row.rank}-${row.model_name}`}
                        className={row.rank === 1 ? "bg-ios-green/10 font-semibold" : ""}
                      >
                        <td className="px-5 py-3.5">
                          {row.rank === 1 ? "🥇 #1" : row.rank === 2 ? "🥈 #2" : `#${row.rank}`}
                        </td>
                        <td className="px-5 py-3.5 text-ios-text">{row.model_name}</td>
                        <td className="px-5 py-3.5 text-ios-secondaryText capitalize">{row.scaler}</td>
                        <td className="px-5 py-3.5 text-right font-bold text-ios-blue">{row.rmse}</td>
                        <td className="px-5 py-3.5 text-right">{row.mae}</td>
                        <td className="px-5 py-3.5 text-right">{row.r2}</td>
                        <td className="px-5 py-3.5 text-right text-ios-secondaryText">
                          {row.train_time_ms} ms
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* TAB 3: HYPERPARAMETER TUNING */}
      {activeTab === "tuning" && (
        <div className="space-y-6">
          <Card className="p-5 flex items-center justify-between">
            <div>
              <h3 className="text-[18px] font-bold text-ios-text">Optuna Bayesian Optimization</h3>
              <p className="text-[13px] text-ios-secondaryText mt-0.5">
                Tree-structured Parzen Estimator (TPE) sampler over hyperparameter search spaces
              </p>
            </div>
            <Button
              variant="primary"
              size="md"
              onClick={() => runTuning()}
              disabled={tuningLoading}
              className="gap-2"
            >
              <RotateCw className={`w-4 h-4 ${tuningLoading ? "animate-spin" : ""}`} />
              <span>{tuningLoading ? "Optimizing..." : "Start Optuna Study"}</span>
            </Button>
          </Card>

          {tuningData && (
            <div className="space-y-6">
              <ChartCard
                title="Optimization History Curve"
                subtitle="Objective RMSE metric per trial"
              >
                <LineAreaChart
                  dates={(tuningData.trials_history || []).map((t: any) => `Trial ${t.trial}`)}
                  series={[
                    {
                      name: "Validation RMSE",
                      data: (tuningData.trials_history || []).map((t: any) => t.value),
                      color: "#AF52DE",
                      area: true,
                    },
                  ]}
                  height={320}
                  yAxisLabel="Validation RMSE"
                />
              </ChartCard>

              <Card className="p-5 border border-ios-hairline">
                <h4 className="text-[16px] font-bold text-ios-text mb-2">Optimal Hyperparameters</h4>
                <div className="p-3 rounded-control bg-ios-secondaryBg/60 dark:bg-white/5 font-mono text-[13px] text-ios-blue">
                  {JSON.stringify(tuningData.best_params, null, 2)}
                </div>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: MODEL REGISTRY */}
      {activeTab === "registry" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[18px] font-bold text-ios-text">Persistent Model Artifacts</h3>
            <Button variant="secondary" size="sm" onClick={() => refetchRegistry()}>
              Refresh Registry
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(registry || []).map((m: any) => (
              <Card key={m.model_name} className="p-5 border border-ios-hairline">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="text-[17px] font-bold text-ios-text">{m.model_name}</h4>
                    <span className="text-[12px] font-medium text-ios-secondaryText">
                      v{m.version} • {m.task_type}
                    </span>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase bg-ios-green/15 text-ios-green">
                    {m.status}
                  </span>
                </div>

                <div className="space-y-1.5 text-[13px] mb-4">
                  <div className="flex justify-between">
                    <span className="text-ios-secondaryText">Trained At:</span>
                    <span className="font-mono text-ios-text">{m.trained_at?.slice(0, 16)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ios-secondaryText">Features:</span>
                    <span className="text-ios-text">{m.features?.length || 0} features</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ios-secondaryText">Performance:</span>
                    <span className="font-semibold text-ios-blue">
                      {m.metrics ? JSON.stringify(m.metrics) : "N/A"}
                    </span>
                  </div>
                </div>

                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full gap-2"
                  onClick={() => retrainModelMutation.mutate(m.model_name)}
                  disabled={retrainModelMutation.isPending}
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  Retrain Model
                </Button>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
