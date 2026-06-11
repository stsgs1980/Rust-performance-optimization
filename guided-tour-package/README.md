# GuidedTour

Zero-dependency (except `react` + `framer-motion`) guided tour / onboarding component for React.

**No Tailwind. No CSS files to import. Works everywhere.**

## Features

- Spotlight overlay with pulse animation
- Auto-positioning tooltip (top / bottom / left / right / auto)
- Keyboard navigation (Arrow keys, Enter, Escape)
- `localStorage` persistence (tour runs only once)
- Imperative API via `useRef` (start / stop / currentStep)
- Built-in dark & light themes + custom theme support
- i18n-ready (custom labels)
- Accessible (ARIA roles, `prefers-reduced-motion`)
- SSR-safe (client-only rendering)

## Install

```bash
# As git submodule (recommended for private / internal use)
git submodule add https://github.com/stsgs1980/GuidedTour.git src/lib/guided-tour

# Or directly from GitHub
bun add github:stsgs1980/GuidedTour
```

## Peer Dependencies

```json
{
  "react": ">=18",
  "react-dom": ">=18",
  "framer-motion": ">=11"
}
```

## Quick Start

```tsx
import { useRef, useState, useEffect } from "react";
import { GuidedTour, type TourStep, type GuidedTourRef } from "@/lib/guided-tour/src";

const steps: TourStep[] = [
  { target: "#hero", title: "Welcome", description: "This is your dashboard.", position: "bottom" },
  { target: "#settings", title: "Settings", description: "Configure your preferences here.", position: "left" },
  { target: "#profile", title: "Profile", description: "Manage your account.", position: "auto" },
];

export default function App() {
  const tourRef = useRef<GuidedTourRef>(null);
  const [tourDone, setTourDone] = useState(false);

  useEffect(() => {
    try { setTourDone(localStorage.getItem("my-tour") === "1"); } catch {}
  }, []);

  return (
    <div>
      <GuidedTour
        ref={tourRef}
        steps={steps}
        storageKey="my-tour"
        onComplete={() => setTourDone(true)}
      />

      {tourDone && (
        <button onClick={() => tourRef.current?.start(0)}>
          Replay Tour
        </button>
      )}
    </div>
  );
}
```

## API Reference

### `<GuidedTour />`

| Prop | Type | Default | Description |
|---|---|---|---|
| `steps` | `TourStep[]` | **required** | Ordered array of tour steps |
| `storageKey` | `string` | — | localStorage key. Omit to run on every visit |
| `onComplete` | `() => void` | — | Fires when tour finishes |
| `onStart` | `() => void` | — | Fires when tour starts |
| `onStepChange` | `(step, total) => void` | — | Fires on each step change |
| `theme` | `"dark" \| "light" \| GuidedTourTheme` | `"dark"` | Theme preset or custom theme |
| `autoStartDelay` | `number` | `1200` | Delay before auto-start (ms). `0` = disabled |
| `spotlightPadding` | `number` | `8` | Padding around spotlight (px) |
| `spotlightRadius` | `number` | `4` | Spotlight border radius (px) |
| `showDots` | `boolean` | `true` | Show step indicator dots |
| `showStepCounter` | `boolean` | `true` | Show "Step X / N" label |
| `tooltipClass` | `string` | `""` | Extra CSS class for tooltip |
| `labels` | `GuidedTourLabels` | English defaults | Custom labels for i18n |

### `GuidedTourRef`

```ts
const tourRef = useRef<GuidedTourRef>(null);

tourRef.current?.start(0);     // Start from step 0
tourRef.current?.start(3);     // Start from step 3
tourRef.current?.stop();       // Stop immediately
tourRef.current?.currentStep;  // number | null
```

### `TourStep`

```ts
interface TourStep {
  target: string;              // CSS selector
  title: string;
  description: ReactNode;     // string or JSX
  position?: "top" | "bottom" | "left" | "right" | "auto";
}
```

## Themes

### Built-in: Dark (default)
```tsx
<GuidedTour steps={steps} theme="dark" />
```

### Built-in: Light
```tsx
<GuidedTour steps={steps} theme="light" />
```

### Custom Theme
```tsx
import type { GuidedTourTheme } from "@/lib/guided-tour/src";

const myTheme: GuidedTourTheme = {
  tooltipBg: "#1e293b",
  tooltipBorder: "#334155",
  titleColor: "#f1f5f9",
  bodyColor: "#94a3b8",
  accent: "#8b5cf6",
  overlay: "rgba(0, 0, 0, 0.6)",
  spotlightBorder: "#8b5cf6",
  // ... see types.ts for all fields
};

<GuidedTour steps={steps} theme={myTheme} />
```

## i18n Example

```tsx
<GuidedTour
  steps={steps}
  labels={{
    next: "\u0414\u0430\u043b\u0435\u0435 \u2192",
    prev: "\u2190 \u041d\u0430\u0437\u0430\u0434",
    finish: "\u0417\u0430\u0432\u0435\u0440\u0448\u0438\u0442\u044c",
    stepOf: "\u0428\u0430\u0433",
  }}
/>
```

## Keyboard Navigation

| Key | Action |
|---|---|
| `ArrowRight` / `Enter` | Next step |
| `ArrowLeft` | Previous step |
| `Escape` | Close tour |

## Structure

```
src/
├── index.ts          # Public exports
├── GuidedTour.tsx     # Main component
├── types.ts           # TypeScript types
├── theme.ts           # Dark / Light theme presets
└── styles.ts          # Arrow, dot, pulse styles
```

## License

MIT
