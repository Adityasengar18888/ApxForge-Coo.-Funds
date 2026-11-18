"use client";

import React, { useMemo } from "react";
import { ThreeCanvasWrapper } from "./ThreeCanvasWrapper";
import * as THREE from "three";

function MonteCarloPathsMesh() {
  const numPaths = 35;
  const numSteps = 50;

  const lines = useMemo(() => {
    const paths = [];
    const colors = ["#007AFF", "#34C759", "#FF9500", "#FF3B30", "#AF52DE"];

    for (let p = 0; p < numPaths; p++) {
      const points = [];
      let currentY = 0;
      const drift = 0.0005;
      const vol = 0.04;

      for (let s = 0; s < numSteps; s++) {
        const x = (s / numSteps) * 8 - 4; // Time along X
        currentY += drift + (Math.random() - 0.49) * vol;
        const z = (p / numPaths) * 4 - 2; // Scenarios along Z
        points.push(new THREE.Vector3(x, currentY * 8, z));
      }

      const curve = new THREE.CatmullRomCurve3(points);
      const geom = new THREE.TubeGeometry(curve, 30, 0.025, 6, false);
      const color = colors[p % colors.length];
      paths.push({ geom, color });
    }
    return paths;
  }, []);

  return (
    <group>
      <gridHelper args={[10, 10, "#8E8E93", "#39393D"]} position={[0, -2, 0]} />
      {lines.map((line, idx) => (
        <mesh key={idx} geometry={line.geom}>
          <meshStandardMaterial color={line.color} roughness={0.3} metalness={0.7} />
        </mesh>
      ))}
    </group>
  );
}

export const MonteCarlo3DCone: React.FC<{ height?: number }> = ({ height = 420 }) => {
  return (
    <ThreeCanvasWrapper height={height} cameraPosition={[0, 4, 7]}>
      <MonteCarloPathsMesh />
    </ThreeCanvasWrapper>
  );
};
