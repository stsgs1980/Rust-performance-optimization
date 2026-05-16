"use client";

import { useState, useMemo, useCallback } from "react";
import type { TaskData } from "@/lib/perf-data";

type SortColumn = "id" | "baseline" | "optimized" | "speedup" | "memory" | "";
type SortDirection = "asc" | "desc";

/**
 * Hook for table sorting functionality
 * Manages sort column and direction with toggle behavior
 */
export function useTableSort(tasks: TaskData[]) {
  const [sortColumn, setSortColumn] = useState<SortColumn>("");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const sortedTasks = useMemo(() => {
    const sorted = [...tasks];
    if (sortColumn) {
      sorted.sort((a, b) => {
        let valA: number, valB: number;
        switch (sortColumn) {
          case "id": valA = a.id; valB = b.id; break;
          case "baseline": valA = a.baseline.time; valB = b.baseline.time; break;
          case "optimized": valA = a.optimized.time; valB = b.optimized.time; break;
          case "speedup": valA = a.baseline.time / a.optimized.time; valB = b.baseline.time / b.optimized.time; break;
          case "memory": valA = (1 - a.optimized.memory / a.baseline.memory) * 100; valB = (1 - b.optimized.memory / b.baseline.memory) * 100; break;
          default: return 0;
        }
        return sortDirection === "desc" ? valB - valA : valA - valB;
      });
    }
    return sorted;
  }, [tasks, sortColumn, sortDirection]);

  const handleSort = useCallback((col: SortColumn) => {
    if (sortColumn === col) {
      setSortDirection(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(col);
      setSortDirection("desc");
    }
  }, [sortColumn]);

  return {
    sortColumn,
    sortDirection,
    sortedTasks,
    handleSort,
  };
}
