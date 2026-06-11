// ─── Arrow positioning ───

import type { GuidedTourTheme } from "./types";

type Position = "top" | "bottom" | "left" | "right";

export function arrowStyle(pos: Position, color: string): React.CSSProperties {
  const base: React.CSSProperties = {
    position: "absolute",
    width: 0,
    height: 0,
  };

  const border = "6px solid transparent";

  switch (pos) {
    case "bottom":
      return {
        ...base,
        top: -6,
        left: 24,
        borderTop: `6px solid ${color}`,
        borderLeft: border,
        borderRight: border,
      };
    case "top":
      return {
        ...base,
        bottom: -6,
        left: 24,
        borderBottom: `6px solid ${color}`,
        borderLeft: border,
        borderRight: border,
      };
    case "right":
      return {
        ...base,
        left: -6,
        top: 20,
        borderRight: `6px solid ${color}`,
        borderTop: border,
        borderBottom: border,
      };
    case "left":
      return {
        ...base,
        right: -6,
        top: 20,
        borderLeft: `6px solid ${color}`,
        borderTop: border,
        borderBottom: border,
      };
  }
}

// ─── CSS Keyframes for pulse animation ───

export const pulseKeyframes = `
@keyframes guided-tour-pulse {
  0%, 100% { opacity: 0.4; transform: scale(1); }
  50% { opacity: 0; transform: scale(1.04); }
}
`;

// ─── Shared CSSProperties ───

export function tooltipContainerStyle(theme: GuidedTourTheme): React.CSSProperties {
  return {
    background: theme.tooltipBg,
    border: `1px solid ${theme.tooltipBorder}`,
    boxShadow: theme.tooltipShadow,
  };
}

export function dotStyle(
  index: number,
  activeStep: number,
  theme: GuidedTourTheme
): React.CSSProperties {
  return {
    width: 6,
    height: 6,
    borderRadius: "50%",
    transition: "all 0.2s ease",
    background:
      index === activeStep
        ? theme.accent
        : index < activeStep
          ? theme.dotVisited
          : theme.dotInactive,
    transform: index === activeStep ? "scale(1.3)" : "scale(1)",
  };
}
