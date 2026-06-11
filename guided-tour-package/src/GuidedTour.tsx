import {
  forwardRef, useImperativeHandle, useState, useEffect, useCallback, useRef,
} from "react";
import { motion, AnimatePresence } from "framer-motion";

import type { GuidedTourProps, GuidedTourRef } from "./types";
import { resolveTheme } from "./theme";
import { arrowStyle, pulseKeyframes, tooltipContainerStyle, dotStyle } from "./styles";

// ─── Helpers ───

type Position = "top" | "bottom" | "left" | "right";

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function bestPosition(rect: DOMRect, tw: number, th: number): Position {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const space = { top: rect.top, bottom: vh - rect.bottom, left: rect.left, right: vw - rect.right };
  const need = { bottom: th + 20, top: th + 20, right: tw + 20, left: tw + 20 };

  const scores: [Position, number][] = [
    ["bottom", space.bottom - need.bottom],
    ["top", space.top - need.top],
    ["right", space.right - need.right],
    ["left", space.left - need.left],
  ];
  scores.sort((a, b) => b[1] - a[1]);
  return scores[0][0];
}

function tooltipCoords(rect: DOMRect, pos: Position, tw: number, th: number, pad: number) {
  const gap = 14;
  let top: number;
  let left: number;

  switch (pos) {
    case "bottom":
      top = rect.bottom + pad + gap;
      left = rect.left + rect.width / 2 - tw / 2;
      break;
    case "top":
      top = rect.top - pad - gap - th;
      left = rect.left + rect.width / 2 - tw / 2;
      break;
    case "right":
      top = rect.top + rect.height / 2 - th / 2;
      left = rect.right + pad + gap;
      break;
    case "left":
      top = rect.top + rect.height / 2 - th / 2;
      left = rect.left - pad - gap - tw;
      break;
  }

  top = clamp(top, 8, window.innerHeight - th - 8);
  left = clamp(left, 8, window.innerWidth - tw - 8);
  return { top, left };
}

// ─── Pulse Animation Injection ───

let pulseInjected = false;
function injectPulseStyles() {
  if (pulseInjected || typeof document === "undefined") return;
  const style = document.createElement("style");
  style.textContent = pulseKeyframes;
  document.head.appendChild(style);
  pulseInjected = true;
}

// ─── Component ───

export const GuidedTour = forwardRef<GuidedTourRef, GuidedTourProps>(({
  steps,
  storageKey,
  onComplete,
  onStart,
  onStepChange,
  spotlightPadding = 8,
  tooltipClass = "",
  showDots = true,
  showStepCounter = true,
  labels = {},
  autoStartDelay = 1200,
  theme: themeProp = "dark",
  spotlightRadius = 4,
}, ref) => {
  const theme = resolveTheme(themeProp);
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const [spotRect, setSpotRect] = useState({ top: 0, left: 0, width: 0, height: 0 });
  const [ttStyle, setTtStyle] = useState({ top: 0, left: 0 });
  const [ttPos, setTtPos] = useState<Position>("bottom");
  const [ready, setReady] = useState(false);
  const ttRef = useRef<HTMLDivElement>(null);
  const [reducedMotion] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  const L = {
    next: "Next \u2192",
    prev: "\u2190 Back",
    finish: "Finish Tour",
    closeAriaLabel: "Close tour",
    stepOf: "Step",
    ...labels,
  };

  const isDone = useCallback(() => {
    if (!storageKey) return false;
    try { return localStorage.getItem(storageKey) === "1"; } catch { return false; }
  }, [storageKey]);

  const markDone = useCallback(() => {
    if (storageKey) {
      try { localStorage.setItem(storageKey, "1"); } catch { /* noop */ }
    }
  }, [storageKey]);

  // Measure and position a step
  const positionAt = useCallback((idx: number) => {
    const step = steps[idx];
    if (!step) return;

    const el = document.querySelector(step.target);
    if (!el) return;

    el.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "center", inline: "center" });

    const measure = () => {
      const r = el.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) return;

      const tw = ttRef.current?.offsetWidth || theme.tooltipWidth;
      const th = ttRef.current?.offsetHeight || 180;

      setSpotRect({
        top: r.top - spotlightPadding,
        left: r.left - spotlightPadding,
        width: r.width + spotlightPadding * 2,
        height: r.height + spotlightPadding * 2,
      });

      const pos: Position = step.position === "auto" || !step.position
        ? bestPosition(r, tw, th)
        : step.position;

      setTtPos(pos);
      const coords = tooltipCoords(r, pos, tw, th, spotlightPadding);
      setTtStyle(coords);
      setReady(true);
    };

    setTimeout(measure, reducedMotion ? 50 : 400);
  }, [steps, spotlightPadding, reducedMotion, theme.tooltipWidth]);

  // ── Imperative API ──
  const start = useCallback((fromStep = 0) => {
    if (fromStep >= steps.length) return;
    injectPulseStyles();
    setActiveStep(fromStep);
    setReady(false);
    onStart?.();
    positionAt(fromStep);
  }, [steps.length, onStart, positionAt]);

  const stop = useCallback(() => {
    setActiveStep(null);
    setReady(false);
  }, []);

  const next = useCallback(() => {
    setActiveStep(prev => {
      if (prev === null) return null;
      const n = prev + 1;
      if (n >= steps.length) {
        onComplete?.();
        markDone();
        return null;
      }
      onStepChange?.(n, steps.length);
      setReady(false);
      setTimeout(() => positionAt(n), 50);
      return n;
    });
  }, [steps.length, onComplete, onStepChange, positionAt, markDone]);

  const prev = useCallback(() => {
    setActiveStep(prev => {
      if (prev === null || prev <= 0) return prev;
      const p = prev - 1;
      onStepChange?.(p, steps.length);
      setReady(false);
      setTimeout(() => positionAt(p), 50);
      return p;
    });
  }, [steps.length, onStepChange, positionAt]);

  const finish = useCallback(() => {
    onComplete?.();
    markDone();
    stop();
  }, [onComplete, markDone, stop]);

  useImperativeHandle(ref, () => ({ start, stop, currentStep: activeStep }), [start, stop, activeStep]);

  // ── Keyboard navigation ──
  useEffect(() => {
    if (activeStep === null) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") stop();
      else if (e.key === "ArrowRight" || e.key === "Enter") next();
      else if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [activeStep, stop, next, prev]);

  // ── Reposition on resize/scroll ──
  useEffect(() => {
    if (activeStep === null) return;
    const reposition = () => { setReady(false); positionAt(activeStep); };
    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, { passive: true });
    return () => {
      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", reposition);
    };
  }, [activeStep, positionAt]);

  // ── Auto-start on first visit ──
  useEffect(() => {
    if (autoStartDelay > 0 && !isDone() && steps.length > 0) {
      const t = setTimeout(() => start(0), autoStartDelay);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Nothing to render if inactive ──
  if (activeStep === null) return null;
  const step = steps[activeStep];
  if (!step) return null;

  return (
    <AnimatePresence>
      {activeStep !== null && (
        <>
          {/* ── Overlay + Spotlight ── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 100,
            }}
            onClick={stop}
            role="dialog"
            aria-modal="true"
            aria-label="Guided tour"
          >
            {/* Spotlight "hole" via box-shadow */}
            <div
              style={{
                position: "absolute",
                transition: "all 0.3s ease-out",
                top: spotRect.top,
                left: spotRect.left,
                width: spotRect.width,
                height: spotRect.height,
                boxShadow: `0 0 0 9999px ${theme.overlay}`,
                borderRadius: spotlightRadius,
                border: `2px solid ${theme.spotlightBorder}`,
                zIndex: 1,
              }}
              onClick={(e) => e.stopPropagation()}
            />

            {/* Pulse ring */}
            {!reducedMotion && (
              <div
                style={{
                  position: "absolute",
                  animation: "guided-tour-pulse 2s ease-out infinite",
                  pointerEvents: "none",
                  top: spotRect.top - 4,
                  left: spotRect.left - 4,
                  width: spotRect.width + 8,
                  height: spotRect.height + 8,
                  borderRadius: spotlightRadius + 2,
                  border: `1px solid ${theme.spotlightBorder}`,
                  opacity: 0.4,
                }}
              />
            )}
          </motion.div>

          {/* ── Tooltip ── */}
          {ready && (
            <motion.div
              key={`tour-step-${activeStep}`}
              initial={{ opacity: 0, y: ttPos === "top" ? 10 : -10, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: ttPos === "top" ? -10 : 10, scale: 0.97 }}
              transition={{ duration: reducedMotion ? 0 : 0.25, ease: "easeOut" }}
              className={tooltipClass}
              style={{
                position: "fixed",
                zIndex: 101,
                top: ttStyle.top,
                left: ttStyle.left,
                maxWidth: `min(${theme.tooltipWidth}px, calc(100vw - 24px))`,
                width: theme.tooltipWidth,
                pointerEvents: "auto",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                ref={ttRef}
                style={tooltipContainerStyle(theme)}
              >
                {/* Arrow */}
                <div style={arrowStyle(ttPos, theme.arrowColor)} />

                <div style={{ padding: 16 }}>
                  {/* Header */}
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8 }}>
                    <div style={{ minWidth: 0 }}>
                      {showStepCounter && (
                        <span style={{
                          fontSize: 9,
                          fontWeight: 600,
                          textTransform: "uppercase",
                          letterSpacing: "0.1em",
                          color: theme.accent,
                          display: "block",
                          fontFamily: "monospace",
                        }}>
                          {L.stepOf} {activeStep + 1} / {steps.length}
                        </span>
                      )}
                      <h3 style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: theme.titleColor,
                        marginTop: 2,
                        lineHeight: 1.3,
                      }}>
                        {step.title}
                      </h3>
                    </div>
                    <button
                      onClick={stop}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: theme.closeColor,
                        padding: 2,
                        marginLeft: 12,
                        flexShrink: 0,
                        transition: "color 0.15s",
                      }}
                      onMouseEnter={(e) => { (e.target as HTMLElement).style.color = theme.closeHoverColor; }}
                      onMouseLeave={(e) => { (e.target as HTMLElement).style.color = theme.closeColor; }}
                      aria-label={L.closeAriaLabel}
                    >
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M3 3l8 8M11 3l-8 8" />
                      </svg>
                    </button>
                  </div>

                  {/* Body */}
                  <div style={{
                    fontSize: 12,
                    color: theme.bodyColor,
                    lineHeight: 1.6,
                    marginBottom: 16,
                  }}>
                    {step.description}
                  </div>

                  {/* Footer */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    {showDots ? (
                      <div style={{ display: "flex", gap: 4 }} role="progressbar" aria-valuenow={activeStep + 1} aria-valuemin={1} aria-valuemax={steps.length}>
                        {steps.map((_, i) => (
                          <div key={i} style={dotStyle(i, activeStep, theme)} />
                        ))}
                      </div>
                    ) : <div />}

                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      {activeStep > 0 && (
                        <button
                          onClick={prev}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            fontSize: 10,
                            fontFamily: "monospace",
                            letterSpacing: "0.05em",
                            color: theme.mutedColor,
                            padding: 0,
                            transition: "color 0.15s",
                          }}
                          onMouseEnter={(e) => { (e.target as HTMLElement).style.color = theme.titleColor; }}
                          onMouseLeave={(e) => { (e.target as HTMLElement).style.color = theme.mutedColor; }}
                        >
                          {L.prev}
                        </button>
                      )}
                      {activeStep < steps.length - 1 ? (
                        <button
                          onClick={next}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            fontSize: 10,
                            fontFamily: "monospace",
                            fontWeight: 600,
                            letterSpacing: "0.05em",
                            color: theme.accent,
                            padding: 0,
                            transition: "color 0.15s",
                          }}
                        >
                          {L.next}
                        </button>
                      ) : (
                        <button
                          onClick={finish}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            fontSize: 10,
                            fontFamily: "monospace",
                            fontWeight: 600,
                            letterSpacing: "0.05em",
                            color: theme.finishColor,
                            padding: 0,
                            transition: "color 0.15s",
                          }}
                          onMouseEnter={(e) => { (e.target as HTMLElement).style.color = theme.finishHoverColor; }}
                          onMouseLeave={(e) => { (e.target as HTMLElement).style.color = theme.finishColor; }}
                        >
                          {L.finish}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </>
      )}
    </AnimatePresence>
  );
});

GuidedTour.displayName = "GuidedTour";
