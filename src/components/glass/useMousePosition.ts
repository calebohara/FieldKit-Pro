"use client";

import { useState, useEffect, useCallback, useRef } from "react";

/**
 * Tracks normalized mouse position [0,1] within a target element.
 * Falls back to center (0.5, 0.5) when mouse is outside or on touch devices.
 * Uses requestAnimationFrame to throttle updates for 60fps.
 */
export function useMousePosition(elementRef: React.RefObject<HTMLElement | null>) {
  const [position, setPosition] = useState<[number, number]>([0.5, 0.5]);
  const rafId = useRef<number>(0);
  const pendingPos = useRef<[number, number]>([0.5, 0.5]);

  const handleMove = useCallback(
    (e: MouseEvent | TouchEvent) => {
      const el = elementRef.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      let clientX: number, clientY: number;

      if ("touches" in e && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else if ("clientX" in e) {
        clientX = e.clientX;
        clientY = e.clientY;
      } else {
        return;
      }

      const x = (clientX - rect.left) / rect.width;
      const y = 1.0 - (clientY - rect.top) / rect.height; // flip Y for GL
      pendingPos.current = [
        Math.max(0, Math.min(1, x)),
        Math.max(0, Math.min(1, y)),
      ];

      if (!rafId.current) {
        rafId.current = requestAnimationFrame(() => {
          setPosition(pendingPos.current);
          rafId.current = 0;
        });
      }
    },
    [elementRef]
  );

  const handleLeave = useCallback(() => {
    pendingPos.current = [0.5, 0.5];
    setPosition([0.5, 0.5]);
  }, []);

  useEffect(() => {
    const el = elementRef.current;
    if (!el) return;

    el.addEventListener("mousemove", handleMove, { passive: true });
    el.addEventListener("touchmove", handleMove, { passive: true });
    el.addEventListener("mouseleave", handleLeave);

    return () => {
      el.removeEventListener("mousemove", handleMove);
      el.removeEventListener("touchmove", handleMove);
      el.removeEventListener("mouseleave", handleLeave);
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, [elementRef, handleMove, handleLeave]);

  return position;
}
