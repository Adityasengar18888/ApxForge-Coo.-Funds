"use client";

import React, { useState } from "react";
import { ThreeCanvasWrapper } from "./ThreeCanvasWrapper";

const sectorData = [
  { name: "Tech", returnVal: 3.2, color: "#007AFF" },
  { name: "Finance", returnVal: 1.8, color: "#34C759" },
  { name: "Health", returnVal: 0.9, color: "#AF52DE" },
  { name: "Energy", returnVal: -1.2, color: "#FF3B30" },
  { name: "Consumer", returnVal: 2.1, color: "#FF9500" },
  { name: "Industrial", returnVal: 1.4, color: "#5AC8FA" },
  { name: "Utilities", returnVal: -0.5, color: "#FFCC00" },
];

function SectorBarsMesh() {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <group position={[-3, 0, 0]}>
      <gridHelper args={[8, 8, "#8E8E93", "#39393D"]} position={[3, 0, 0]} />

      {sectorData.map((sec, idx) => {
        const height = Math.abs(sec.returnVal) * 0.8;
        const isPositive = sec.returnVal >= 0;
        const posY = isPositive ? height / 2 : -height / 2;
        const posX = idx * 1.0;
        const isHovered = hovered === sec.name;

        return (
          <group key={sec.name} position={[posX, posY, 0]}>
            <mesh
              onPointerOver={(e) => {
                e.stopPropagation();
                setHovered(sec.name);
              }}
              onPointerOut={() => setHovered(null)}
            >
              <boxGeometry args={[0.6, height, 0.6]} />
              <meshStandardMaterial
                color={sec.color}
                roughness={0.2}
                metalness={0.5}
                emissive={isHovered ? sec.color : "#000"}
                emissiveIntensity={isHovered ? 0.7 : 0}
              />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

export const SectorPerformance3DBar: React.FC<{ height?: number }> = ({ height = 420 }) => {
  return (
    <ThreeCanvasWrapper height={height} cameraPosition={[0, 4, 7]}>
      <SectorBarsMesh />
    </ThreeCanvasWrapper>
  );
};
