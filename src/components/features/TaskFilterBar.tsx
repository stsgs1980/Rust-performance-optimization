"use client";

import { Search, Star } from "lucide-react";
import { DIFF_COUNTS } from "@/lib/perf-data";

const DIFFICULTIES = ["Все", "Продвинутый", "Экспертный"];

interface TaskFilterBarProps {
  difficultyFilter: string;
  setDifficultyFilter: (filter: string) => void;
  starredFilter: boolean;
  setStarredFilter: (filter: boolean) => void;
  starredCount: number;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  setTechniqueTag: (tag: string | null) => void;
  activeSearch: string;
  filteredCount: number;
}

export function TaskFilterBar({
  difficultyFilter,
  setDifficultyFilter,
  starredFilter,
  setStarredFilter,
  starredCount,
  searchQuery,
  setSearchQuery,
  setTechniqueTag,
  activeSearch,
  filteredCount,
}: TaskFilterBarProps) {
  return (
    <>
      {/* Difficulty Filter Pills */}
      <div className="flex items-center gap-2 flex-wrap">
        {DIFFICULTIES.map((d) => (
          <button
            key={d}
            onClick={() => setDifficultyFilter(d)}
            className={`text-[10px] font-[family-name:var(--font-ibm-mono)] uppercase tracking-[0.15em] px-3 py-1.5 border transition-colors ${
              difficultyFilter === d
                ? "text-[#ff6b2b] border-[#ff6b2b]/30"
                : "text-[#8a8a8a] border-[#262626] hover:text-[#8a8a8a]"
            }`}
          >
            {d} ({DIFF_COUNTS[d as keyof typeof DIFF_COUNTS]})
          </button>
        ))}
        <button
          onClick={() => setStarredFilter(!starredFilter)}
          className={`text-[10px] font-[family-name:var(--font-ibm-mono)] uppercase tracking-[0.15em] px-3 py-1.5 border transition-colors flex items-center gap-1 ${
            starredFilter
              ? "text-[#fbbf24] border-[#fbbf24]/30"
              : "text-[#8a8a8a] border-[#262626] hover:text-[#8a8a8a]"
          }`}
        >
          <Star className="size-3" fill={starredFilter ? '#fbbf24' : 'none'} />
          Избранное ({starredCount})
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative" data-tour-search>
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-[#666666]" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); setTechniqueTag(null); }}
          placeholder="Поиск по техникам, названиям или описаниям..."
          className="search-industrial search-glow w-full pl-9 pr-16"
        />
        {activeSearch.trim() && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-[family-name:var(--font-ibm-mono)] text-[#8a8a8a]">
            {filteredCount} {filteredCount === 1 ? "совпадение" : filteredCount < 5 ? "совпадения" : "совпадений"}
          </span>
        )}
      </div>
    </>
  );
}
