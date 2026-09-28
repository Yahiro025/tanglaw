"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import MobileStaticBackground from "@/components/mobile-static-background";

const NatureCanvas = dynamic(() => import("@/components/nature-canvas"), { ssr: false });

/** Mount the desktop canvas only at md+ (>= 768px); mobile uses the CSS background. */
function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return isDesktop;
}

export function DynamicNatureCanvas() {
  const pathname = usePathname();
  const isDesktop = useIsDesktop();

  if (pathname?.startsWith("/dashboard")) {
    return null;
  }

  return (
    <>
      <MobileStaticBackground />
      {isDesktop ? <NatureCanvas /> : null}
    </>
  );
}
