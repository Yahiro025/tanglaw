"use client";

import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";

interface ScrollRevealContextValue {
  observe: (element: HTMLElement, callback: (isIntersecting: boolean) => void) => () => void;
}

const ScrollRevealContext = createContext<ScrollRevealContextValue | null>(null);

export function ScrollRevealProvider({ children }: { children: ReactNode }) {
  const callbacksRef = useRef<Map<Element, (isIntersecting: boolean) => void>>(new Map());

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const callback = callbacksRef.current.get(entry.target);
          if (callback) {
            callback(entry.isIntersecting);
          }
        });
      },
      { threshold: 0.1, rootMargin: "-100px" }
    );

    // Observe all registered elements
    callbacksRef.current.forEach((_, element) => {
      observer.observe(element);
    });

    return () => observer.disconnect();
  }, []);

  const observe = (element: HTMLElement, callback: (isIntersecting: boolean) => void) => {
    callbacksRef.current.set(element, callback);
    return () => {
      callbacksRef.current.delete(element);
    };
  };

  return (
    <ScrollRevealContext.Provider value={{ observe }}>
      {children}
    </ScrollRevealContext.Provider>
  );
}

interface ScrollRevealProps {
  children: ReactNode;
  delay?: number;
  direction?: "up" | "down" | "left" | "right" | "none";
  className?: string;
}

export default function ScrollReveal({
  children,
  delay = 0,
  direction = "up",
  className = "",
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const context = useContext(ScrollRevealContext);

  useEffect(() => {
    if (!ref.current || !context) return;

    const unsubscribe = context.observe(ref.current, (isIntersecting) => {
      if (isIntersecting) {
        setIsVisible(true);
      }
    });

    return unsubscribe;
  }, [context]);

  const directionClass = {
    up: "scroll-reveal-up",
    down: "scroll-reveal-down",
    left: "scroll-reveal-left",
    right: "scroll-reveal-right",
    none: "scroll-reveal-none",
  }[direction];

  return (
    <div
      ref={ref}
      className={`scroll-reveal ${directionClass} ${isVisible ? "scroll-reveal-visible" : ""} ${className}`}
      style={{ transitionDelay: `${delay}s` }}
    >
      {children}
    </div>
  );
}
