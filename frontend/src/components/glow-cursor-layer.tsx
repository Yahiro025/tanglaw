"use client";

import { useSyncExternalStore } from "react";
import dynamic from "next/dynamic";

const GlowCursor = dynamic(() => import("@/components/ui/GlowCursor"), {
  ssr: false,
});

function subscribe(callback: () => void) {
  window.addEventListener("resize", callback);
  const finePointerQuery = window.matchMedia("(pointer: fine)");
  const reducedMotionQuery = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  );
  if (finePointerQuery.addEventListener) {
    finePointerQuery.addEventListener("change", callback);
  }
  if (reducedMotionQuery.addEventListener) {
    reducedMotionQuery.addEventListener("change", callback);
  }

  return () => {
    window.removeEventListener("resize", callback);
    if (finePointerQuery.removeEventListener) {
      finePointerQuery.removeEventListener("change", callback);
    }
    if (reducedMotionQuery.removeEventListener) {
      reducedMotionQuery.removeEventListener("change", callback);
    }
  };
}

function getSnapshot() {
  if (typeof window === "undefined") return false;
  const finePointer = window.matchMedia("(pointer: fine)").matches;
  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;
  return finePointer && window.innerWidth >= 768 && !reducedMotion;
}

function getServerSnapshot() {
  return false;
}

export default function GlowCursorLayer() {
  const isDesktop = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );

  if (!isDesktop) {
    return null;
  }

  return (
    <GlowCursor
      useWindowPointer
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        pointerEvents: "none",
        zIndex: 40,
      }}
      color="#67E8F9"
      secondaryColor="#A78BFA"
      trailLength={40}
      trailWidth={8}
      trailTaper={0.8}
      followSpeed={0.42}
      glowIntensity={1.9}
      glowSpread={1.2}
      hotspot={0.65}
      brightness={1.25}
      opacity={1}
      pulseSpeed={1.1}
      noiseStrength={0.035}
      idleFade
      idleTimeout={400}
      fadeDuration={900}
      maxDevicePixelRatio={1}
      blendMode="screen"
    />
  );
}
