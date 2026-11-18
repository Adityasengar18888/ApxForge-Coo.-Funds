"use client";

import React, { useState } from "react";
import { ThreeCanvasWrapper } from "./ThreeCanvasWrapper";

interface Asset3D {
  symbol: string;
  volatility: number; // X: Risk
  annualReturn: number; // Y: Return
  marketCapLog: number; // Z: Market Cap log
  color?: string;
}

const sampleAssets: Asset3D[] = [
  { symbol: "AAPL", volatility: 0.22, annualReturn: 0.28, marketCapLog: 3.0, color: "#007AFF" },
  { symbol: "MSFT", volatility: 0.20, annualReturn: 0.24, marketCapLog: 3.1, color: "#34C759" },
  { symbol: "NVDA", volatility: 0.45, annualReturn: 0.85, marketCapLog: 3.2, color: "#AF52DE" },
  { symbol: "TSLA", volatility: 0.55, annualReturn: 0.15, marketCapLog: 2.7, color: "#FF3B30" },
  { symbol: "AMZN", volatility: 0.28, annualReturn: 0.32, marketCapLog: 2.9, color: "#FF9500" },
  { symbol: "META", volatility: 0.35, annualReturn: 0.58, marketCapLog: 2.8, color: "#5AC8FA" },
  { symbol: "GOOGL", volatility: 0.24, annualReturn: 0.22, marketCapLog: 2.9, color: "#FFCC00" },
  { symbol: "SPY", volatility: 0.14, annualReturn: 0.18, marketCapLog: 3.5, color: "#5856D6" },
  { symbol: "QQQ", volatility: 0.18, annualReturn: 0.25, marketCapLog: 3.3, color: "#FF2D55" },
];

function AssetsScatterMesh({ assets }: { assets: Asset3D[] }) {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <group>
      <gridHelper args={[8, 8, "#8E8E93", "#39393D"]} position={[0, -1, 0]} />

      {assets.map((asset) => {
        const posX = (asset.volatility - 0.3) * 8;
        const posY = (asset.annualReturn - 0.3) * 6;
        const posZ = (asset.marketCapLog - 3.0) * 8;
        const isHovered = hovered === asset.symbol;

        return (
          <group key={asset.symbol} position={[posX, posY, posZ]}>
            <mesh
              onPointerOver={(e) => {
                e.stopPropagation();
                setHovered(asset.symbol);
              }}
              onPointerOut={() => setHovered(null)}
            >
              <sphereGeometry args={[isHovered ? 0.35 : 0.25, 24, 24]} />
              <meshStandardMaterial
                color={asset.color || "#007AFF"}
                roughness={0.2}
                metalness={0.6}
                emissive={isHovered ? asset.color : "#000"}
                emissiveIntensity={isHovered ? 0.8 : 0}
              />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

export const RiskReturn3DScatter: React.FC<{ height?: number }> = ({ height = 420 }) => {
  return (
    <ThreeCanvasWrapper height={height} cameraPosition={[5, 4, 6]}>
      <AssetsScatterMesh assets={sampleAssets} />
    </ThreeCanvasWrapper>
  );
};

