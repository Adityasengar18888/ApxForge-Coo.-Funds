"use client";

import React, { useState, useEffect, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { RotateCcw } from "lucide-react";
import { Skeleton } from "@/components/ios/Skeleton";
import { useTheme } from "next-themes";

interface ThreeCanvasWrapperProps {
  children: React.ReactNode;
  height?: number;
  cameraPosition?: [number, number, number];
}

export const ThreeCanvasWrapper: React.FC<ThreeCanvasWrapperProps> = ({
  children,
  height = 420,
  cameraPosition = [5, 5, 5],
}) => {
  const [mounted, setMounted] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <Skeleton className="w-full" style={{ height: `${height}px` }} />;
  }

  return (
    <div className="relative w-full rounded-card overflow-hidden border border-ios-hairline bg-ios-secondaryBg/30 dark:bg-black/40" style={{ height: `${height}px` }}>
      <button
        type="button"
        onClick={() => setResetKey((k) => k + 1)}
        title="Reset 3D Camera View"
        className="absolute top-3 right-3 z-10 p-2 rounded-control bg-ios-card/80 backdrop-blur-md border border-ios-hairline text-ios-secondaryText hover:text-ios-text shadow-sm ios-press"
      >
        <RotateCcw className="w-4 h-4" />
      </button>

      <Canvas
        key={resetKey}
        camera={{ position: cameraPosition, fov: 50 }}
        style={{ width: "100%", height: "100%" }}
      >
        <ambientLight intensity={isDark ? 0.7 : 0.9} />
        <directionalLight position={[10, 15, 10]} intensity={1.2} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} />
        <Suspense fallback={null}>
          {children}
          <OrbitControls makeDefault enableDamping dampingFactor={0.05} />
        </Suspense>
      </Canvas>

      <noscript>
        <div className="absolute inset-0 flex items-center justify-center p-4 text-center text-ios-secondaryText">
          JavaScript is required to render interactive 3D WebGL scenes.
        </div>
      </noscript>
    </div>
  );
};
