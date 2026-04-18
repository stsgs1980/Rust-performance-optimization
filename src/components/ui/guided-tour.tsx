"use client";

import {
  forwardRef, useImperativeHandle, useState, useEffect, useCallback, useRef, type ReactNode,
} from "react";
import { motion, AnimatePresence } from "framer-motion";

/* ══════════════════════════════════════════════════════════════
   GuidedTour — Reusable onboarding tour component

   Usage:
     const tourRef = useRef<GuidedTourRef>(null);
     <GuidedTour ref={tourRef} steps={[...]} storageKey="my-tour" />
     tourRef.current?.start();

   API:
     - forwardRef with GuidedTourRef ({ start, stop })
     - Auto-starts on first visit (controlled by storageKey)
     - Keyboard: ArrowRight/Enter = next, ArrowLeft = prev, Escape = close
     - Responsive spotlight + tooltip positioning
     - Accessible: ARIA roles, focus trap
   ══════════════════════════════════════════════════════════════ */

// ─── Public Types ───

export interface TourStep {
  /** CSS selector of the element to highlight */
  target: string;
  /** Tooltip title */
  title: string;
  /** Tooltip body — string or ReactNode for rich content */
  description: ReactNode;
  /** Preferred tooltip position. "auto" picks the best fit. Default: "auto" */
  position?: "top" | "bottom" | "left" | "right" | "auto";
}

export interface GuidedTourRef {
  /** Start the tour from a specific step (default: 0) */
  start: (fromStep?: number) => void;
  /** Stop the tour immediately */
  stop: () => void;
  /** Current step index, or null if inactive */
  currentStep: number | null;
}

interface GuidedTourProps {
  /** Tour steps — ordered array of TourStep */
  steps: TourStep[];
  /** localStorage key to persist "tour completed" flag. Omit to never persist. */
  storageKey?: string;
  /** Fires when tour finishes all steps or user clicks "Finish" */
  onComplete?: () => void;
  /** Fires when tour starts (including auto-start) */
  onStart?: () => void;
  /** Fires on each step change */
  onStepChange?: (step: number, total: number) => void;
  /** Padding around the spotlight highlight in px. Default: 8 */
  spotlightPadding?: number;
  /** Overlay background color. Default: "rgba(0, 0, 0, 0.75)" */
  overlayColor?: string;
  /** Additional class for the tooltip card */
  tooltipClass?: string;
  /** Show step indicator dots in footer. Default: true */
  showDots?: boolean;
  /** Show "STEP X / N" counter. Default: true */
  showStepCounter?: boolean;
  /** Custom labels (for i18n). Defaults to English. */
  labels?: {
    next?: string;
    prev?: string;
    finish?: string;
    closeAriaLabel?: string;
    stepOf?: string;
  };
  /** Delay before auto-start in ms. Default: 1200. Set 0 to disable auto-start. */
  autoStartDelay?: number;
}

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

  // Score each position by available space minus needed space
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

// ─── Arrow CSS per position ───

const arrowStyles: Record<Position, string> = {
  bottom: "-top-[6px] left-6 border-b-[#1a1a1a] border-l-transparent border-r-transparent border-t-transparent border-[6px]",
  top: "-bottom-[6px] left-6 border-t-[#1a1a1a] border-l-transparent border-r-transparent border-b-transparent border-[6px]",
  right: "-left-[6px] top-5 border-r-[#1a1a1a] border-t-transparent border-b-transparent border-l-transparent border-[6px]",
  left: "-right-[6px] top-5 border-l-[#1a1a1a] border-t-transparent border-b-transparent border-r-transparent border-[6px]",
};

// ─── Component ───

export const GuidedTour = forwardRef<GuidedTourRef, GuidedTourProps>(({
  steps,
  storageKey,
  onComplete,
  onStart,
  onStepChange,
  spotlightPadding = 8,
  overlayColor = "rgba(0, 0, 0, 0.75)",
  tooltipClass = "",
  showDots = true,
  showStepCounter = true,
  labels = {},
  autoStartDelay = 1200,
}, ref) => {
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
    next: "Next →",
    prev: "← Back",
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

      const tw = ttRef.current?.offsetWidth || 310;
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
  }, [steps, spotlightPadding, reducedMotion]);

  // ── Imperative API ──
  const start = useCallback((fromStep = 0) => {
    if (fromStep >= steps.length) return;
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
  }, [steps.length, start]); // Only run on mount

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
            className="fixed inset-0 z-[100]"
            onClick={stop}
            role="dialog"
            aria-modal="true"
            aria-label="Guided tour"
          >
            {/* Spotlight "hole" via box-shadow */}
            <div
              className="absolute transition-all duration-300 ease-out"
              style={{
                top: spotRect.top,
                left: spotRect.left,
                width: spotRect.width,
                height: spotRect.height,
                boxShadow: `0 0 0 9999px ${overlayColor}`,
                borderRadius: 4,
                border: "2px solid var(--tour-accent, #ff6b2b)",
                zIndex: 1,
              }}
              onClick={(e) => e.stopPropagation()}
            />

            {/* Pulse ring */}
            {!reducedMotion && (
              <div
                className="absolute animate-[tourPulse_2s_ease-out_infinite] pointer-events-none"
                style={{
                  top: spotRect.top - 4,
                  left: spotRect.left - 4,
                  width: spotRect.width + 8,
                  height: spotRect.height + 8,
                  borderRadius: 6,
                  border: "1px solid var(--tour-accent, #ff6b2b)",
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
              className={`fixed z-[101] ${tooltipClass}`}
              style={{
                top: ttStyle.top,
                left: ttStyle.left,
                maxWidth: "min(340px, calc(100vw - 24px))",
                width: 340,
                pointerEvents: "auto",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                ref={ttRef}
                className="relative bg-[#1a1a1a] border border-[#333] shadow-2xl shadow-black/60"
              >
                {/* Arrow */}
                <div className={`absolute w-0 h-0 ${arrowStyles[ttPos]}`} />

                <div className="p-4">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="min-w-0">
                      {showStepCounter && (
                        <span className="text-[9px] font-[family-name:var(--font-ibm-mono)] text-[var(--tour-accent,#ff6b2b)] uppercase tracking-widest block">
                          {L.stepOf} {activeStep + 1} / {steps.length}
                        </span>
                      )}
                      <h3 className="text-sm font-semibold text-[#e5e5e5] mt-0.5 leading-snug">
                        {step.title}
                      </h3>
                    </div>
                    <button
                      onClick={stop}
                      className="text-[#525252] hover:text-[#d4d4d4] transition-colors ml-3 shrink-0 mt-0.5"
                      aria-label={L.closeAriaLabel}
                    >
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M3 3l8 8M11 3l-8 8" />
                      </svg>
                    </button>
                  </div>

                  {/* Body */}
                  <div className="text-xs text-[#a3a3a3] leading-relaxed mb-4">
                    {step.description}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between">
                    {showDots ? (
                      <div className="flex gap-1" role="progressbar" aria-valuenow={activeStep + 1} aria-valuemin={1} aria-valuemax={steps.length}>
                        {steps.map((_, i) => (
                          <div
                            key={i}
                            className="w-1.5 h-1.5 rounded-full transition-all duration-200"
                            style={{
                              background: i === activeStep
                                ? "var(--tour-accent, #ff6b2b)"
                                : i < activeStep
                                  ? "#525252"
                                  : "#2a2a2a",
                              transform: i === activeStep ? "scale(1.3)" : "scale(1)",
                            }}
                          />
                        ))}
                      </div>
                    ) : <div />}

                    <div className="flex items-center gap-3">
                      {activeStep > 0 && (
                        <button
                          onClick={prev}
                          className="text-[10px] font-[family-name:var(--font-ibm-mono)] text-[#8a8a8a] hover:text-[#d4d4d4] transition-colors tracking-wide"
                        >
                          {L.prev}
                        </button>
                      )}
                      {activeStep < steps.length - 1 ? (
                        <button
                          onClick={next}
                          className="text-[10px] font-[family-name:var(--font-ibm-mono)] font-medium tracking-wide transition-colors"
                          style={{ color: "var(--tour-accent, #ff6b2b)" }}
                        >
                          {L.next}
                        </button>
                      ) : (
                        <button
                          onClick={finish}
                          className="text-[10px] font-[family-name:var(--font-ibm-mono)] text-[#4ade80] hover:text-[#6ee7a0] font-medium tracking-wide transition-colors"
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
