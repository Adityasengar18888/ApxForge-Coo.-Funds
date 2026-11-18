"use client";

import React, { useMemo } from "react";
import { ThreeCanvasWrapper } from "./ThreeCanvasWrapper";
import * as THREE from "three";

function VolatilitySurfaceMesh() {
  const gridX = 20;
  const gridY = 20;

  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(8, 8, gridX, gridY);
    const pos = geo.attributes.position;

    for (let i = 0; i < pos.count; i++) {
      const u = pos.getX(i); // Moneyness (Strike / Spot)
      const v = pos.getY(i); // Time to Maturity

      // Classic Implied Volatility Smile / Skew equation:
      // Smile curvature: alpha * (moneyness)^2 + term structure decay
      const moneynessOffset = u / 3;
      const smile = 0.25 * moneynessOffset * moneynessOffset - 0.1 * moneynessOffset;
      const termStructure = Math.sqrt(Math.max(0.1, (v + 4) / 8)) * 0.4;
      const iv = smile + termStructure;

      pos.setZ(i, iv * 2.0);
    }
    geo.computeVertexNormals();
    return geo;
  }, []);

  return (
    <group rotation={[-Math.PI / 3, 0, 0]}>
      <mesh geometry={geometry}>
        <meshStandardMaterial
          color="#5AC8FA"
          wireframe={false}
          roughness={0.2}
          metalness={0.6}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh geometry={geometry}>
        <meshBasicMaterial color="#007AFF" wireframe={true} opacity={0.3} transparent={true} />
      </mesh>
    </group>
  );
}

export const Volatility3DSurface: React.FC<{ height?: number }> = ({ height = 420 }) => {
  return (
    <ThreeCanvasWrapper height={height} cameraPosition={[0, 6, 6]}>
      <VolatilitySurfaceMesh />
    </ThreeCanvasWrapper>
  );
};
