"use client";

import { forwardRef, useImperativeHandle, useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

export interface TourStep {
  target: string;
  title: string;
  description: string;
  position: "top" | "bottom" | "left" | "right";
}

export interface GuidedTourRef {
  start: (step?: number) => void;
}

interface GuidedTourProps {
  steps: TourStep[];
  storageKey: string;
  onComplete?: () => void;
}

export const GuidedTour = forwardRef<GuidedTourRef, GuidedTourProps>(
  ({ steps, storageKey, onComplete }, ref) => {
    const [active, setActive] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

    const start = useCallback(
      (step = 0) => {
        setCurrentStep(step);
        setActive(true);
      },
      []
    );

    useImperativeHandle(ref, () => ({ start }), [start]);

    useEffect(() => {
      if (!active) return;
      const step = steps[currentStep];
      if (!step) {
        setActive(false);
        onComplete?.();
        try { localStorage.setItem(storageKey, "1"); } catch {}
        return;
      }
      const el = document.querySelector(step.target);
      if (el) {
        setTargetRect(el.getBoundingClientRect());
      } else {
        setTargetRect(null);
      }
    }, [active, currentStep, steps, storageKey, onComplete]);

    const next = () => {
      if (currentStep < steps.length - 1) {
        setCurrentStep((s) => s + 1);
      } else {
        setActive(false);
        onComplete?.();
        try { localStorage.setItem(storageKey, "1"); } catch {}
      }
    };

    const prev = () => {
      if (currentStep > 0) setCurrentStep((s) => s - 1);
    };

    const step = steps[currentStep];

    const getTooltipPosition = () => {
      if (!targetRect || !step) return { top: "50%", left: "50%" };
      const gap = 12;
      switch (step.position) {
        case "top":
          return { top: `${targetRect.top - gap}px`, left: `${targetRect.left + targetRect.width / 2}px`, transform: "translate(-50%, -100%)" };
        case "bottom":
          return { top: `${targetRect.bottom + gap}px`, left: `${targetRect.left + targetRect.width / 2}px`, transform: "translate(-50%, 0)" };
        case "left":
          return { top: `${targetRect.top + targetRect.height / 2}px`, left: `${targetRect.left - gap}px`, transform: "translate(-100%, -50%)" };
        case "right":
          return { top: `${targetRect.top + targetRect.height / 2}px`, left: `${targetRect.right + gap}px`, transform: "translate(0, -50%)" };
      }
    };

    return (
      <AnimatePresence>
        {active && step && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9998] bg-black/50"
              onClick={() => setActive(false)}
            />
            {targetRect && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="fixed z-[9999] bg-[#1a1a1a] border border-[#333] rounded-lg p-4 shadow-xl max-w-xs"
                style={{ ...getTooltipPosition(), position: "fixed" }}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-white">{step.title}</h3>
                  <button onClick={() => setActive(false)} className="text-[#666] hover:text-white">
                    <X className="size-3.5" />
                  </button>
                </div>
                <p className="text-xs text-[#8a8a8a] mb-3">{step.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[#666]">{currentStep + 1}/{steps.length}</span>
                  <div className="flex gap-2">
                    {currentStep > 0 && (
                      <button onClick={prev} className="text-xs text-[#8a8a8a] hover:text-white px-2 py-1">
                        Back
                      </button>
                    )}
                    <button onClick={next} className="text-xs bg-[#ff6b2b] text-white px-3 py-1 rounded">
                      {currentStep < steps.length - 1 ? "Next" : "Done"}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </>
        )}
      </AnimatePresence>
    );
  }
);

GuidedTour.displayName = "GuidedTour";
