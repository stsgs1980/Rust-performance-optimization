"use client";

import { Button } from "@/components/ui/button";
import {
  GitCompareArrows, Download, Command, Share2, Link2,
  ChevronDown, ChevronUp, Medal, Check,
} from "lucide-react";
import { TASKS } from "@/lib/perf-data";

interface HeaderProps {
  activeSection: string;
  scrollTo: (id: string) => void;
  taskCompareMode: boolean;
  toggleCompareMode: () => void;
  handleExportMarkdown: () => void;
  setShowCmdPalette: (show: boolean) => void;
  shareURL: () => void;
  copiedUrl: boolean;
  toggleAll: () => void;
  expandedCount: number;
  reviewedCount: number;
  earnedCount: number;
}

const NAV_ITEMS = [
  { id: "hero", label: "Обзор" },
  ...TASKS.map((t) => ({ id: `task-${t.id}`, label: `#${t.id}` })),
  { id: "methodology", label: "Методология" },
  { id: "vibe-coder", label: "Вайб-гайд" },
  { id: "heatmap", label: "Тепловая карта" },
  { id: "dashboard", label: "Дашборд" },
  { id: "results", label: "Результаты" },
  { id: "summary", label: "Итоги" },
];

export function Header({
  activeSection,
  scrollTo,
  taskCompareMode,
  toggleCompareMode,
  handleExportMarkdown,
  setShowCmdPalette,
  shareURL,
  copiedUrl,
  toggleAll,
  expandedCount,
  reviewedCount,
  earnedCount,
}: HeaderProps) {
  const getBreadcrumbLabel = () => {
    if (activeSection === "hero") return "ОБЗОР";
    if (activeSection === "methodology") return "МЕТОДОЛОГИЯ";
    if (activeSection === "vibe-coder") return "ВАЙБ-ГАЙД";
    if (activeSection === "heatmap") return "ТЕПЛОВАЯ КАРТА";
    if (activeSection === "dashboard") return "ДАШБОРД";
    if (activeSection === "results") return "РЕЗУЛЬТАТЫ";
    if (activeSection === "summary") return "ИТОГИ";
    if (activeSection.startsWith("task-")) {
      const id = parseInt(activeSection.replace("task-", ""));
      const task = TASKS.find(t => t.id === id);
      if (task) return `#${task.id} ${task.title.substring(0, 30).toUpperCase()}`;
    }
    return "ОБЗОР";
  };

  const getBreadcrumbSection = () => {
    if (activeSection.startsWith("task-")) return "ЗАДАЧИ";
    if (activeSection === "methodology") return "МЕТОДЫ";
    if (activeSection === "vibe-coder") return "ВАЙБ";
    if (activeSection === "heatmap") return "ТЕПЛОВАЯ КАРТА";
    if (activeSection === "dashboard") return "ДАШБОРД";
    if (activeSection === "results") return "РЕЗУЛЬТАТЫ";
    if (activeSection === "summary") return "ИТОГИ";
    return "ОБЗОР";
  };

  return (
    <header className="sticky top-0 z-50 bg-[#0a0a0a] border-b border-[#262626] glass-dark">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-12">
          <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar max-w-[75vw]">
            {NAV_ITEMS.map((item) => (
              <Button
                key={item.id}
                variant="ghost"
                size="sm"
                className={`text-[10px] shrink-0 h-8 uppercase tracking-[0.2em] font-[family-name:var(--font-ibm-mono)] px-2.5 nav-btn-underline ${
                  activeSection === item.id
                    ? "text-[#ff6b2b] active"
                    : "text-[#8a8a8a] hover:text-[#8a8a8a]"
                }`}
                onClick={() => scrollTo(item.id)}
              >
                {item.label}
              </Button>
            ))}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              data-tour-compare
              onClick={toggleCompareMode}
              className={`size-8 flex items-center justify-center transition-colors ${taskCompareMode ? 'text-[#ff6b2b]' : 'text-[#8a8a8a] hover:text-[#ff6b2b]'}`}
              title="Сравнить задачи"
            >
              <GitCompareArrows className="size-3.5" />
            </button>
            <button
              data-tour-export
              onClick={handleExportMarkdown}
              className="size-8 flex items-center justify-center text-[#8a8a8a] hover:text-[#ff6b2b] transition-colors"
              title="Экспорт в Markdown"
            >
              <Download className="size-3.5" />
            </button>
            <button
              data-tour-cmd
              onClick={() => setShowCmdPalette(true)}
              className="size-8 flex items-center justify-center text-[#666666] hover:text-[#ff6b2b] transition-colors"
              title="Палитра команд (Ctrl+K)"
            >
              <Command className="size-3.5" />
            </button>
            <button
              onClick={() => {
                shareURL();
              }}
              className="size-8 flex items-center justify-center text-[#666666] hover:text-[#ff6b2b] transition-colors"
              title="Поделиться URL"
            >
              {copiedUrl ? <Link2 className="size-3.5 text-[#4ade80]" /> : <Share2 className="size-3.5" />}
            </button>
            <button
              data-tour-monitor
              onClick={toggleAll}
              className="size-8 flex items-center justify-center text-[#8a8a8a] hover:text-[#ff6b2b] transition-colors"
              title={expandedCount === TASKS.length ? "Свернуть все" : "Развернуть все"}
            >
              {expandedCount === TASKS.length ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
            </button>
            <span className="hidden lg:inline text-[10px] font-[family-name:var(--font-ibm-mono)] text-[#4ade80] uppercase tracking-[0.15em] ml-1">
              {reviewedCount}/{TASKS.length}
            </span>
            {earnedCount > 0 && (
              <span className="hidden lg:inline text-[10px] font-[family-name:var(--font-ibm-mono)] text-[#fbbf24] uppercase tracking-[0.15em]">
                <Medal className="size-2.5 inline mr-0.5" />{earnedCount}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Breadcrumb Trail */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 border-t border-[#1c1c1c]">
        <div className="flex items-center gap-1.5 py-1">
          <button
            onClick={() => scrollTo("hero")}
            className="text-[9px] font-[family-name:var(--font-ibm-mono)] text-[#666666] hover:text-[#8a8a8a] transition-colors uppercase tracking-[0.1em]"
          >
            PERF LAB
          </button>
          <span className="text-[9px] font-[family-name:var(--font-ibm-mono)] text-[#666666]">&gt;</span>
          {getBreadcrumbSection() !== "ОБЗОР" && (
            <>
              <button
                onClick={() => scrollTo(
                  activeSection.startsWith("task-") ? "hero" : activeSection
                )}
                className="text-[9px] font-[family-name:var(--font-ibm-mono)] text-[#8a8a8a] hover:text-[#d4d4d4] transition-colors uppercase tracking-[0.1em]"
              >
                {getBreadcrumbSection()}
              </button>
              <span className="text-[9px] font-[family-name:var(--font-ibm-mono)] text-[#666666]">&gt;</span>
            </>
          )}
          <span className="text-[9px] font-[family-name:var(--font-ibm-mono)] text-[#8a8a8a] uppercase tracking-[0.1em]">
            {getBreadcrumbLabel()}
          </span>
        </div>
      </div>
    </header>
  );
}
