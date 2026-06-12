"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  baseAlpha: number;
  alpha: number;
  swaySpeed: number;
  swayAmount: number;
  swayOffset: number;
  // Parallax depth (0.5 = far back, 1.5 = near front)
  depth: number;
  // Sparkle effect
  isSparkle: boolean;
  // Theme color values (RGB)
  r: number;
  g: number;
  b: number;
  targetR: number;
  targetG: number;
  targetB: number;
}

export default function NatureCanvas() {
  const pathname = usePathname();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const themeRef = useRef<"light" | "dark">("light");

  // Determine current theme — writes to ref only (animation loop reads from ref)
  const checkTheme = () => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("tanglaw-theme") || "light";
    themeRef.current = stored === "dark" ? "dark" : "light";
  };

  useEffect(() => {
    checkTheme();

    // Listen to storage event (works across tabs)
    window.addEventListener("storage", checkTheme);
    // Custom event dispatch for same-page immediate changes
    window.addEventListener("tanglaw-theme-change", checkTheme);

    // MutationObserver to watch style modifications on <html> element (immediate detection)
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["style"] });

    return () => {
      window.removeEventListener("storage", checkTheme);
      window.removeEventListener("tanglaw-theme-change", checkTheme);
      observer.disconnect();
    };
  }, []);

  // Canvas particle logic — depends only on pathname (not theme) to avoid full recreation on theme change
  useEffect(() => {
    if (pathname?.startsWith("/dashboard")) {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);
    // Frame rate cap: target ~30fps to halve GPU load
    const FRAME_INTERVAL = 1000 / 30;
    let lastFrameTime = 0;

    // Particle colors depending on theme — reads from ref to avoid stale closures
    const getColors = (currentTheme: "light" | "dark") => {
      if (currentTheme === "light") {
        return [
          { r: 27, g: 64, b: 121 },   // primary blue
          { r: 77, g: 124, b: 138 },  // slate teal
          { r: 184, g: 201, b: 232 }, // periwinkle
          { r: 232, g: 196, b: 196 }, // rose
          { r: 255, g: 215, b: 0 },   // gold
          { r: 234, g: 240, b: 216 }, // pastel green
        ];
      } else {
        return [
          { r: 58, g: 79, b: 122 },   // dark periwinkle
          { r: 90, g: 58, b: 58 },    // dark rose
          { r: 148, g: 163, b: 184 }, // slate muted
          { r: 27, g: 64, b: 121 },   // primary blue
          { r: 100, g: 200, b: 255 }, // soft cyan
          { r: 184, g: 201, b: 232 }, // bright periwinkle
          { r: 255, g: 220, b: 100 }, // warm gold
        ];
      }
    };

    const particles: Particle[] = [];
    const count = 55; // drifting orbs — increased for richer glow density

    // Initialize particles
    for (let i = 0; i < count; i++) {
      const palette = getColors(themeRef.current);
      const color = palette[Math.floor(Math.random() * palette.length)];
      const size = 18 + Math.random() * 34; // glowing orbs — larger for more presence
      const baseAlpha = 0.18 + Math.random() * 0.22;

      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.25,
        vy: -(0.15 + Math.random() * 0.35), // slowly float upwards
        size,
        baseAlpha,
        alpha: baseAlpha,
        swaySpeed: 0.005 + Math.random() * 0.01,
        swayAmount: 5 + Math.random() * 15,
        swayOffset: Math.random() * 100,
        depth: 0.6 + Math.random() * 0.8, // 0.6 - 1.4 parallax depth
        isSparkle: Math.random() < 0.25, // 25% sparkle particles
        r: color.r,
        g: color.g,
        b: color.b,
        targetR: color.r,
        targetG: color.g,
        targetB: color.b,
      });
    }

    // Throttled resize handler (max once per 200ms)
    let resizeTimeout: ReturnType<typeof setTimeout> | null = null;
    const handleResize = () => {
      if (resizeTimeout) return;
      resizeTimeout = setTimeout(() => {
        resizeTimeout = null;
        if (!canvas) return;
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
      }, 200);
    };

    window.addEventListener("resize", handleResize);

    // ─── Offscreen Canvas Caches ──────────────────────────────────────────────
    // Cache the background gradient so it isn't recalculated 60 times a second.
    const bgCache = document.createElement("canvas");
    bgCache.width = width;
    bgCache.height = height;
    const bgCacheCtx = bgCache.getContext("2d")!;

    const renderBgCache = () => {
      bgCache.width = width;
      bgCache.height = height;
      const grad = bgCacheCtx.createRadialGradient(width / 2, height / 2, 10, width / 2, height / 2, Math.max(width, height));
      if (themeRef.current === "light") {
        grad.addColorStop(0, "rgba(247, 249, 239, 0.95)");
        grad.addColorStop(1, "rgba(203, 223, 144, 0.9)");
      } else {
        grad.addColorStop(0, "rgba(21, 31, 56, 0.95)");
        grad.addColorStop(1, "rgba(11, 19, 43, 0.95)");
      }
      bgCacheCtx.fillStyle = grad;
      bgCacheCtx.fillRect(0, 0, width, height);
    };
    renderBgCache();

    // Particle glow cache: keyed by r,g,b,alpha,size rounded to reduce cache misses
    const particleGlowCache = new Map<string, HTMLCanvasElement>();
    const getParticleGlowCanvas = (r: number, g: number, b: number, alpha: number, size: number): HTMLCanvasElement => {
      const key = `${Math.round(r)},${Math.round(g)},${Math.round(b)},${alpha.toFixed(2)},${Math.round(size)}`;
      const cached = particleGlowCache.get(key);
      if (cached) return cached;

      const off = document.createElement("canvas");
      off.width = size * 2;
      off.height = size * 2;
      const offCtx = off.getContext("2d")!;
      const radialGrad = offCtx.createRadialGradient(size, size, 0, size, size, size);
      radialGrad.addColorStop(0, `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${alpha})`);
      radialGrad.addColorStop(0.3, `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${alpha * 0.6})`);
      radialGrad.addColorStop(0.6, `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${alpha * 0.2})`);
      radialGrad.addColorStop(1, "rgba(0,0,0,0)");
      offCtx.fillStyle = radialGrad;
      offCtx.beginPath();
      offCtx.arc(size, size, size, 0, Math.PI * 2);
      offCtx.fill();

      particleGlowCache.set(key, off);
      return off;
    };

    // Animation Loop — capped at ~30fps, reads theme from ref
    let isRunning = true;
    let lastBgColor = themeRef.current;

    // Mouse tracking for interactivity (position + velocity for wind effect)
    const mouse = { x: -1000, y: -1000, active: false, windX: 0, windY: 0 };
    const handleMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - mouse.x;
      const dy = e.clientY - mouse.y;
      // Smooth wind velocity with low-pass filter (skip first event after init/leave)
      if (mouse.x !== -1000) {
        mouse.windX = mouse.windX * 0.6 + dx * 0.4;
        mouse.windY = mouse.windY * 0.6 + dy * 0.4;
      }
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.active = true;
    };
    const handleMouseLeave = () => {
      mouse.active = false;
      mouse.x = -1000;
      mouse.y = -1000;
    };
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("mouseleave", handleMouseLeave);

    const draw = (timestamp: number) => {
      if (!isRunning) return;

      // Frame rate cap: skip frame if not enough time has elapsed
      if (timestamp - lastFrameTime < FRAME_INTERVAL) {
        animationFrameId = requestAnimationFrame(draw);
        return;
      }
      lastFrameTime = timestamp;

      ctx.clearRect(0, 0, width, height);

      // Re-render background cache on theme change or resize — reads from ref
      const currentTheme = themeRef.current;
      if (lastBgColor !== currentTheme || bgCache.width !== width || bgCache.height !== height) {
        lastBgColor = currentTheme;
        renderBgCache();
      }
      // Use cached background via drawImage — avoids createRadialGradient in animation loop
      ctx.drawImage(bgCache, 0, 0);

      const palette = getColors(currentTheme);
      const hasWind = mouse.active && (Math.abs(mouse.windX) > 0.5 || Math.abs(mouse.windY) > 0.5);

      // Render & Update particles
      particles.forEach((p) => {
        // Smoothly interpolate color coordinates to follow theme updates
        const colorSpeed = 0.05;
        p.r += (p.targetR - p.r) * colorSpeed;
        p.g += (p.targetG - p.g) * colorSpeed;
        p.b += (p.targetB - p.b) * colorSpeed;

        // Sway back and forth using sine wave
        p.swayOffset += p.swaySpeed;
        const currentX = p.x + Math.sin(p.swayOffset) * p.swayAmount * p.depth;

        // Depth-adjusted draw size and alpha
        let drawSize = p.size * p.depth;
        let drawAlpha = p.alpha * (0.7 + 0.3 * p.depth);

        // Mouse proximity glow, gentle repulse, and wind effect
        if (mouse.active) {
          const dx = mouse.x - currentX;
          const dy = mouse.y - p.y;
          const distSq = dx * dx + dy * dy;
          const interactRadius = 160 * p.depth;
          const interactRadiusSq = interactRadius * interactRadius;
          if (distSq < interactRadiusSq && distSq > 0.1) {
            const factor = 1 - distSq / interactRadiusSq;
            // Glow boost: brighter and larger near cursor
            drawAlpha *= 1 + factor * 0.5;
            drawSize *= 1 + factor * 0.2;
            // Gentle repulse: push away from cursor
            const repulse = factor * 0.008;
            const invDist = 1 / Math.sqrt(distSq);
            p.vx += dx * invDist * repulse;
            p.vy += dy * invDist * repulse;
          }
          // Wind drift: particles shift in the direction of mouse movement
          const windRadius = 280 * p.depth;
          const windRadiusSq = windRadius * windRadius;
          if (distSq < windRadiusSq && hasWind) {
            const windFactor = 1 - distSq / windRadiusSq;
            p.vx += mouse.windX * windFactor * 0.003 * p.depth;
            p.vy += mouse.windY * windFactor * 0.003 * p.depth;
          }
        }

        // Friction to dampen accumulated velocity from repulse
        p.vx *= 0.998;
        p.vy *= 0.998;

        // Draw from cached particle glow canvas via drawImage
        const glowCanvas = getParticleGlowCanvas(p.r, p.g, p.b, drawAlpha, drawSize);
        ctx.drawImage(glowCanvas, currentX - drawSize, p.y - drawSize);

        // Sparkle effect on some particles
        if (p.isSparkle) {
          const sparkleSine = Math.sin(p.swayOffset * 5);
          if (sparkleSine > 0.82) {
            const sparkleSize = drawSize * 0.35;
            const sparkleAlpha = Math.min(1, (sparkleSine - 0.82) * 4);
            ctx.save();
            ctx.globalAlpha = sparkleAlpha;
            ctx.strokeStyle = 'rgba(255,255,255,0.9)';
            ctx.lineWidth = 1.5 * p.depth;
            ctx.beginPath();
            ctx.moveTo(currentX - sparkleSize, p.y);
            ctx.lineTo(currentX + sparkleSize, p.y);
            ctx.moveTo(currentX, p.y - sparkleSize);
            ctx.lineTo(currentX, p.y + sparkleSize);
            ctx.stroke();
            ctx.restore();
          }
        }

        // Update positions
        p.y += p.vy * p.depth;

        // If a particle moves off screen, wrap it around
        const baseSize = p.size * p.depth;
        if (p.y < -baseSize * 2) {
          p.y = height + drawSize * 2;
          p.x = Math.random() * width;
          const newColor = palette[Math.floor(Math.random() * palette.length)];
          p.r = p.targetR = newColor.r;
          p.g = p.targetG = newColor.g;
          p.b = p.targetB = newColor.b;
        }

        // Randomly modulate alpha for a prominent twinkling glow effect
        const newAlpha = p.baseAlpha * (0.70 + Math.sin(p.swayOffset * 3) * 0.30);
        // Only invalidate particle cache when alpha changes significantly
        if (Math.abs(p.alpha - newAlpha) > 0.02) {
          p.alpha = newAlpha;
        }
      });

      // Decay mouse wind velocity each frame so it dies out when movement stops
      mouse.windX *= 0.96;
      mouse.windY *= 0.96;

      animationFrameId = requestAnimationFrame(draw);
    };

    // Pause animation when tab is hidden to save CPU/GPU
    const handleVisibility = () => {
      if (document.hidden) {
        isRunning = false;
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId);
        }
      } else {
        isRunning = true;
        animationFrameId = requestAnimationFrame(draw);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    // IntersectionObserver: pause rendering when canvas is scrolled out of viewport
    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (!isRunning) {
            isRunning = true;
            animationFrameId = requestAnimationFrame(draw);
          }
        } else {
          isRunning = false;
          if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
          }
        }
      },
      { threshold: 0.01 }
    );
    intersectionObserver.observe(canvas);

    animationFrameId = requestAnimationFrame(draw);

    // Update particle target colors when theme changes (via MutationObserver + event listeners above)
    const updateTargetColors = () => {
      const palette = getColors(themeRef.current);
      particles.forEach((p) => {
        const color = palette[Math.floor(Math.random() * palette.length)];
        p.targetR = color.r;
        p.targetG = color.g;
        p.targetB = color.b;
      });
      // Also re-render the background cache for the new theme
      lastBgColor = themeRef.current;
      renderBgCache();
    };
    window.addEventListener("tanglaw-theme-change", updateTargetColors);
    window.addEventListener("storage", updateTargetColors);

    return () => {
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("tanglaw-theme-change", updateTargetColors);
      window.removeEventListener("storage", updateTargetColors);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
      if (resizeTimeout) clearTimeout(resizeTimeout);
      intersectionObserver.disconnect();
      isRunning = false;
      cancelAnimationFrame(animationFrameId);
    };
  }, [pathname]);

  if (pathname?.startsWith("/dashboard")) {
    return null;
  }

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 -z-20 w-full h-full block"
    />
  );
}
