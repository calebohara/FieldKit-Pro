"use client";

import { useRef } from "react";
import { Canvas } from "@react-three/fiber";
import GlassPlane from "./GlassPlane";
import { useMousePosition } from "./useMousePosition";

/**
 * WebGL Liquid Glass overlay for the iOS mobile nav pill.
 * Renders a Three.js canvas with a custom refractive shader behind nav items.
 *
 * Usage:
 *   <div ref={containerRef} style={{ position: "relative" }}>
 *     <GlassNav />
 *     {children — nav items on top}
 *   </div>
 */
interface GlassNavProps {
  /** Index of refraction (1.0 = air, 1.5 = glass). Default 1.45 */
  ior?: number;
  /** Base opacity 0-1. Default 0.7 */
  opacity?: number;
  /** Border radius in pixels for canvas clipping. Default 26 */
  borderRadius?: number;
}

export default function GlassNav({
  ior = 1.45,
  opacity = 0.7,
  borderRadius = 26,
}: GlassNavProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouse = useMousePosition(containerRef);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden pointer-events-none"
      style={{ borderRadius: `${borderRadius}px` }}
    >
      <Canvas
        gl={{
          alpha: true,
          antialias: false,
          powerPreference: "high-performance",
          preserveDrawingBuffer: false,
        }}
        dpr={[1, 1.5]} // Cap DPR for perf on retina
        camera={{ position: [0, 0, 1], near: 0.1, far: 10 }}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "auto", // Capture mouse for ripple
        }}
        // Reduce overhead — no shadows, no tone mapping
        shadows={false}
        flat
      >
        <GlassPlane mouse={mouse} ior={ior} opacity={opacity} />
      </Canvas>
    </div>
  );
}
