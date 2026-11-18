"use client";

import React, { useRef, useState } from "react";
import { ThreeCanvasWrapper } from "./ThreeCanvasWrapper";
import * as THREE from "three";

interface Point3D {
  pc1: number;
  pc2: number;
  pc3: number;
  label?: string;
  cluster?: number;
}

const clusterColors = ["#007AFF", "#34C759", "#AF52DE", "#FF9500", "#FF2D55"];

function PointsMesh({ points }: { points: Point3D[] }) {
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <group>
      {/* 3D Coordinate Grid Reference */}
      <gridHelper args={[10, 10, "#8E8E93", "#48484A"]} position={[0, -2, 0]} />

      {points.map((pt, idx) => {
        const color = clusterColors[(pt.cluster || idx) % clusterColors.length];
        const isHovered = hovered === idx;
        return (
          <mesh
            key={idx}
            position={[pt.pc1 * 1.5, pt.pc2 * 1.5, pt.pc3 * 1.5]}
            onPointerOver={(e) => {
              e.stopPropagation();
              setHovered(idx);
            }}
            onPointerOut={() => setHovered(null)}
          >
            <sphereGeometry args={[isHovered ? 0.22 : 0.15, 16, 16]} />
            <meshStandardMaterial
              color={color}
              emissive={isHovered ? color : "#000"}
              emissiveIntensity={isHovered ? 0.6 : 0}
              roughness={0.2}
              metalness={0.4}
            />
          </mesh>
        );
      })}
    </group>
  );
}

export const PCA3DScatter: React.FC<{ points?: Point3D[]; height?: number }> = ({
  points,
  height = 420,
}) => {
  // Sample PCA points if none provided
  const defaultPoints: Point3D[] = Array.from({ length: 45 }).map((_, i) => ({
    pc1: Math.sin(i * 0.4) * 2.5 + (Math.random() - 0.5),
    pc2: Math.cos(i * 0.3) * 2.0 + (Math.random() - 0.5),
    pc3: Math.sin(i * 0.6) * 1.8 + (Math.random() - 0.5),
    cluster: i % 4,
  }));

  const data = points && points.length > 0 ? points : defaultPoints;

  return (
    <ThreeCanvasWrapper height={height} cameraPosition={[6, 4, 6]}>
      <PointsMesh points={data} />
    </ThreeCanvasWrapper>
  );
};

