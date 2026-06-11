import type { ReactNode } from "react";

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

export interface GuidedTourTheme {
  /** Tooltip background color */
  tooltipBg: string;
  /** Tooltip border color */
  tooltipBorder: string;
  /** Title text color */
  titleColor: string;
  /** Body text color */
  bodyColor: string;
  /** Accent color (dots, step counter, next button) */
  accent: string;
  /** Overlay background color */
  overlay: string;
  /** Spotlight border color */
  spotlightBorder: string;
  /** Prev/next muted text color */
  mutedColor: string;
  /** Close button hover color */
  closeHoverColor: string;
  /** Close button color */
  closeColor: string;
  /** Finish button color */
  finishColor: string;
  /** Finish button hover color */
  finishHoverColor: string;
  /** Tooltip shadow */
  tooltipShadow: string;
  /** Inactive dot color */
  dotInactive: string;
  /** Visited dot color */
  dotVisited: string;
  /** Arrow color */
  arrowColor: string;
  /** Tooltip width in px */
  tooltipWidth: number;
}

export interface GuidedTourLabels {
  next?: string;
  prev?: string;
  finish?: string;
  closeAriaLabel?: string;
  stepOf?: string;
}

export interface GuidedTourProps {
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
  /** Additional class for the tooltip card */
  tooltipClass?: string;
  /** Show step indicator dots in footer. Default: true */
  showDots?: boolean;
  /** Show "STEP X / N" counter. Default: true */
  showStepCounter?: boolean;
  /** Custom labels (for i18n). Defaults to English. */
  labels?: GuidedTourLabels;
  /** Delay before auto-start in ms. Default: 1200. Set 0 to disable auto-start. */
  autoStartDelay?: number;
  /** Theme preset or custom theme. Default: "dark" */
  theme?: "dark" | "light" | GuidedTourTheme;
  /** Spotlight border radius in px. Default: 4 */
  spotlightRadius?: number;
}
