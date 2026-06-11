"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Hooks
import {
  useScrollNavigation,
  useTaskFilters,
  useTaskExpansion,
  useTableSort,
  useTaskCompare,
  useKeyboardShortcuts,
  useAchievements,
  useTaskNotes,
  useReviewedTasks,
  usePersisted,
  parseNumberSet,
  serializeNumberSet,
  parseString,
} from "@/hooks";

// Data
import { TASKS, formatMs, calcReadingTime, type TaskData } from "@/lib/perf-data";

// Sections
import {
  HeroSection,
  MethodologySection,
  VibeCoderGuide,
  HeatmapSection,
  DashboardSection,
  ResultsSection,
  SummarySection,
} from "@/components/sections";

// Features
import { Header, TaskFilterBar } from "@/components/features";

// Components
import {
  FadeIn, SectionDivider, CodeDiff,
  CommandPalette, HelpModal, AchievementToast,
  TaskPreviewTooltip, useShareURL,
} from "@/components/perf/SmallComponents";
import { CodeBlock } from "@/components/perf/CodeBlock";
import { BenchChart } from "@/components/perf/BenchChart";
import { GuidedTour, type TourStep, type GuidedTourRef } from "@/components/ui/guided-tour";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Check, Star, ChevronDown, ChevronUp, CheckCircle2, XCircle, Columns2, Rows3, GitCompareArrows, RotateCcw,
} from "lucide-react";

// Guided Tour Steps
const TOUR_STEPS: TourStep[] = [
  { target: "#hero", title: "Rust performance optimization", description: "5 реальных задач оптимизации на Rust.", position: "bottom" },
  { target: "header", title: "Панель навигации", description: "Переход к любой секции.", position: "bottom" },
  { target: "[data-tour-search]", title: "Поиск и фильтрация", description: "Поиск задач по техникам.", position: "bottom" },
  { target: "[data-tour-task]", title: "Карточка задачи", description: "Нажмите для раскрытия.", position: "bottom" },
  { target: "[data-tour-compare]", title: "Режим сравнения", description: "Сравните 2 задачи.", position: "bottom" },
  { target: "[data-tour-export]", title: "Экспорт в Markdown", description: "Скачайте отчёт.", position: "bottom" },
  { target: "[data-tour-cmd]", title: "Палитра команд", description: "Нажмите Ctrl+K.", position: "bottom" },
  { target: "[data-tour-monitor]", title: "Панель задач", description: "Разверните или сверните все карточки одной кнопкой.", position: "top" },
  { target: "[data-tour-help]", title: "Горячие клавиши", description: "Нажмите ? для списка.", position: "left" },
];

// TaskSection component (kept inline due to tight coupling)
function TaskSection({ task, expanded, onToggle, compareMode, onToggleCompare, reviewed, starred, onToggleStar, taskCompareMode, onCompareSelect, compareSelected, readingTime, diffMode, onToggleDiff, noteOpen, noteText, onToggleNote, onSaveNote }: {
  task: TaskData; expanded: boolean; onToggle: () => void; compareMode: boolean; onToggleCompare: () => void;
  reviewed: boolean; starred: boolean; onToggleStar: () => void; taskCompareMode: boolean; onCompareSelect: () => void;
  compareSelected: boolean; readingTime: number; diffMode: boolean; onToggleDiff: () => void;
  noteOpen: boolean; noteText: string; onToggleNote: () => void; onSaveNote: (text: string) => void;
}) {
  const Icon = task.icon;
  const speedup = (task.baseline.time / task.optimized.time).toFixed(1);

  return (
    <section id={`task-${task.id}`} className="scroll-mt-16">
      <FadeIn>
        <Card role="button" tabIndex={0} aria-expanded={expanded}
          className={`bg-[#141414] border transition-all cursor-pointer card-industrial card-lift ${
            expanded ? "border-[#ff6b2b] border-l-[3px] ind-glow ind-border-animated pulse-ring neon-border" : "border-[#262626] hover:border-[#3a3a3a]"
          }`}
          onClick={onToggle} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle(); } }}
        >
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex items-center gap-3 flex-1">
                {taskCompareMode && (
                  <div className={`compare-checkbox ${compareSelected ? 'checked' : ''}`} onClick={(e) => { e.stopPropagation(); onCompareSelect(); }}>
                    {compareSelected && <Check className="size-2.5" />}
                  </div>
                )}
                <button onClick={(e) => { e.stopPropagation(); onToggleStar(); }} className="star-btn" aria-label={starred ? "Убрать из избранного" : "Добавить в избранное"}>
                  <Star className="size-3.5" fill={starred ? '#fbbf24' : 'none'} />
                </button>
                <div className="size-10 bg-[#1c1c1c] flex items-center justify-center shrink-0">
                  <Icon className="size-4 text-[#8a8a8a]" />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-[10px] font-[family-name:var(--font-ibm-mono)] text-[#8a8a8a]">#{task.id}</span>
                    <Badge variant="outline" className="text-[#8a8a8a] border-[#262626] text-[10px] badge-hover">{task.difficulty}</Badge>
                    <Badge variant="outline" className="border-[#ff6b2b]/30 text-[#ff6b2b] text-[10px] badge-hover">{speedup}x</Badge>
                    {reviewed && <Check className="size-2.5 text-[#4ade80]" />}
                  </div>
                  <CardTitle className="text-sm font-medium text-[#d4d4d4]">{task.title}</CardTitle>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={(e) => { e.stopPropagation(); onToggleDiff(); }} className="text-[#8a8a8a] hover:text-[#ff6b2b] transition-colors p-1" title="Diff">
                  <GitCompareArrows className="size-3.5" />
                </button>
                <span className="text-[#8a8a8a] sm:pr-2">{expanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}</span>
              </div>
            </div>
          </CardHeader>
        </Card>
      </FadeIn>

      {expanded && (
        <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="mt-4 space-y-4">
          {/* Problem Statement */}
          <FadeIn delay={0.05}>
            <Card className="bg-[#141414] border border-[#262626] card-industrial">
              <CardHeader className="pb-3"><CardTitle className="text-xs uppercase tracking-widest text-[#8a8a8a]">Постановка задачи</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-[#8a8a8a] leading-relaxed">{task.problem}</p>
                <div className="flex flex-wrap gap-2">{task.constraints.map((c, i) => (
                  <Badge key={i} variant="outline" className="text-[#8a8a8a] border-[#262626] text-[10px] font-normal badge-hover">{c}</Badge>
                ))}</div>
              </CardContent>
            </Card>
          </FadeIn>

          {/* Code Comparison */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {compareMode ? (
              <div className="xl:col-span-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-[family-name:var(--font-ibm-mono)] text-[#8a8a8a] uppercase tracking-widest">Сравнение кода</span>
                  <button onClick={onToggleCompare} className="text-[#8a8a8a] hover:text-[#ff6b2b] transition-colors p-1"><Rows3 className="size-3.5" /></button>
                </div>
                <div className="code-compare-grid">
                  <CodeBlock code={task.baseline.code} title={`Naive - ${task.title}`} variant="baseline" />
                  <CodeBlock code={task.optimized.code} title={`Optimized - ${task.title}`} variant="optimized" />
                </div>
              </div>
            ) : (
              <div className="xl:col-span-1">
                <div className="flex items-center justify-end mb-0">
                  <button onClick={onToggleCompare} className="text-[#8a8a8a] hover:text-[#ff6b2b] transition-colors p-1"><Columns2 className="size-3.5" /></button>
                </div>
                {diffMode ? (
                  <CodeDiff baseline={task.baseline.code} optimized={task.optimized.code} title={`Diff - ${task.title}`} />
                ) : (
                  <Tabs defaultValue="baseline" className="w-full">
                    <TabsList className="w-full bg-[#0f0f0f] border border-[#262626] h-9">
                      <TabsTrigger value="baseline" className="flex-1 text-xs font-[family-name:var(--font-ibm-mono)] data-[state=active]:text-[#f87171] data-[state=active]:border-b data-[state=active]:border-[#f87171] text-[#8a8a8a]"><XCircle className="size-3 mr-1" /> Baseline</TabsTrigger>
                      <TabsTrigger value="optimized" className="flex-1 text-xs font-[family-name:var(--font-ibm-mono)] data-[state=active]:text-[#4ade80] data-[state=active]:border-b data-[state=active]:border-[#4ade80] text-[#8a8a8a]"><CheckCircle2 className="size-3 mr-1" /> Optimized</TabsTrigger>
                    </TabsList>
                    <TabsContent value="baseline" className="mt-3"><CodeBlock code={task.baseline.code} title={`Naive - ${task.title}`} variant="baseline" /></TabsContent>
                    <TabsContent value="optimized" className="mt-3"><CodeBlock code={task.optimized.code} title={`Optimized - ${task.title}`} variant="optimized" /></TabsContent>
                  </Tabs>
                )}
              </div>
            )}
            <BenchChart task={task} />
          </div>

          {/* Notes */}
          {noteOpen && (
            <FadeIn><Card className="bg-[#141414] border border-[#262626] card-industrial">
              <CardHeader className="pb-2"><CardTitle className="text-xs uppercase tracking-widest text-[#8a8a8a]">Notes</CardTitle></CardHeader>
              <CardContent><textarea value={noteText} onChange={(e) => onSaveNote(e.target.value)} placeholder="Add note..." className="w-full bg-[#0f0f0f] border border-[#262626] text-sm text-[#d4d4d4] p-3 font-[family-name:var(--font-ibm-mono)] resize-y min-h-[80px] focus:outline-none focus:border-[#ff6b2b]/30" /></CardContent>
            </Card></FadeIn>
          )}
        </motion.div>
      )}
    </section>
  );
}

// Main Page Component
export default function PerformanceLab() {
  // Navigation
  const { activeSection, scrollProgress, showBackToTop, registerSection, scrollTo } = useScrollNavigation();

  // Filtering
  const {
    difficultyFilter, setDifficultyFilter,
    searchQuery, setSearchQuery,
    techniqueTag, setTechniqueTag,
    starredFilter, setStarredFilter,
    starredTasks, toggleStar,
    activeSearch, filteredTasks,
  } = useTaskFilters(TASKS);

  // Expansion
  const { expandedTasks, toggleTask, toggleAll, expandAll, collapseAll } = useTaskExpansion(TASKS);

  // Sorting
  const { sortColumn, sortDirection, sortedTasks, handleSort } = useTableSort(TASKS);

  // Compare
  const { taskCompareMode, toggleCompareMode, compareSelected, toggleCompareSelect } = useTaskCompare();

  // Notes
  const { noteOpenTask, getNote, saveNote, toggleNoteOpen } = useTaskNotes();

  // Reviewed tasks
  const { reviewedTasks, reviewedCount, resetProgress } = useReviewedTasks(expandedTasks);

  // Achievements
  const { earnedAchievements, achievementToast, dismissToast } = useAchievements(expandedTasks, reviewedTasks);

  // UI State
  const [showCmdPalette, setShowCmdPalette] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [diffMode, setDiffMode] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [hoveredTask, setHoveredTask] = useState<TaskData | null>(null);
  const [tooltipRect, setTooltipRect] = useState<DOMRect | null>(null);
  const tourRef = useRef<GuidedTourRef>(null);
  const [tourCompleted, setTourCompleted] = useState(false);

  // Share URL
  const shareURL = useShareURL(expandedTasks);

  // Check if tour was already completed
  useEffect(() => {
    try { setTourCompleted(localStorage.getItem("perf-lab-tour") === "1"); } catch { /* noop */ }
  }, []);

  // Export handler
  const handleExportMarkdown = useCallback(() => {
    const lines: string[] = [];
    lines.push('# Rust performance optimization - Rust Optimization Tasks\n');
    for (const t of TASKS) {
      const sp = (t.baseline.time / t.optimized.time).toFixed(1);
      lines.push(`## ${t.id}. ${t.title}`);
      lines.push(`**Speedup:** ${sp}x\n`);
      lines.push('### Baseline\n```rust\n' + t.baseline.code + '\n```\n');
      lines.push('### Optimized\n```rust\n' + t.optimized.code + '\n```\n');
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'performance-lab.md';
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  // Command palette actions
  const handleCmdAction = useCallback((action: string) => {
    switch (action) {
      case "expand-all": expandAll(); break;
      case "collapse-all": collapseAll(); break;
      case "export-md": handleExportMarkdown(); break;
      case "compare": toggleCompareMode(); break;
      case "starred-filter": setStarredFilter(f => !f); break;
    }
  }, [expandAll, collapseAll, handleExportMarkdown, toggleCompareMode, setStarredFilter]);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onTogglePalette: () => setShowCmdPalette(c => !c),
    onClosePalette: () => { setShowCmdPalette(false); setShowHelpModal(false); },
    onToggleHelp: () => setShowHelpModal(h => !h),
    onToggleExpandAll: toggleAll,
    onNavigateToTask: (id) => scrollTo(`task-${id}`),
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0a]">
      {/* Scroll Progress */}
      <div className="scroll-progress-industrial" style={{ width: `${scrollProgress}%` }} />
      <div className="gradient-mesh" />

      {/* Header */}
      <Header
        activeSection={activeSection}
        scrollTo={scrollTo}
        taskCompareMode={taskCompareMode}
        toggleCompareMode={toggleCompareMode}
        handleExportMarkdown={handleExportMarkdown}
        setShowCmdPalette={setShowCmdPalette}
        shareURL={() => { shareURL(); setCopiedUrl(true); setTimeout(() => setCopiedUrl(false), 2000); }}
        copiedUrl={copiedUrl}
        toggleAll={toggleAll}
        expandedCount={expandedTasks.size}
        reviewedCount={reviewedCount}
        earnedCount={earnedAchievements.size}
      />

      {/* Main Content */}
      <main className="flex-1 mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-8 space-y-10 section-rail">
        {/* Hero */}
        <div ref={registerSection("hero")}>
          <HeroSection
            reviewedTasks={reviewedTasks}
            reviewedCount={reviewedCount}
            scrollTo={scrollTo}
            setHoveredTask={setHoveredTask}
            setTooltipRect={setTooltipRect}
            tooltipRect={tooltipRect}
            hoveredTask={hoveredTask}
          />
        </div>

        {/* Filters */}
        <TaskFilterBar
          difficultyFilter={difficultyFilter}
          setDifficultyFilter={setDifficultyFilter}
          starredFilter={starredFilter}
          setStarredFilter={setStarredFilter}
          starredCount={starredTasks.size}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          setTechniqueTag={setTechniqueTag}
          activeSearch={activeSearch}
          filteredCount={filteredTasks.length}
        />

        {/* Tasks */}
        <div className="space-y-6">
          {filteredTasks.map((task, idx) => (
            <div key={task.id} {...(idx === 0 ? { 'data-tour-task': '' } : {})}>
              <TaskSection
                task={task}
                expanded={expandedTasks.has(task.id)}
                onToggle={() => toggleTask(task.id)}
                compareMode={false}
                onToggleCompare={() => {}}
                reviewed={reviewedTasks.has(task.id)}
                starred={starredTasks.has(task.id)}
                onToggleStar={() => toggleStar(task.id)}
                taskCompareMode={taskCompareMode}
                onCompareSelect={() => toggleCompareSelect(task.id)}
                compareSelected={compareSelected.has(task.id)}
                readingTime={calcReadingTime(task)}
                diffMode={diffMode}
                onToggleDiff={() => setDiffMode(d => !d)}
                noteOpen={noteOpenTask === task.id}
                noteText={getNote(task.id)}
                onToggleNote={() => toggleNoteOpen(task.id)}
                onSaveNote={(text) => saveNote(task.id, text)}
              />
              {idx < filteredTasks.length - 1 && <SectionDivider label={String(idx + 1).padStart(2, "0")} />}
            </div>
          ))}
        </div>

        <SectionDivider label="MT" />

        {/* Methodology */}
        <div ref={registerSection("methodology")}>
          <MethodologySection
            techniqueTag={techniqueTag}
            setTechniqueTag={setTechniqueTag}
            setSearchQuery={setSearchQuery}
          />
        </div>

        <SectionDivider label="VB" />

        {/* Vibe Coder Guide */}
        <div ref={registerSection("vibe-coder")}>
          <VibeCoderGuide />
        </div>

        <SectionDivider label="RS" />

        {/* Heatmap */}
        <div ref={registerSection("heatmap")}>
          <HeatmapSection />
        </div>

        <SectionDivider label="DB" />

        {/* Dashboard */}
        <div ref={registerSection("dashboard")}>
          <DashboardSection />
        </div>

        <SectionDivider label="RT" />

        {/* Results */}
        <div ref={registerSection("results")}>
          <ResultsSection
            sortColumn={sortColumn}
            sortDirection={sortDirection}
            sortedTasks={sortedTasks}
            handleSort={handleSort}
          />
        </div>

        <SectionDivider label="SM" />

        {/* Summary */}
        <div ref={registerSection("summary")}>
          <SummarySection />
        </div>
      </main>

      {/* Modals */}
      <CommandPalette open={showCmdPalette} onClose={() => setShowCmdPalette(false)} onAction={handleCmdAction} onNavigate={scrollTo} allTasks={TASKS} />
      <HelpModal open={showHelpModal} onClose={() => setShowHelpModal(false)} />
      <GuidedTour ref={tourRef} steps={TOUR_STEPS} storageKey="perf-lab-tour"
        onComplete={() => setTourCompleted(true)}
      />

      {/* Restart Tour Button */}
      {tourCompleted && (
        <button
          onClick={() => tourRef.current?.start(0)}
          className="fixed bottom-6 right-6 z-50 size-10 flex items-center justify-center rounded-full bg-[#1a1a1a] border border-[#333] text-[#8a8a8a] hover:text-[#ff6b2b] hover:border-[#ff6b2b]/40 transition-all shadow-lg shadow-black/40"
          title="Повторить туториал"
        >
          <RotateCcw className="size-4" />
        </button>
      )}

      {/* Achievement Toast */}
      <AnimatePresence>
        {achievementToast && (
          <AchievementToast achievement={achievementToast} onDismiss={dismissToast} />
        )}
      </AnimatePresence>
    </div>
  );
}
