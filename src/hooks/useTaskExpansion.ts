"use client";

import { useState, useCallback } from "react";
import type { TaskData } from "@/lib/perf-data";

/**
 * Hook for task expansion state management
 * Handles expanding/collapsing individual tasks or all at once
 */
export function useTaskExpansion(tasks: TaskData[]) {
  const [expandedTasks, setExpandedTasks] = useState<Set<number>>(new Set());

  const toggleTask = useCallback((id: number) => {
    setExpandedTasks((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    if (expandedTasks.size === tasks.length) {
      setExpandedTasks(new Set());
    } else {
      setExpandedTasks(new Set(tasks.map((t) => t.id)));
    }
  }, [expandedTasks.size, tasks]);

  const expandAll = useCallback(() => {
    setExpandedTasks(new Set(tasks.map((t) => t.id)));
  }, [tasks]);

  const collapseAll = useCallback(() => {
    setExpandedTasks(new Set());
  }, []);

  return {
    expandedTasks,
    toggleTask,
    toggleAll,
    expandAll,
    collapseAll,
  };
}
