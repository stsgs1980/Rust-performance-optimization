import type { GuidedTourTheme } from "./types";

// ─── Built-in Themes ───

export const darkTheme: GuidedTourTheme = {
  tooltipBg: "#1a1a1a",
  tooltipBorder: "#333333",
  titleColor: "#e5e5e5",
  bodyColor: "#a3a3a3",
  accent: "#ff6b2b",
  overlay: "rgba(0, 0, 0, 0.75)",
  spotlightBorder: "#ff6b2b",
  mutedColor: "#8a8a8a",
  closeHoverColor: "#d4d4d4",
  closeColor: "#525252",
  finishColor: "#4ade80",
  finishHoverColor: "#6ee7a0",
  tooltipShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.6)",
  dotInactive: "#2a2a2a",
  dotVisited: "#525252",
  arrowColor: "#1a1a1a",
  tooltipWidth: 340,
};

export const lightTheme: GuidedTourTheme = {
  tooltipBg: "#ffffff",
  tooltipBorder: "#e5e7eb",
  titleColor: "#111827",
  bodyColor: "#6b7280",
  accent: "#2563eb",
  overlay: "rgba(0, 0, 0, 0.5)",
  spotlightBorder: "#2563eb",
  mutedColor: "#9ca3af",
  closeHoverColor: "#374151",
  closeColor: "#9ca3af",
  finishColor: "#16a34a",
  finishHoverColor: "#15803d",
  tooltipShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.15)",
  dotInactive: "#e5e7eb",
  dotVisited: "#9ca3af",
  arrowColor: "#ffffff",
  tooltipWidth: 340,
};

/** Resolve theme prop to a full GuidedTourTheme object */
export function resolveTheme(
  theme: "dark" | "light" | GuidedTourTheme
): GuidedTourTheme {
  if (typeof theme === "object") return { ...darkTheme, ...theme };
  return theme === "light" ? lightTheme : darkTheme;
}
