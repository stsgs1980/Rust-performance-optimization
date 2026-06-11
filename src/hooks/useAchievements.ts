"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { usePersisted, parseStringSet, serializeStringSet } from "@/hooks/use-persisted";
import { ACHIEVEMENTS, type AchievementCtx, type Achievement } from "@/lib/perf-data";

/**
 * Hook for achievement tracking and notifications
 * Manages earned achievements and shows toast notifications
 */
export function useAchievements(
  expandedTasks: Set<number>,
  reviewedTasks: Set<number>
) {
  const [earnedAchievements, setEarnedAchievements] = usePersisted('perf-lab-achievements', new Set<string>(), parseStringSet, serializeStringSet);
  const [achievementToast, setAchievementToast] = useState<Achievement | null>(null);
  const earnedRef = useRef(earnedAchievements);

  // Keep ref in sync
  useEffect(() => { earnedRef.current = earnedAchievements; }, [earnedAchievements]);

  // Check for new achievements
  useEffect(() => {
    const ctx: AchievementCtx = {
      totalExpanded: expandedTasks.size,
      reviewed: reviewedTasks.size,
      viewedTask3: expandedTasks.has(3),
      earned: earnedRef.current,
    };
    for (const a of ACHIEVEMENTS) {
      if (!earnedRef.current.has(a.id) && a.check(ctx)) {
        const newEarned = new Set([...earnedRef.current, a.id]);
        setEarnedAchievements(newEarned);
        requestAnimationFrame(() => setAchievementToast(a));
        break;
      }
    }
  }, [expandedTasks.size, reviewedTasks.size, expandedTasks.has(3), setEarnedAchievements]);

  const dismissToast = useCallback(() => {
    setAchievementToast(null);
  }, []);

  return {
    earnedAchievements,
    achievementToast,
    dismissToast,
  };
}
