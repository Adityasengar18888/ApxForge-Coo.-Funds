"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { Box, Layers, ShieldAlert, Sparkles, Activity, BarChart2 } from "lucide-react";
import { Card } from "@/components/ios/Card";
import { Segmented } from "@/components/ios/Segmented";
import { Skeleton } from "@/components/ios/Skeleton";

// Lazy-load 3D components
const PCA3DScatter = dynamic(
  () => import("@/components/charts/3d/PCA3DScatter").then((m) => m.PCA3DScatter),
  { ssr: false, loading: () => <Skeleton className="w-full h-[450px]" /> }
);
const RiskReturn3DScatter = dynamic(
  () => import("@/components/charts/3d/RiskReturn3DScatter").then((m) => m.RiskReturn3DScatter),
  { ssr: false, loading: () => <Skeleton className="w-full h-[450px]" /> }
);
const Correlation3DSurface = dynamic(
  () => import("@/components/charts/3d/Correlation3DSurface").then((m) => m.Correlation3DSurface),
  { ssr: false, loading: () => <Skeleton className="w-full h-[450px]" /> }
);
const MonteCarlo3DCone = dynamic(
  () => import("@/components/charts/3d/MonteCarlo3DCone").then((m) => m.MonteCarlo3DCone),
  { ssr: false, loading: () => <Skeleton className="w-full h-[450px]" /> }
);
const Volatility3DSurface = dynamic(
  () => import("@/components/charts/3d/Volatility3DSurface").then((m) => m.Volatility3DSurface),
  { ssr: false, loading: () => <Skeleton className="w-full h-[450px]" /> }
);
const SectorPerformance3DBar = dynamic(
  () => import("@/components/charts/3d/SectorPerformance3DBar").then((m) => m.SectorPerformance3DBar),
  { ssr: false, loading: () => <Skeleton className="w-full h-[450px]" /> }
);

export default function Visualizer3DPage() {
  const [activeScene, setActiveScene] = useState("pca");

  const scenes = [
    { label: "PCA 3D Scatter", value: "pca", desc: "First 3 principal components colored by cluster" },
    { label: "Risk vs Return vs MCap", value: "risk_return", desc: "3D factor space (Risk × Return × Market Cap)" },
    { label: "Correlation Surface", value: "correlation", desc: "3D elevation topological correlation mesh" },
    { label: "Monte Carlo Cone", value: "monte_carlo", desc: "Stochastic path trajectory simulation cone" },
    { label: "Volatility Surface", value: "vol_surface", desc: "Moneyness × Maturity implied volatility smile" },
    { label: "Sector 3D Bar", value: "sector_bar", desc: "3D relative sector alpha performance columns" },
  ];

  const currentScene = scenes.find((s) => s.value === activeScene);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[34px] font-bold tracking-tight text-ios-text">3D Visualization Hub</h1>
          <p className="text-[15px] text-ios-secondaryText">
            Interactive Three.js WebGL Surfaces, Cones, Scatters & Topological Manifolds
          </p>
        </div>

        <Segmented
          options={scenes.map((s) => ({ label: s.label, value: s.value }))}
          value={activeScene}
          onChange={(v) => setActiveScene(v)}
          className="flex-wrap"
        />
      </div>

      <Card className="p-4 border border-ios-hairline">
        <div className="mb-3">
          <h2 className="text-[18px] font-bold text-ios-text">{currentScene?.label}</h2>
          <p className="text-[13px] text-ios-secondaryText">{currentScene?.desc}</p>
          <div className="text-[11px] text-ios-blue mt-1">
            Tip: Left click & drag to orbit • Right click to pan • Scroll to zoom • Click top-right icon to reset view
          </div>
        </div>

        <div className="w-full">
          {activeScene === "pca" && <PCA3DScatter height={480} />}
          {activeScene === "risk_return" && <RiskReturn3DScatter height={480} />}
          {activeScene === "correlation" && <Correlation3DSurface height={480} />}
          {activeScene === "monte_carlo" && <MonteCarlo3DCone height={480} />}
          {activeScene === "vol_surface" && <Volatility3DSurface height={480} />}
          {activeScene === "sector_bar" && <SectorPerformance3DBar height={480} />}
        </div>
      </Card>
    </div>
  );
}

