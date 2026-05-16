"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { usePersisted, parseNumberSet, serializeNumberSet } from "@/hooks/use-persisted";

/**
 * Hook for tracking reviewed tasks
 * Marks tasks as reviewed after 3 seconds of being expanded
 */
export function useReviewedTasks(expandedTasks: Set<number>) {
  const [reviewedTasks, setReviewedTasks] = usePersisted('perf-lab-reviewed', new Set<number>(), parseNumberSet, serializeNumberSet);
  const reviewTimersRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    expandedTasks.forEach((id) => {
      if (!reviewedTasks.has(id) && !reviewTimersRef.current.has(id)) {
        const timer = setTimeout(() => {
          const next = new Set<number>(reviewedTasks);
          next.add(id);
          setReviewedTasks(next);
          reviewTimersRef.current.delete(id);
        }, 3000);
        reviewTimersRef.current.set(id, timer);
      }
    });

    // Cleanup timers for tasks that are no longer expanded
    reviewTimersRef.current.forEach((timer, id) => {
      if (!expandedTasks.has(id)) {
        clearTimeout(timer);
        reviewTimersRef.current.delete(id);
      }
    });
  }, [expandedTasks, reviewedTasks, setReviewedTasks]);

  const resetProgress = useCallback(() => {
    setReviewedTasks(new Set());
  }, [setReviewedTasks]);

  return {
    reviewedTasks,
    reviewedCount: reviewedTasks.size,
    resetProgress,
  };
}
