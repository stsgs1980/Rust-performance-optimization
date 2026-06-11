"use client";

import { useState, useEffect, useRef, useCallback } from "react";

/**
 * Generic hydration-safe persisted state backed by localStorage.
 * Both server & client start with `initialValue` (no hydration mismatch).
 * Includes runtime validation of parsed localStorage data.
 */
export function usePersisted<T>(
  key: string,
  initialValue: T,
  parse: (raw: string) => T,
  serialize: (val: T) => string
): [T, (next: T) => void] {
  const [value, setValue] = useState(initialValue);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        requestAnimationFrame(() => { setValue(parse(saved)); });
      }
    } catch { /* ignore */ }
  }, [key, parse]);

  const setAndPersist = useCallback((next: T) => {
    setValue(next);
    try { localStorage.setItem(key, serialize(next)); } catch { /* ignore */ }
  }, [key, serialize]);

  return [value, setAndPersist];
}

/* Safe parsers with runtime validation for localStorage data */
export const parseNumberSet = (raw: string): Set<number> => {
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.every((v) => typeof v === 'number' && isFinite(v))) {
      return new Set(parsed as number[]);
    }
  } catch { /* ignore */ }
  return new Set<number>();
};
export const serializeNumberSet = (val: Set<number>) => JSON.stringify(Array.from(val));

export const parseStringSet = (raw: string): Set<string> => {
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.every((v) => typeof v === 'string')) {
      return new Set(parsed as string[]);
    }
  } catch { /* ignore */ }
  return new Set<string>();
};
export const serializeStringSet = (val: Set<string>) => JSON.stringify(Array.from(val));

export const parseString = (raw: string): string => (typeof raw === 'string' ? raw : '');
