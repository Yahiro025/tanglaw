"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const LandingBackground = dynamic(
  () => import("../../components/ui/landing-animations").then((mod) => mod.LandingBackground),
  { ssr: false }
);

export function DynamicLandingBackground() {
  // Skip the heavy animated shadow on mobile; the CSS mobile background is used instead.
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return isDesktop ? <LandingBackground /> : null;
}
