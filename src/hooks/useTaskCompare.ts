"use client";

import { useState, useCallback } from "react";

/**
 * Hook for task comparison mode
 * Allows selecting up to 2 tasks for side-by-side comparison
 */
export function useTaskCompare() {
  const [taskCompareMode, setTaskCompareMode] = useState(false);
  const [compareSelected, setCompareSelected] = useState<Set<number>>(new Set());

  const toggleCompareMode = useCallback(() => {
    setTaskCompareMode(c => !c);
    setCompareSelected(new Set());
  }, []);

  const toggleCompareSelect = useCallback((id: number) => {
    setCompareSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < 2) next.add(id);
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setCompareSelected(new Set());
  }, []);

  return {
    taskCompareMode,
    toggleCompareMode,
    compareSelected,
    toggleCompareSelect,
    clearSelection,
  };
}
