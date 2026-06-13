"use client";

import dynamic from "next/dynamic";

const NatureCanvas = dynamic(() => import("@/components/nature-canvas"), { ssr: false });

export function DynamicNatureCanvas() {
  return <NatureCanvas />;
}
