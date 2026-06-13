"use client";

/**
 * Shared scroll hide/show hook for glassmorphism pill navigation.
 * Manages scroll listener, hover state, and lastScrollY ref.
 */
import { useState, useEffect, useRef } from "react";

interface ScrollHideOptions {
  hideThreshold?: number;
  showThreshold?: number;
}

export function useScrollHide(options?: ScrollHideOptions) {
  const hideThreshold = options?.hideThreshold ?? 60;
  const showThreshold = options?.showThreshold ?? 30;

  const [isVisible, setIsVisible] = useState(true);
  const [isAtTop, setIsAtTop] = useState(true);
  const [hovered, setHovered] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      setIsAtTop(currentY < showThreshold);

      if (currentY > hideThreshold && currentY > lastScrollY.current) {
        setIsVisible(false);
      } else if (currentY < lastScrollY.current) {
        if (currentY < showThreshold) setIsVisible(true);
      }
      lastScrollY.current = currentY;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [hideThreshold, showThreshold]);

  return {
    isVisible: hovered || isAtTop || isVisible,
    isAtTop,
    hovered,
    setHovered,
  };
}
