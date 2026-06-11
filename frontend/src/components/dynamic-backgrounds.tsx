"use client";

import dynamic from "next/dynamic";

const NatureCanvas = dynamic(() => import("@/components/nature-canvas"), { ssr: false });
const ParticlesBackground = dynamic(() => import("../../components/ui/particles-background"), { ssr: false });

export function DynamicNatureCanvas() {
  return <NatureCanvas />;
}

export function DynamicParticlesBackground() {
  return <ParticlesBackground />;
}
