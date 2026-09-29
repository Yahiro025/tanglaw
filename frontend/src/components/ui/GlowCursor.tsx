"use client";

import React, { useEffect, useRef } from "react";
import { Geometry, Mesh, Program, Renderer } from "ogl";
import "./GlowCursor.css";

const MAX_POINTS = 64;

const VERTEX_SHADER = `
attribute vec2 position;
attribute float aSide;
attribute float aProgress;

uniform vec2 uResolution;

varying float vSide;
varying float vProgress;

void main() {
  vSide = aSide;
  vProgress = aProgress;
  vec2 ndc = position / uResolution * 2.0 - 1.0;
  gl_Position = vec4(ndc, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER = `
precision highp float;

varying float vSide;
varying float vProgress;

uniform vec3 uColor;
uniform vec3 uSecondaryColor;
uniform float uTaper;
uniform float uGlowIntensity;
uniform float uHotspot;
uniform float uBrightness;
uniform float uOpacity;
uniform float uNormalBlend;
uniform float uFade;

float sRGB(float x) {
  if (x <= 0.00031308) return 12.92 * x;
  return 1.055 * pow(x, 1.0 / 2.4) - 0.055;
}

void main() {
  float progress = clamp(vProgress, 0.0, 1.0);
  float life = pow(max(1.0 - progress, 0.0), mix(0.55, 1.25, uTaper));
  float across = abs(vSide);
  float core = exp(-pow(across, 2.0) * 2.5);
  float beam = min(1.0, 1.0 / (across * across * 4.0 + 1.0));
  float intensity = (core + beam * uGlowIntensity * 0.55) * life;

  vec3 color = mix(uColor, uSecondaryColor, progress);
  color = mix(color, vec3(1.0), smoothstep(0.25, 0.95, core * life) * uHotspot);

  float edgeFade = 1.0 - smoothstep(0.82, 1.0, across);
  float alpha = clamp(intensity * uOpacity * uFade * edgeFade, 0.0, 1.0);
  if (alpha < 0.0005) discard;

  float luminance = sRGB(clamp(intensity * uBrightness, 0.0, 1.0));
  vec3 additiveColor = color * luminance;
  float normalAlpha =
    clamp(intensity * uBrightness * uOpacity * uFade * edgeFade, 0.0, 1.0);
  vec3 normalColor = mix(
    color,
    vec3(1.0),
    smoothstep(0.45, 1.0, core * life) * uHotspot * 0.35
  );
  gl_FragColor = vec4(
    mix(additiveColor, normalColor, uNormalBlend),
    mix(alpha, normalAlpha, uNormalBlend)
  );
}
`;

const hexToRgb = (hex: string): [number, number, number] => {
  let value = (hex || "").replace("#", "").trim();
  if (value.length === 3) {
    value = value
      .split("")
      .map((char) => char + char)
      .join("");
  }
  const parsed = Number.parseInt(value || "000000", 16);
  return [
    ((parsed >> 16) & 255) / 255,
    ((parsed >> 8) & 255) / 255,
    (parsed & 255) / 255,
  ];
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const SEGMENT_EPS = 1e-4;
const DISTINCT_EPS = 0.75;

export interface GlowCursorProps extends React.HTMLAttributes<HTMLDivElement> {
  color?: string;
  secondaryColor?: string;
  trailLength?: number;
  trailWidth?: number;
  trailTaper?: number;
  followSpeed?: number;
  glowIntensity?: number;
  glowSpread?: number;
  hotspot?: number;
  brightness?: number;
  opacity?: number;
  pulseSpeed?: number;
  noiseStrength?: number;
  idleFade?: boolean;
  idleTimeout?: number;
  fadeDuration?: number;
  blendMode?: "normal" | "screen" | "plus-lighter";
  maxDevicePixelRatio?: number;
  enabled?: boolean;
  useWindowPointer?: boolean;
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

const GlowCursor: React.FC<GlowCursorProps> = ({
  color = "#67E8F9",
  secondaryColor = "#A78BFA",
  trailLength = 40,
  trailWidth = 8,
  trailTaper = 0.8,
  followSpeed = 0.16,
  glowIntensity = 1.9,
  glowSpread = 1.2,
  hotspot = 0.65,
  brightness = 1.25,
  opacity = 1,
  pulseSpeed = 1.1,
  noiseStrength = 0.035,
  idleFade = true,
  idleTimeout = 700,
  fadeDuration = 900,
  blendMode = "screen",
  maxDevicePixelRatio = 1.5,
  enabled = true,
  useWindowPointer = false,
  children,
  className = "",
  style,
  ...rest
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const propsRef = useRef({
    color,
    secondaryColor,
    trailLength,
    trailWidth,
    trailTaper,
    followSpeed,
    glowIntensity,
    glowSpread,
    hotspot,
    brightness,
    opacity,
    pulseSpeed,
    noiseStrength,
    idleFade,
    idleTimeout,
    fadeDuration,
    maxDevicePixelRatio,
    blendMode,
    enabled,
    useWindowPointer,
  });

  useEffect(() => {
    propsRef.current = {
      color,
      secondaryColor,
      trailLength,
      trailWidth,
      trailTaper,
      followSpeed,
      glowIntensity,
      glowSpread,
      hotspot,
      brightness,
      opacity,
      pulseSpeed,
      noiseStrength,
      idleFade,
      idleTimeout,
      fadeDuration,
      maxDevicePixelRatio,
      blendMode,
      enabled,
      useWindowPointer,
    };
  });

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const initialConfig = propsRef.current;
    let renderer: Renderer;
    try {
      renderer = new Renderer({
        canvas,
        alpha: true,
        dpr: Math.min(
          window.devicePixelRatio || 1,
          initialConfig.maxDevicePixelRatio
        ),
      });
    } catch {
      return;
    }

    const gl = renderer.gl;
    if (!gl) return;

    gl.clearColor(0, 0, 0, 0);

    const maxVerts = MAX_POINTS * 2;
    const positionData = new Float32Array(maxVerts * 2);
    const sideData = new Float32Array(maxVerts);
    const progressData = new Float32Array(maxVerts);

    const points = Array.from({ length: MAX_POINTS }, () => ({ x: 0, y: 0 }));
    const target = { x: 0, y: 0 };

    let program: Program;
    let mesh: Mesh;
    let positionAttr: { data: Float32Array; needsUpdate: boolean; count: number };
    let sideAttr: { data: Float32Array; needsUpdate: boolean; count: number };
    let progressAttr: { data: Float32Array; needsUpdate: boolean; count: number };

    try {
      program = new Program(gl, {
        vertex: VERTEX_SHADER,
        fragment: FRAGMENT_SHADER,
        uniforms: {
          uResolution: { value: [1, 1] },
          uColor: { value: hexToRgb(initialConfig.color) },
          uSecondaryColor: { value: hexToRgb(initialConfig.secondaryColor) },
          uTaper: { value: initialConfig.trailTaper },
          uGlowIntensity: { value: initialConfig.glowIntensity },
          uHotspot: { value: initialConfig.hotspot },
          uBrightness: { value: initialConfig.brightness },
          uOpacity: { value: initialConfig.opacity },
          uNormalBlend: { value: initialConfig.blendMode === "normal" ? 1 : 0 },
          uFade: { value: 0 },
        },
        transparent: true,
        depthTest: false,
        depthWrite: false,
      });

      const geometry = new Geometry(gl, {
        position: {
          size: 2,
          data: positionData,
          usage: gl.DYNAMIC_DRAW,
        },
        aSide: {
          size: 1,
          data: sideData,
          usage: gl.DYNAMIC_DRAW,
        },
        aProgress: {
          size: 1,
          data: progressData,
          usage: gl.DYNAMIC_DRAW,
        },
      });

      positionAttr = geometry.attributes.position as typeof positionAttr;
      sideAttr = geometry.attributes.aSide as typeof sideAttr;
      progressAttr = geometry.attributes.aProgress as typeof progressAttr;

      mesh = new Mesh(gl, {
        geometry,
        program,
        mode: gl.TRIANGLE_STRIP,
      });
    } catch {
      return;
    }

    let initialized = false;
    let pointerInside = false;
    let fade = 0;
    let lastInputTime = performance.now();
    let lastFrameTime = performance.now();
    let raf = 0;
    let loopActive = false;
    let destroyed = false;

    const resize = () => {
      const w = Math.max(container.clientWidth, 1);
      const h = Math.max(container.clientHeight, 1);
      renderer.setSize(w, h);
      if (program.uniforms.uResolution) {
        program.uniforms.uResolution.value = [w, h];
      }
    };

    const initializeTrail = (x: number, y: number) => {
      target.x = x;
      target.y = y;
      for (const point of points) {
        point.x = x;
        point.y = y;
      }
      initialized = true;
      fade = 1;
    };

    const scheduleLoop = () => {
      if (destroyed || loopActive) return;
      lastFrameTime = performance.now();
      loopActive = true;
      raf = requestAnimationFrame(render);
    };

    const updatePointer = (event: MouseEvent | PointerEvent) => {
      const rect = container.getBoundingClientRect();
      const x = clamp(event.clientX - rect.left, 0, rect.width);
      const y = clamp(rect.height - (event.clientY - rect.top), 0, rect.height);
      if (!initialized) initializeTrail(x, y);
      target.x = x;
      target.y = y;
      pointerInside = true;
      lastInputTime = performance.now();
      scheduleLoop();
    };

    const onPointerLeave = () => {
      pointerInside = false;
      lastInputTime = performance.now();
    };

    const hasDistinctPair = (count: number) => {
      if (count < 2) return false;
      for (let i = 0; i < count; i++) {
        for (let j = i + 1; j < count; j++) {
          const dx = points[j].x - points[i].x;
          const dy = points[j].y - points[i].y;
          if (dx * dx + dy * dy > DISTINCT_EPS * DISTINCT_EPS) {
            return true;
          }
        }
      }
      return false;
    };

    const buildHeadGlow = (
      trailW: number,
      spread: number
    ): number => {
      const half = Math.max(trailW * (0.8 + spread * 1.4), 0.5);
      const along = half * 0.55;
      const hx = points[0].x;
      const hy = points[0].y;
      const samples = [
        { x: hx, y: hy - along, progress: 0 },
        { x: hx, y: hy + along, progress: 0.08 },
      ];
      let vtx = 0;
      for (const sample of samples) {
        const o = vtx * 2;
        positionData[o] = sample.x + half;
        positionData[o + 1] = sample.y;
        sideData[vtx] = 1;
        progressData[vtx] = sample.progress;
        vtx += 1;
        const o2 = vtx * 2;
        positionData[o2] = sample.x - half;
        positionData[o2 + 1] = sample.y;
        sideData[vtx] = -1;
        progressData[vtx] = sample.progress;
        vtx += 1;
      }
      return vtx;
    };

    const buildRibbon = (
      pointCount: number,
      trailW: number,
      taper: number,
      spread: number
    ): number => {
      if (pointCount < 2 || !hasDistinctPair(pointCount)) {
        return initialized ? buildHeadGlow(trailW, spread) : 0;
      }

      const denom = Math.max(pointCount - 1, 1);
      let vtx = 0;
      let prevTx = 0;
      let prevTy = 1;
      let lastNx = -1;
      let lastNy = 0;

      for (let i = 0; i < pointCount; i++) {
        const progress = i / denom;
        const taperExp = 0.55 + taper * (1.6 - 0.55);
        const width =
          trailW *
          (1 + (0.25 - 1) * Math.pow(Math.pow(progress, taperExp), 1));
        const halfW = Math.max(width * (0.8 + spread * 1.4), 0.5);

        let tx = 0;
        let ty = 0;
        if (i === 0) {
          tx = points[1].x - points[0].x;
          ty = points[1].y - points[0].y;
        } else if (i === pointCount - 1) {
          tx = points[i].x - points[i - 1].x;
          ty = points[i].y - points[i - 1].y;
        } else {
          tx = points[i + 1].x - points[i - 1].x;
          ty = points[i + 1].y - points[i - 1].y;
        }

        const lenSq = tx * tx + ty * ty;
        if (lenSq < SEGMENT_EPS * SEGMENT_EPS) {
          tx = prevTx;
          ty = prevTy;
        } else {
          const invLen = 1 / Math.sqrt(lenSq);
          tx *= invLen;
          ty *= invLen;
          prevTx = tx;
          prevTy = ty;
        }

        let nx = -ty;
        let ny = tx;
        if (nx * lastNx + ny * lastNy < 0) {
          nx = -nx;
          ny = -ny;
        }
        lastNx = nx;
        lastNy = ny;
        const px = points[i].x;
        const py = points[i].y;

        const o = vtx * 2;
        positionData[o] = px + nx * halfW;
        positionData[o + 1] = py + ny * halfW;
        sideData[vtx] = 1;
        progressData[vtx] = progress;
        vtx += 1;

        const o2 = vtx * 2;
        positionData[o2] = px - nx * halfW;
        positionData[o2 + 1] = py - ny * halfW;
        sideData[vtx] = -1;
        progressData[vtx] = progress;
        vtx += 1;
      }

      return vtx;
    };

    const render = (now: number) => {
      if (destroyed) return;
      loopActive = true;
      const config = propsRef.current;
      const delta = Math.min((now - lastFrameTime) / 16.667, 3);
      lastFrameTime = now;

      const pointCount = clamp(
        Math.round(config.trailLength),
        2,
        MAX_POINTS
      );

      if (initialized) {
        points[0].x = target.x;
        points[0].y = target.y;

        const wakeSpeed = clamp(config.followSpeed, 0.01, 0.99);
        const wakeEase = 1 - Math.pow(1 - wakeSpeed, delta);

        for (let i = 1; i < pointCount; i++) {
          points[i].x += (points[i - 1].x - points[i].x) * wakeEase;
          points[i].y += (points[i - 1].y - points[i].y) * wakeEase;
        }
      }

      const idleFor = now - lastInputTime;
      const shouldFade =
        config.idleFade && (!pointerInside || idleFor > config.idleTimeout);
      const fadeStep = (16.667 * delta) / Math.max(config.fadeDuration, 16);
      const fadeTarget = initialized && config.enabled && !shouldFade ? 1 : 0;
      fade += (fadeTarget - fade) * Math.min(1, fadeStep * 7);

      if (fade < 0.0005 && fadeTarget === 0) {
        gl.clear(gl.COLOR_BUFFER_BIT);
        loopActive = false;
        raf = 0;
        return;
      }

      if (program.uniforms.uColor) {
        program.uniforms.uColor.value = hexToRgb(config.color);
      }
      if (program.uniforms.uSecondaryColor) {
        program.uniforms.uSecondaryColor.value = hexToRgb(
          config.secondaryColor
        );
      }
      if (program.uniforms.uTaper) {
        program.uniforms.uTaper.value = clamp(config.trailTaper, 0, 1);
      }
      if (program.uniforms.uGlowIntensity) {
        program.uniforms.uGlowIntensity.value = Math.max(
          config.glowIntensity,
          0
        );
      }
      if (program.uniforms.uHotspot) {
        program.uniforms.uHotspot.value = clamp(config.hotspot, 0, 1);
      }
      if (program.uniforms.uBrightness) {
        program.uniforms.uBrightness.value = Math.max(config.brightness, 0);
      }
      if (program.uniforms.uOpacity) {
        program.uniforms.uOpacity.value = clamp(config.opacity, 0, 1);
      }
      if (program.uniforms.uNormalBlend) {
        program.uniforms.uNormalBlend.value =
          config.blendMode === "normal" ? 1 : 0;
      }
      if (program.uniforms.uFade) {
        program.uniforms.uFade.value = fade;
      }

      const vertexCount = initialized
        ? buildRibbon(
            pointCount,
            Math.max(config.trailWidth, 0.1),
            clamp(config.trailTaper, 0, 1),
            Math.max(config.glowSpread, 0)
          )
        : 0;

      if (vertexCount >= 4) {
        positionAttr.count = vertexCount;
        sideAttr.count = vertexCount;
        progressAttr.count = vertexCount;
        positionAttr.needsUpdate = true;
        sideAttr.needsUpdate = true;
        progressAttr.needsUpdate = true;
        mesh.geometry.setDrawRange(0, vertexCount);
        renderer.render({ scene: mesh });
      }

      if (!destroyed) {
        raf = requestAnimationFrame(render);
      }
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);

    const pointerTarget = initialConfig.useWindowPointer ? window : container;
    pointerTarget.addEventListener(
      "pointermove",
      updatePointer as EventListener
    );
    pointerTarget.addEventListener(
      "pointerenter",
      updatePointer as EventListener
    );
    pointerTarget.addEventListener("pointerleave", onPointerLeave);

    resize();
    scheduleLoop();

    return () => {
      destroyed = true;
      loopActive = false;
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      pointerTarget.removeEventListener(
        "pointermove",
        updatePointer as EventListener
      );
      pointerTarget.removeEventListener(
        "pointerenter",
        updatePointer as EventListener
      );
      pointerTarget.removeEventListener("pointerleave", onPointerLeave);
      try {
        mesh?.geometry?.remove();
        program?.remove();
      } catch {
        // ignore cleanup errors on unmount
      }
    };
  }, [maxDevicePixelRatio]);

  return (
    <div
      ref={containerRef}
      className={`glow-cursor${className ? ` ${className}` : ""}`}
      style={style}
      {...rest}
    >
      <canvas
        ref={canvasRef}
        className="glow-cursor__canvas"
        style={{ mixBlendMode: blendMode }}
        aria-hidden="true"
      />
      {children && <div className="glow-cursor__content">{children}</div>}
    </div>
  );
};

export default GlowCursor;
