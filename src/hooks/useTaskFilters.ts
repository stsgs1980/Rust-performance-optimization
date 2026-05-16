"use client";

import { useState, useMemo } from "react";
import { usePersisted, parseNumberSet, serializeNumberSet } from "@/hooks/use-persisted";
import type { TaskData } from "@/lib/perf-data";

/**
 * Hook for task filtering and searching
 * Manages difficulty filter, search query, technique tag, and starred filter
 */
export function useTaskFilters(tasks: TaskData[]) {
  const [difficultyFilter, setDifficultyFilter] = useState<string>("Все");
  const [searchQuery, setSearchQuery] = useState("");
  const [techniqueTag, setTechniqueTag] = useState<string | null>(null);
  const [starredFilter, setStarredFilter] = useState(false);
  const [starredTasks, setStarredTasks] = usePersisted('perf-lab-starred', new Set<number>(), parseNumberSet, serializeNumberSet);

  const activeSearch = techniqueTag || searchQuery;

  const filteredTasks = useMemo(() => tasks.filter((t) => {
    const matchDiff = difficultyFilter === "Все" || t.difficulty === difficultyFilter;
    const matchStarred = !starredFilter || starredTasks.has(t.id);
    if (!activeSearch.trim()) return matchDiff && matchStarred;
    const q = activeSearch.toLowerCase();
    const matchSearch =
      t.title.toLowerCase().includes(q) ||
      t.problem.toLowerCase().includes(q) ||
      t.techniques.some((tech) => tech.name.toLowerCase().includes(q) || tech.desc.toLowerCase().includes(q));
    return matchDiff && matchSearch && matchStarred;
  }), [tasks, difficultyFilter, starredFilter, starredTasks, activeSearch]);

  const toggleStar = (id: number) => {
    const current = new Set(starredTasks);
    if (current.has(id)) current.delete(id);
    else current.add(id);
    setStarredTasks(current);
  };

  const setTechniqueTagWithSearch = (tag: string | null) => {
    setTechniqueTag(tag);
    setSearchQuery(tag || "");
  };

  return {
    difficultyFilter,
    setDifficultyFilter,
    searchQuery,
    setSearchQuery,
    techniqueTag,
    setTechniqueTag: setTechniqueTagWithSearch,
    starredFilter,
    setStarredFilter,
    starredTasks,
    toggleStar,
    activeSearch,
    filteredTasks,
  };
}
