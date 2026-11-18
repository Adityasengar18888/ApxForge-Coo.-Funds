"use client";

import React, { useMemo } from "react";
import { ThreeCanvasWrapper } from "./ThreeCanvasWrapper";
import * as THREE from "three";

function CorrelationSurfaceMesh() {
  const size = 7;
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(6, 6, size - 1, size - 1);
    const pos = geo.attributes.position;

    // Simulated correlation elevation
    const matrix = [
      [1.0, 0.78, 0.65, 0.42, 0.71, 0.68, 0.74],
      [0.78, 1.0, 0.72, 0.38, 0.82, 0.75, 0.86],
      [0.65, 0.72, 1.0, 0.51, 0.69, 0.64, 0.7],
      [0.42, 0.38, 0.51, 1.0, 0.46, 0.41, 0.39],
      [0.71, 0.82, 0.69, 0.46, 1.0, 0.79, 0.83],
      [0.68, 0.75, 0.64, 0.41, 0.79, 1.0, 0.81],
      [0.74, 0.86, 0.7, 0.39, 0.83, 0.81, 1.0],
    ];

    for (let i = 0; i < pos.count; i++) {
      const row = Math.floor(i / size);
      const col = i % size;
      const val = matrix[row % size][col % size];
      pos.setZ(i, val * 1.5 - 0.75);
    }
    geo.computeVertexNormals();
    return geo;
  }, []);

  return (
    <group rotation={[-Math.PI / 3, 0, 0]}>
      <mesh geometry={geometry}>
        <meshStandardMaterial
          color="#007AFF"
          wireframe={false}
          roughness={0.3}
          metalness={0.5}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh geometry={geometry}>
        <meshBasicMaterial color="#AF52DE" wireframe={true} />
      </mesh>
    </group>
  );
}

export const Correlation3DSurface: React.FC<{ height?: number }> = ({ height = 420 }) => {
  return (
    <ThreeCanvasWrapper height={height} cameraPosition={[0, 5, 5]}>
      <CorrelationSurfaceMesh />
    </ThreeCanvasWrapper>
  );
};
