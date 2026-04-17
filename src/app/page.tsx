"use client";

import { useEffect, useRef, useState, useCallback, useMemo, Fragment } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Search, Zap, ArrowUp, Star, Share2, Link2,
  GitCompareArrows, Download, Command, Monitor, Sparkles,
  Waypoints, Trophy, Medal, RotateCcw, AlertTriangle, BarChart,
  MemoryStick, Check, Filter, Keyboard, Palette,
  TrendingUp, Database, Layers, Network, ArrowRightLeft, Cpu, Grid3x3, Gauge,
} from "lucide-react";

import {
  TaskData, TASKS, ALL_TECHNIQUES, ACHIEVEMENTS, HEATMAP_DATA, ACCENT_COLORS,
  TOTAL_SPEEDUP, MEM_IMPROVED_COUNT, TOTAL_TIME_SAVED, TOTAL_MEM_SAVED,
  SPEEDUPS, MIN_SPEEDUP, MAX_SPEEDUP, AVG_SPEEDUP, DIFF_COUNTS,
  formatMs, calcReadingTime, getGrade, AchievementCtx,
} from "@/lib/perf-data";
import { usePersisted, parseNumberSet, serializeNumberSet, parseStringSet, serializeStringSet, parseString } from "@/hooks/use-persisted";
import {
  FadeIn, SectionDivider, AnimatedCounter, AnimatedProgressBar,
  SortIcon, CodeDiff, CommandPalette, HelpModal,
  ExecutionPipeline, OptimizationHeatmap, AchievementToast,
  TaskPreviewTooltip, ActivityTimeline, AmbientParticles, useRipple, useShareURL, ComplexityBadge,
} from "@/components/perf/SmallComponents";
import { CodeBlock } from "@/components/perf/CodeBlock";
import { BenchChart } from "@/components/perf/BenchChart";
import { RadarChart } from "@/components/perf/RadarChart";
import {
  ChevronDown, ChevronUp, CheckCircle2, XCircle, Columns2, Rows3,
} from "lucide-react";

/* ─────────────── TASK SECTION (inline — tightly coupled to PerformanceLab state) ─────────────── */

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
                <button onClick={(e) => { e.stopPropagation(); onToggleStar(); }} className="star-btn" aria-label={starred ? "Remove star" : "Add star"}>
                  <Star className="size-3.5" fill={starred ? '#fbbf24' : 'none'} />
                </button>
                <div className="size-10 bg-[#1c1c1c] flex items-center justify-center shrink-0">
                  <Icon className="size-4 text-[#8a8a8a]" />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-[10px] font-[family-name:var(--font-ibm-mono)] text-[#8a8a8a]">#{task.id}</span>
                    <Badge variant="outline" className="text-[#8a8a8a] border-[#262626] text-[10px] badge-hover">{task.difficulty}</Badge>
                    <Badge variant="outline" className="text-[#8a8a8a] border-[#262626] text-[10px] badge-hover">{task.category}</Badge>
                    <Badge variant="outline" className="border-[#ff6b2b]/30 text-[#ff6b2b] text-[10px] badge-hover">{speedup}×</Badge>
                    {reviewed && <Check className="size-2.5 text-[#4ade80]" />}
                    {readingTime > 0 && expanded && <span className="text-[9px] font-[family-name:var(--font-ibm-mono)] text-[#666666]">{readingTime} min read</span>}
                  </div>
                  <CardTitle className="text-sm font-medium text-[#d4d4d4]">{task.title}</CardTitle>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {diffMode !== undefined && (
                  <button onClick={(e) => { e.stopPropagation(); onToggleDiff(); }} className="text-[#8a8a8a] hover:text-[#ff6b2b] transition-colors p-1" title="Toggle diff view">
                    <GitCompareArrows className="size-3.5" />
                  </button>
                )}
                <span className="text-[#8a8a8a] sm:pr-2">{expanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}</span>
              </div>
            </div>
          </CardHeader>
        </Card>
      </FadeIn>

      {expanded && (
        <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="mt-4 space-y-4">
          <FadeIn delay={0.05}>
            <Card className="bg-[#141414] border border-[#262626] card-industrial">
              <CardHeader className="pb-3"><CardTitle className="text-xs uppercase tracking-widest text-[#8a8a8a]">Problem Statement</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-[#8a8a8a] leading-relaxed">{task.problem}</p>
                <div className="flex flex-wrap gap-2">{task.constraints.map((c, i) => (
                  <Badge key={i} variant="outline" className="text-[#8a8a8a] border-[#262626] text-[10px] font-normal badge-hover">{c}</Badge>
                ))}</div>
              </CardContent>
            </Card>
          </FadeIn>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {compareMode ? (
              <div className="xl:col-span-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-[family-name:var(--font-ibm-mono)] text-[#8a8a8a] uppercase tracking-widest">Code Comparison</span>
                  <button onClick={(e) => { e.stopPropagation(); onToggleCompare(); }} className="text-[#8a8a8a] hover:text-[#ff6b2b] transition-colors p-1" title="Switch to tabbed view"><Rows3 className="size-3.5" /></button>
                </div>
                <div className="code-compare-grid">
                  <CodeBlock code={task.baseline.code} title={`Naive — ${task.title}`} variant="baseline" />
                  <CodeBlock code={task.optimized.code} title={`Optimized — ${task.title}`} variant="optimized" />
                </div>
              </div>
            ) : (
              <div className="xl:col-span-1">
                <div className="flex items-center justify-end mb-0">
                  <button onClick={(e) => { e.stopPropagation(); onToggleCompare(); }} className="text-[#8a8a8a] hover:text-[#ff6b2b] transition-colors p-1" title="Switch to side-by-side view"><Columns2 className="size-3.5" /></button>
                </div>
                {diffMode ? (
                  <CodeDiff baseline={task.baseline.code} optimized={task.optimized.code} title={`Diff — ${task.title}`} />
                ) : (
                  <Tabs defaultValue="baseline" className="w-full">
                    <TabsList className="w-full bg-[#0f0f0f] border border-[#262626] h-9">
                      <TabsTrigger value="baseline" className="flex-1 text-xs font-[family-name:var(--font-ibm-mono)] data-[state=active]:text-[#f87171] data-[state=active]:border-b data-[state=active]:border-[#f87171] text-[#8a8a8a]"><XCircle className="size-3 mr-1" /> Baseline</TabsTrigger>
                      <TabsTrigger value="optimized" className="flex-1 text-xs font-[family-name:var(--font-ibm-mono)] data-[state=active]:text-[#4ade80] data-[state=active]:border-b data-[state=active]:border-[#4ade80] text-[#8a8a8a]"><CheckCircle2 className="size-3 mr-1" /> Optimized</TabsTrigger>
                    </TabsList>
                    <TabsContent value="baseline" className="mt-3"><CodeBlock code={task.baseline.code} title={`Naive — ${task.title}`} variant="baseline" /></TabsContent>
                    <TabsContent value="optimized" className="mt-3"><CodeBlock code={task.optimized.code} title={`Optimized — ${task.title}`} variant="optimized" /></TabsContent>
                  </Tabs>
                )}
              </div>
            )}
            <BenchChart task={task} />
          </div>

          <FadeIn delay={0.1}>
            <Card className="bg-[#141414] border border-[#262626] card-industrial">
              <CardHeader className="pb-3"><CardTitle className="text-xs uppercase tracking-widest text-[#8a8a8a]">Big O Analysis</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 border border-[#262626] border-l-2 border-l-[#f87171]">
                    <p className="text-[10px] uppercase tracking-widest text-[#8a8a8a] font-[family-name:var(--font-ibm-mono)] mb-3">Baseline</p>
                    <div className="flex flex-wrap gap-2 mb-3"><ComplexityBadge label="Time" complexity={task.baseline.timeComplexity} /><ComplexityBadge label="Space" complexity={task.baseline.spaceComplexity} /></div>
                    <p className="text-xs text-[#8a8a8a] leading-relaxed">{task.baseline.explanation}</p>
                  </div>
                  <div className="p-4 border border-[#262626] border-l-2 border-l-[#4ade80]">
                    <p className="text-[10px] uppercase tracking-widest text-[#8a8a8a] font-[family-name:var(--font-ibm-mono)] mb-3">Optimized</p>
                    <div className="flex flex-wrap gap-2 mb-3"><ComplexityBadge label="Time" complexity={task.optimized.timeComplexity} /><ComplexityBadge label="Space" complexity={task.optimized.spaceComplexity} /></div>
                    <p className="text-xs text-[#8a8a8a] leading-relaxed">{task.optimized.explanation}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </FadeIn>

          <FadeIn delay={0.15}>
            <Card className="bg-[#141414] border border-[#262626] card-industrial">
              <CardHeader className="pb-3"><CardTitle className="text-xs uppercase tracking-widest text-[#8a8a8a]">Key Optimizations</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{task.techniques.map((t, i) => (
                  <div key={i} className="bg-[#0f0f0f] p-3 border border-[#262626]">
                    <div className="flex items-center gap-2 mb-1"><span className="text-xs font-bold font-[family-name:var(--font-ibm-mono)] text-[#ff6b2b]">{String(i + 1).padStart(2, "0")}</span><p className="text-sm font-medium text-[#d4d4d4]">{t.name}</p></div>
                    <p className="text-xs text-[#8a8a8a] leading-relaxed">{t.desc}</p>
                  </div>
                ))}</div>
              </CardContent>
            </Card>
          </FadeIn>

          {noteOpen && (
            <FadeIn><Card className="bg-[#141414] border border-[#262626] card-industrial">
              <CardHeader className="pb-2"><CardTitle className="text-xs uppercase tracking-widest text-[#8a8a8a]">Notes</CardTitle></CardHeader>
              <CardContent><textarea value={noteText} onChange={(e) => onSaveNote(e.target.value)} placeholder="Add notes for this task..." className="w-full bg-[#0f0f0f] border border-[#262626] text-sm text-[#d4d4d4] p-3 font-[family-name:var(--font-ibm-mono)] resize-y min-h-[80px] focus:outline-none focus:border-[#ff6b2b]/30" /></CardContent>
            </Card></FadeIn>
          )}
        </motion.div>
      )}
    </section>
  );
}

/* ─────────────────────── MAIN PAGE ─────────────────────── */

export default function PerformanceLab() {
  const [activeSection, setActiveSection] = useState<string>("hero");
  const [expandedTasks, setExpandedTasks] = useState<Set<number>>(new Set());
  const [scrollProgress, setScrollProgress] = useState(0);
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [compareMode, setCompareMode] = useState(false);
  const [sortColumn, setSortColumn] = useState<string>("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [monitorExpanded, setMonitorExpanded] = useState(true);
  const [reviewedTasks, setReviewedTasks] = usePersisted('perf-lab-reviewed', new Set<number>(), parseNumberSet, serializeNumberSet);
  const [techniqueTag, setTechniqueTag] = useState<string | null>(null);
  const [taskCompareMode, setTaskCompareMode] = useState(false);
  const [compareSelected, setCompareSelected] = useState<Set<number>>(new Set());
  const [starredTasks, setStarredTasks] = usePersisted('perf-lab-starred', new Set<number>(), parseNumberSet, serializeNumberSet);
  const [starredFilter, setStarredFilter] = useState(false);
  const [noteOpenTask, setNoteOpenTask] = useState<number | null>(null);
  const [showCmdPalette, setShowCmdPalette] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [diffMode, setDiffMode] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [hoveredTask, setHoveredTask] = useState<TaskData | null>(null);
  const [tooltipRect, setTooltipRect] = useState<DOMRect | null>(null);
  const [achievementToastRaw, setAchievementToastRaw] = useState<typeof ACHIEVEMENTS[0] | null>(null);
  const achievementToastRef = useRef<typeof ACHIEVEMENTS[0] | null>(null);

  // Task notes — single persisted JSON object for all tasks
  const [taskNotes, setTaskNotes] = usePersisted('perf-lab-notes', '{}', parseString, parseString);
  const taskNotesRef = useRef(taskNotes);
  useEffect(() => { taskNotesRef.current = taskNotes; }, [taskNotes]);

  // Live clock
  const [currentTime, setCurrentTime] = useState('');
  useEffect(() => {
    const update = () => {
      const now = new Date();
      requestAnimationFrame(() => {
        setCurrentTime(
          `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`
        );
      });
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  // Sync ref with state (for reading in effects)
  useEffect(() => { achievementToastRef.current = achievementToastRaw; }, [achievementToastRaw]);
  const shareURL = useShareURL(expandedTasks);
  const reviewTimersRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());
  const sectionsRef = useRef<Record<string, HTMLElement | null>>({});

  // Reset progress handler
  const resetProgress = useCallback(() => {
    setReviewedTasks(new Set());
  }, [setReviewedTasks]);

  // Save reviewed to localStorage
  const saveReviewed = useCallback((ids: Set<number>) => {
    setReviewedTasks(ids);
  }, [setReviewedTasks]);

  // Star/unstar task handler
  const toggleStar = useCallback((id: number) => {
    const current = new Set(starredTasks);
    if (current.has(id)) current.delete(id);
    else current.add(id);
    setStarredTasks(current);
  }, [starredTasks, setStarredTasks]);

  // Compare select handler
  const toggleCompareSelect = useCallback((id: number) => {
    setCompareSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < 2) next.add(id);
      return next;
    });
  }, []);

  // Markdown export handler
  const handleExportMarkdown = useCallback(() => {
    const lines: string[] = [];
    lines.push('# Performance Lab — Rust Optimization Challenges\n');
    lines.push(`> ${TASKS.length} tasks · Total speedup: ×\n`);
    for (const t of TASKS) {
      const sp = (t.baseline.time / t.optimized.time).toFixed(1);
      const memSave = ((1 - t.optimized.memory / t.baseline.memory) * 100).toFixed(0);
      lines.push(`## ${t.id}. ${t.title}`);
      lines.push(`**Category:** ${t.category} · **Difficulty:** ${t.difficulty} · **Speedup:** ${sp}×\n`);
      lines.push('### Problem');
      lines.push(t.problem + '\n');
      lines.push('### Constraints');
      t.constraints.forEach(c => { lines.push(`- ${c}`); });
      lines.push('');
      lines.push('### Baseline Code');
      lines.push('```rust');
      lines.push(t.baseline.code);
      lines.push('```\n');
      lines.push('### Optimized Code');
      lines.push('```rust');
      lines.push(t.optimized.code);
      lines.push('```\n');
      lines.push('### Benchmarks');
      lines.push('| Metric | Baseline | Optimized |');
      lines.push('|--------|----------|-----------|');
      lines.push(`| Time | ${formatMs(t.baseline.time)} | ${formatMs(t.optimized.time)} |`);
      lines.push(`| Memory | ${t.baseline.memory} MB | ${t.optimized.memory} MB |`);
      lines.push(`| Speedup | — | ${sp}× |`);
      lines.push(`| Memory Delta | — | ${parseInt(memSave) > 0 ? '-' : '+'}${Math.abs(parseInt(memSave))}% |\n`);
      lines.push('### Complexity');
      lines.push(`- **Baseline:** Time ${t.baseline.timeComplexity}, Space ${t.baseline.spaceComplexity}`);
      lines.push(`- **Optimized:** Time ${t.optimized.timeComplexity}, Space ${t.optimized.spaceComplexity}\n`);
      lines.push('### Key Techniques');
      t.techniques.forEach((tech, i) => { lines.push(`${i + 1}. **${tech.name}** — ${tech.desc}`); });
      lines.push('\n---\n');
    }
    const ts = TASKS.reduce((a, t) => a + t.baseline.time / t.optimized.time, 0);
    lines.splice(1, 1, `> ${TASKS.length} tasks · Total speedup: ${ts.toFixed(0)}×\n`);
    const blob = new Blob([lines.join('\n')], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'performance-lab.md';
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  // Mark task as reviewed after 3 seconds of being expanded
  useEffect(() => {
    expandedTasks.forEach((id) => {
      if (!reviewedTasks.has(id) && !reviewTimersRef.current.has(id)) {
        const timer = setTimeout(() => {
          const next = new Set<number>(reviewedTasks);
          next.add(id);
          saveReviewed(next);
          reviewTimersRef.current.delete(id);
        }, 3000);
        reviewTimersRef.current.set(id, timer);
      }
    });

    // Cleanup timers for tasks that are no longer expanded (but keep reviewed status)
    reviewTimersRef.current.forEach((timer, id) => {
      if (!expandedTasks.has(id)) {
        clearTimeout(timer);
        reviewTimersRef.current.delete(id);
      }
    });
  }, [expandedTasks, reviewedTasks, saveReviewed]);

  const reviewedCount = reviewedTasks.size;

  // Accent color — hydration-safe via usePersistedString (starts #ff6b2b, loads from localStorage after mount)
  const [activeAccent, setActiveAccentRaw] = usePersisted('perf-lab-accent', '#ff6b2b', parseString, parseString);
  const accentRef = useRef(activeAccent);

  // Sync CSS variable on mount + when accent changes
  useEffect(() => {
    document.documentElement.style.setProperty('--accent-color', activeAccent);
  }, [activeAccent]);

  const setActiveAccent = useCallback((color: string) => {
    accentRef.current = color;
    setActiveAccentRaw(color);
  }, [setActiveAccentRaw]);

  // Earned achievements — hydration-safe via usePersistedAchievements (starts empty, loads after mount)
  const [earnedAchievements, setEarnedAchievements] = usePersisted('perf-lab-achievements', new Set<string>(), parseStringSet, serializeStringSet);
  const earnedRef = useRef(earnedAchievements);

  // Keep earnedRef in sync
  useEffect(() => { earnedRef.current = earnedAchievements; }, [earnedAchievements]);

  // Achievement checking — uses requestAnimationFrame to defer toast setState (React 19 lint compliance)
  useEffect(() => {
    const ctx: AchievementCtx = {
      totalExpanded: expandedTasks.size,
      reviewed: reviewedCount,
      viewedTask3: expandedTasks.has(3),
      earned: earnedRef.current,
    };
    for (const a of ACHIEVEMENTS) {
      if (!earnedRef.current.has(a.id) && a.check(ctx)) {
        const newEarned = new Set([...earnedRef.current, a.id]);
        setEarnedAchievements(newEarned);
        // Defer toast setState to next animation frame (avoids synchronous setState-in-effect)
        requestAnimationFrame(() => setAchievementToastRaw(a));
        break;
      }
    }
  }, [expandedTasks.size, reviewedCount, expandedTasks.has(3), setEarnedAchievements]);

  // Combine technique tag with search for filtering
  const activeSearch = techniqueTag || searchQuery;

  const filteredTasks = useMemo(() => TASKS.filter((t) => {
    const matchDiff = difficultyFilter === "all" || t.difficulty === difficultyFilter;
    const matchStarred = !starredFilter || starredTasks.has(t.id);
    if (!activeSearch.trim()) return matchDiff && matchStarred;
    const q = activeSearch.toLowerCase();
    const matchSearch =
      t.title.toLowerCase().includes(q) ||
      t.problem.toLowerCase().includes(q) ||
      t.techniques.some((tech) => tech.name.toLowerCase().includes(q) || tech.desc.toLowerCase().includes(q));
    return matchDiff && matchSearch && matchStarred;
  }), [difficultyFilter, starredFilter, starredTasks, activeSearch]);

  const difficulties = ["all", "Advanced", "Expert"];

  const registerSection =
    useCallback((id: string) => (el: HTMLElement | null) => {
      sectionsRef.current[id] = el;
    }, []);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(docHeight > 0 ? (scrollTop / docHeight) * 100 : 0);
      setShowBackToTop(scrollTop > 400);

      const scrollY = scrollTop + 120;
      let current = "hero";
      const ids = Object.keys(sectionsRef.current).sort(
        (a, b) =>
          (sectionsRef.current[a]?.offsetTop ?? 0) -
          (sectionsRef.current[b]?.offsetTop ?? 0)
      );
      for (const id of ids) {
        if (sectionsRef.current[id] && sectionsRef.current[id]!.offsetTop <= scrollY)
          current = id;
      }
      setActiveSection(current);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollTo = useCallback((id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" }), []);

  const toggleAll = useCallback(() => {
    if (expandedTasks.size === TASKS.length) {
      setExpandedTasks(new Set());
    } else {
      setExpandedTasks(new Set(TASKS.map((t) => t.id)));
    }
  }, [expandedTasks]);

  const toggleTask = (id: number) => {
    setExpandedTasks((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Command palette action handler
  const handleCmdAction = useCallback((action: string) => {
    switch (action) {
      case "expand-all": setExpandedTasks(new Set(TASKS.map(t => t.id))); break;
      case "collapse-all": setExpandedTasks(new Set()); break;
      case "export-md": handleExportMarkdown(); break;
      case "compare": setTaskCompareMode(c => !c); break;
      case "starred-filter": setStarredFilter(f => !f); break;
    }
  }, [handleExportMarkdown]);

  // Keyboard shortcuts: Ctrl+K for command palette, ? for help, E to expand all, 1-5 to jump to task
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K — command palette
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowCmdPalette(c => !c);
        return;
      }
      if (e.key === 'Escape') {
        setShowCmdPalette(false);
        setShowHelpModal(false);
        return;
      }
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      // ? — help modal
      if (e.key === '?') {
        setShowHelpModal(h => !h);
        return;
      }
      if (e.key === 'e' || e.key === 'E' || e.key === 'к' || e.key === 'К') {
        toggleAll();
      }
      const num = parseInt(e.key);
      if (num >= 1 && num <= 5) {
        scrollTo(`task-${num}`);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleAll, scrollTo]);

  const navItems = [
    { id: "hero", label: "Overview" },
    ...TASKS.map((t) => ({ id: `task-${t.id}`, label: `#${t.id}` })),
    { id: "methodology", label: "Methodology" },
    { id: "vibe-coder", label: "Vibe Guide" },
    { id: "heatmap", label: "Heatmap" },
    { id: "dashboard", label: "Dashboard" },
    { id: "results", label: "Results" },
 { id: "summary", label: "Summary" },
  ];





  // Sort logic for results table
  const sortedTasks = useMemo(() => {
    const sorted = [...TASKS];
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
  }, [sortColumn, sortDirection]);

  const handleSort = (col: string) => {
    if (sortColumn === col) {
      setSortDirection(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(col);
      setSortDirection("desc");
    }
  };

  // Breadcrumb logic
  const getBreadcrumbLabel = () => {
    if (activeSection === "hero") return "OVERVIEW";
    if (activeSection === "methodology") return "METHODOLOGY";
    if (activeSection === "vibe-coder") return "VIBE GUIDE";
    if (activeSection === "heatmap") return "HEATMAP";
    if (activeSection === "dashboard") return "DASHBOARD";
    if (activeSection === "results") return "RESULTS";
    if (activeSection === "summary") return "SUMMARY";
    if (activeSection.startsWith("task-")) {
      const id = parseInt(activeSection.replace("task-", ""));
      const task = TASKS.find(t => t.id === id);
      if (task) return `#${task.id} ${task.title.substring(0, 30).toUpperCase()}`;
    }
    return "OVERVIEW";
  };

  const getBreadcrumbSection = () => {
    if (activeSection.startsWith("task-")) return "TASKS";
    if (activeSection === "methodology") return "METHODS";
    if (activeSection === "vibe-coder") return "VIBE";
    if (activeSection === "heatmap") return "HEATMAP";
    if (activeSection === "dashboard") return "DASHBOARD";
    if (activeSection === "results") return "RESULTS";
    if (activeSection === "summary") return "SUMMARY";
    return "OVERVIEW";
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0a]">
      {/* ─── SCROLL PROGRESS BAR ─── */}
      <div className="scroll-progress-industrial" style={{ width: `${scrollProgress}%` }} />

      {/* ─── GRADIENT MESH BACKGROUND ─── */}
      <div className="gradient-mesh" />

      {/* ─── STICKY HEADER ─── */}
      <header className="sticky top-0 z-50 bg-[#0a0a0a] border-b border-[#262626] glass-dark">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-12">
            <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar max-w-[75vw]">
              {navItems.map((item) => (
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
            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => setTaskCompareMode(c => !c)}
                className={`text-[10px] font-[family-name:var(--font-ibm-mono)] uppercase tracking-[0.15em] transition-colors flex items-center gap-1 ${taskCompareMode ? 'text-[#ff6b2b]' : 'text-[#8a8a8a] hover:text-[#ff6b2b]'}`}
                title="Compare tasks"
              >
                <GitCompareArrows className="size-3" />
                <span className="hidden sm:inline">Compare</span>
              </button>
              <button
                onClick={handleExportMarkdown}
                className="text-[10px] font-[family-name:var(--font-ibm-mono)] text-[#8a8a8a] hover:text-[#ff6b2b] uppercase tracking-[0.15em] transition-colors flex items-center gap-1"
                title="Export as Markdown"
              >
                <Download className="size-3" />
                <span className="hidden sm:inline">Export</span>
              </button>
              <button
                onClick={() => setShowCmdPalette(true)}
                className="text-[10px] font-[family-name:var(--font-ibm-mono)] text-[#666666] hover:text-[#ff6b2b] uppercase tracking-[0.15em] transition-colors flex items-center gap-1"
                title="Command palette (Ctrl+K)"
              >
                <Command className="size-3" />
                <span className="hidden sm:inline">Cmd</span>
              </button>
              <button
                onClick={() => {
                  shareURL();
                  setCopiedUrl(true);
                  setTimeout(() => setCopiedUrl(false), 2000);
                }}
                className="text-[10px] font-[family-name:var(--font-ibm-mono)] text-[#666666] hover:text-[#ff6b2b] uppercase tracking-[0.15em] transition-colors flex items-center gap-1"
                title="Share URL with current state"
              >
                {copiedUrl ? <Link2 className="size-3 text-[#4ade80]" /> : <Share2 className="size-3" />}
                <span className="hidden sm:inline">{copiedUrl ? 'Copied' : 'Share'}</span>
              </button>
              <button
                onClick={toggleAll}
                className="text-[10px] font-[family-name:var(--font-ibm-mono)] text-[#8a8a8a] hover:text-[#ff6b2b] uppercase tracking-[0.15em] transition-colors"
              >
                {expandedTasks.size === TASKS.length ? "Collapse" : "Expand"}
              </button>
              <div className="hidden sm:flex items-center gap-2">
                <span className="text-[10px] font-[family-name:var(--font-ibm-mono)] text-[#4ade80] uppercase tracking-[0.15em] shrink-0">
                  Reviewed {reviewedCount}/{TASKS.length}
                </span>
                <span className="text-[10px] font-[family-name:var(--font-ibm-mono)] text-[#666666]">·</span>
                {/* Accent color switcher */}
                <div className="flex items-center gap-1">
                  {ACCENT_COLORS.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => setActiveAccent(c.value)}
                      className="accent-swatch hover-glow"
                      style={{ background: c.value, '--swatch-size': '12px' } as React.CSSProperties}
                      title={c.name}
                      aria-label={`Switch to ${c.name} accent`}
                    >
                      {activeAccent === c.value && <span className="accent-swatch-active" />}
                    </button>
                  ))}
                </div>
                <span className="text-[10px] font-[family-name:var(--font-ibm-mono)] text-[#666666]">·</span>
                {/* Achievement count */}
                {earnedAchievements.size > 0 && (
                  <span className="text-[10px] font-[family-name:var(--font-ibm-mono)] text-[#fbbf24] uppercase tracking-[0.15em] shrink-0">
                    <Medal className="size-2.5 inline mr-0.5" />
                    {earnedAchievements.size}/{ACHIEVEMENTS.length}
                  </span>
                )}
                <span className="text-[10px] font-[family-name:var(--font-ibm-mono)] text-[#666666]">·</span>
                <span className="text-[10px] font-[family-name:var(--font-ibm-mono)] text-[#8a8a8a] uppercase tracking-[0.15em] shrink-0">
                  5 tasks · rust
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ─── BREADCRUMB TRAIL ─── */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 border-t border-[#1c1c1c]">
          <div className="flex items-center gap-1.5 py-1">
            <button
              onClick={() => scrollTo("hero")}
              className="text-[9px] font-[family-name:var(--font-ibm-mono)] text-[#666666] hover:text-[#8a8a8a] transition-colors uppercase tracking-[0.1em]"
            >
              PERF LAB
            </button>
            <span className="text-[9px] font-[family-name:var(--font-ibm-mono)] text-[#666666]">&gt;</span>
            {getBreadcrumbSection() !== "OVERVIEW" && (
              <button
                onClick={() => scrollTo(
                  activeSection.startsWith("task-") ? "hero" : activeSection
                )}
                className="text-[9px] font-[family-name:var(--font-ibm-mono)] text-[#8a8a8a] hover:text-[#d4d4d4] transition-colors uppercase tracking-[0.1em]"
              >
                {getBreadcrumbSection()}
              </button>
            )}
            {getBreadcrumbSection() !== "OVERVIEW" && (
              <span className="text-[9px] font-[family-name:var(--font-ibm-mono)] text-[#666666]">&gt;</span>
            )}
            <span className="text-[9px] font-[family-name:var(--font-ibm-mono)] text-[#8a8a8a] uppercase tracking-[0.1em]">
              {getBreadcrumbLabel()}
            </span>
          </div>
        </div>
      </header>

      {/* ─── MAIN ─── */}
      <main className="flex-1 mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-8 space-y-10 section-rail">
        {/* ═══ HERO SECTION ═══ */}
        <section ref={registerSection("hero")} id="hero">
          {/* Terminal status bar */}
          <div className="terminal-bar px-4 py-1.5 flex items-center gap-3 border border-[#262626] border-b-0">
            <span className="size-1.5 rounded-full bg-[#4ade80] pulse-dot" />
            <span className="font-[family-name:var(--font-ibm-mono)]">
              <span className="typing-text text-[#8a8a8a]">&gt; system.init() | rust v1.78.0 | 5 tasks loaded | status: operational</span>
            </span>
            <div className="ml-auto flex items-center gap-2">
              <span className="text-[10px] font-[family-name:var(--font-ibm-mono)] text-[#8a8a8a]">{currentTime}</span>
              <div className="signal-strength">
                <div className="signal-bar" />
                <div className="signal-bar" />
                <div className="signal-bar" />
                <div className="signal-bar" />
              </div>
              <span className="text-[8px] font-[family-name:var(--font-ibm-mono)] text-[#666666]">SIG</span>
            </div>
          </div>

          <FadeIn>
            <div className="relative overflow-hidden bg-[#141414] border border-[#262626] border-t-0 border-l-2 border-l-[#ff6b2b] p-6 sm:p-8 scanline vignette matrix-grid">
              {/* Decorative data-stream lines */}
              <div aria-hidden="true" className="data-stream" style={{ left: "15%", height: "120px", animationDelay: "0s" }} />
              <div aria-hidden="true" className="data-stream" style={{ left: "55%", height: "80px", animationDelay: "2.5s" }} />
              <div aria-hidden="true" className="data-stream" style={{ left: "85%", height: "100px", animationDelay: "5s" }} />

              {/* Ambient Particles */}
              <div aria-hidden="true"><AmbientParticles /></div>

              <div className="space-y-6 relative z-10">
                <div>
                  <h1 className="text-2xl sm:text-4xl lg:text-5xl font-bold text-[#d4d4d4] tracking-wider uppercase cursor-blink flicker glitch-hover text-gradient">
                    Performance Lab
                  </h1>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="size-1.5 rounded-full bg-[#4ade80] pulse-dot" />
                    <p className="text-xs font-[family-name:var(--font-ibm-mono)] text-[#8a8a8a]">
                      5 задач на высокопроизводительный код
                    </p>
                  </div>
                  <p className="text-sm text-[#8a8a8a] max-w-2xl leading-relaxed mt-4">
                    Каждый challenge — реальная задача системного программирования. Naive
                    vs Optimized подход на Rust с анализом Big O, бенчмарками и
                    объяснением каждой оптимизации.
                  </p>
                  {/* Keyboard shortcut hints */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <kbd className="text-[9px] font-[family-name:var(--font-ibm-mono)] text-[#666666] bg-[#0f0f0f] border border-[#262626] px-1.5 py-0.5">Ctrl+K</kbd>
                    <span className="text-[10px] text-[#666666]">Command palette</span>
                    <kbd className="text-[9px] font-[family-name:var(--font-ibm-mono)] text-[#666666] bg-[#0f0f0f] border border-[#262626] px-1.5 py-0.5">?</kbd>
                    <span className="text-[10px] text-[#666666]">Shortcuts</span>
                    <kbd className="text-[9px] font-[family-name:var(--font-ibm-mono)] text-[#666666] bg-[#0f0f0f] border border-[#262626] px-1.5 py-0.5">E</kbd>
                    <span className="text-[10px] text-[#666666]">Expand all</span>
                    <kbd className="text-[9px] font-[family-name:var(--font-ibm-mono)] text-[#666666] bg-[#0f0f0f] border border-[#262626] px-1.5 py-0.5">1-5</kbd>
                    <span className="text-[10px] text-[#666666]">Jump to task</span>
                  </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-[#262626] border border-[#262626]">
                  {[
                    { val: "5", label: "Tasks", isCounter: true },
                    { val: TOTAL_SPEEDUP.toFixed(0), label: "Total speedup", suffix: "×", isCounter: true },
                    { val: `${MEM_IMPROVED_COUNT}/${TASKS.length}`, label: "Memory improved", isCounter: false },
                    { val: "Rust", label: "Language", isCounter: false },
                  ].map((s, i) => (
                    <div key={i} className="px-4 py-3 text-center">
                      <p className="text-4xl sm:text-5xl font-bold font-[family-name:var(--font-ibm-mono)] text-[#d4d4d4] [text-shadow:0_0_8px_rgba(255,107,43,0.3)] stat-hero stat-counter-glow">
                        {s.isCounter ? (
                          <AnimatedCounter value={s.val} suffix={s.suffix || ""} />
                        ) : (
                          s.val
                        )}
                      </p>
                      <p className="text-[10px] font-[family-name:var(--font-ibm-mono)] text-[#8a8a8a] uppercase tracking-widest mt-0.5">
                        {s.label}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Quick Stats row */}
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-[10px] font-[family-name:var(--font-ibm-mono)] text-[#666666] uppercase tracking-widest">Quick Stats</span>
                  <span className="text-[10px] font-[family-name:var(--font-ibm-mono)] text-[#8a8a8a] bg-[#0f0f0f] border border-[#262626] px-2 py-0.5 tabular-nums">
                    min {MIN_SPEEDUP.toFixed(1)}×
                  </span>
                  <span className="text-[10px] font-[family-name:var(--font-ibm-mono)] text-[#8a8a8a] bg-[#0f0f0f] border border-[#262626] px-2 py-0.5 tabular-nums">
                    max {MAX_SPEEDUP.toFixed(1)}×
                  </span>
                  <span className="text-[10px] font-[family-name:var(--font-ibm-mono)] text-[#8a8a8a] bg-[#0f0f0f] border border-[#262626] px-2 py-0.5 tabular-nums">
                    avg {AVG_SPEEDUP.toFixed(1)}×
                  </span>
                  {reviewedCount > 0 && (
                    <span className="text-[10px] font-[family-name:var(--font-ibm-mono)] text-[#4ade80] bg-[#4ade80]/5 border border-[#4ade80]/20 px-2 py-0.5">
                      reviewed {reviewedCount}/{TASKS.length}
                    </span>
                  )}
                </div>

                {/* Progress Timeline */}
                {reviewedCount > 0 && (
                  <div className="p-4 border border-[#262626] bg-[#0f0f0f]">
                    <div className="flex items-center gap-2 mb-3">
                      <Trophy className="size-3.5 text-[#ff6b2b]" />
                      <span className="text-[10px] font-[family-name:var(--font-ibm-mono)] text-[#8a8a8a] uppercase tracking-widest">
                        Progress Timeline
                      </span>
                      <span className="ml-auto text-[9px] font-[family-name:var(--font-ibm-mono)] text-[#4ade80] uppercase">
                        {reviewedCount}/{TASKS.length}
                      </span>
                    </div>
                    <ActivityTimeline tasks={TASKS} reviewedTasks={reviewedTasks} />
                  </div>
                )}

                {/* Task quick links — staggered animation */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                  {TASKS.map((t, idx) => {
                    const TIcon = t.icon;
                    const sp = (t.baseline.time / t.optimized.time).toFixed(1);
                    return (
                      <div key={t.id} className="relative">
                        <motion.button
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2, delay: 0.1 + idx * 0.05 }}
                          onClick={() => scrollTo(`task-${t.id}`)}
                          onPointerEnter={(e) => {
                            setHoveredTask(t);
                            setTooltipRect(e.currentTarget.getBoundingClientRect());
                          }}
                          onPointerLeave={() => { setHoveredTask(null); setTooltipRect(null); }}
                          className="w-full bg-[#0f0f0f] p-3 border border-[#262626] hover:border-[#ff6b2b]/30 hover:-translate-y-0.5 transition-all text-left group card-lift hover-bounce ripple-container shimmer-hover"
                        >
                          <div className="flex items-center gap-2 mb-1.5">
                            <div className="tech-category-icon">
                              <TIcon className="size-3 text-[#8a8a8a] group-hover:text-[#ff6b2b] transition-colors" />
                            </div>
                            <span className="text-[10px] font-[family-name:var(--font-ibm-mono)] text-[#8a8a8a]">
                              #{t.id}
                            </span>
                            {reviewedTasks.has(t.id) && <Check className="size-2.5 text-[#4ade80] ml-auto" />}
                          </div>
                          <p className="text-xs text-[#8a8a8a] line-clamp-2 leading-relaxed group-hover:text-[#d4d4d4] transition-colors">
                            {t.title}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <p className="text-sm font-bold text-[#ff6b2b] font-[family-name:var(--font-ibm-mono)]">
                              {sp}×
                            </p>
                            <span className={`text-[9px] font-[family-name:var(--font-ibm-mono)] uppercase border px-1.5 py-0 ${getGrade(parseFloat(sp)).className}`}>
                              {getGrade(parseFloat(sp)).letter}
                            </span>
                          </div>
                        </motion.button>
                        <TaskPreviewTooltip task={t} visible={hoveredTask?.id === t.id} anchorRect={tooltipRect} />
                      </div>
                    );
                  })}
                </div>

                {/* Reset Progress */}
                {reviewedCount > 0 && (
                  <button
                    onClick={resetProgress}
                    className="flex items-center gap-1.5 text-[10px] font-[family-name:var(--font-ibm-mono)] text-[#666666] hover:text-[#f87171] uppercase tracking-[0.15em] transition-colors"
                  >
                    <RotateCcw className="size-3" />
                    Reset Progress
                  </button>
                )}
              </div>
            </div>
          </FadeIn>
        </section>

        {/* ═══ DIFFICULTY FILTER PILLS ═══ */}
        <div className="flex items-center gap-2 flex-wrap">
          {difficulties.map((d) => (
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
            onClick={() => setStarredFilter(f => !f)}
            className={`text-[10px] font-[family-name:var(--font-ibm-mono)] uppercase tracking-[0.15em] px-3 py-1.5 border transition-colors flex items-center gap-1 ${
              starredFilter
                ? "text-[#fbbf24] border-[#fbbf24]/30"
                : "text-[#8a8a8a] border-[#262626] hover:text-[#8a8a8a]"
            }`}
          >
            <Star className="size-3" fill={starredFilter ? '#fbbf24' : 'none'} />
            Starred ({starredTasks.size})
          </button>
        </div>

        {/* ═══ TECHNIQUE SEARCH BAR ═══ */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-[#666666]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setTechniqueTag(null); }}
            placeholder="Search techniques, titles, or descriptions..."
            className="search-industrial search-glow w-full pl-9 pr-16"
          />
          {activeSearch.trim() && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-[family-name:var(--font-ibm-mono)] text-[#8a8a8a]">
              {filteredTasks.length} match{filteredTasks.length !== 1 ? "es" : ""}
            </span>
          )}
        </div>

        {/* ═══ TASK SECTIONS ═══ */}
        <div className="space-y-6">
          {filteredTasks.length === 0 ? (
            <FadeIn>
              <div className="text-center py-16 border border-[#262626] bg-[#141414]">
                <Search className="size-8 text-[#666666] mx-auto mb-3" />
                <p className="text-xs font-[family-name:var(--font-ibm-mono)] text-[#8a8a8a] uppercase tracking-widest mb-1">No Matches</p>
                <p className="text-xs text-[#666666]">Try a different search query</p>
              </div>
            </FadeIn>
          ) : (
            filteredTasks.map((task, sectionIndex) => (
              <div key={task.id}>
                <TaskSection
                  task={task}
                  expanded={expandedTasks.has(task.id)}
                  onToggle={() => toggleTask(task.id)}
                  compareMode={compareMode}
                  onToggleCompare={() => setCompareMode(c => !c)}
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
                  noteText={(() => { try { return JSON.parse(taskNotes || '{}')[String(task.id)] || ''; } catch { return ''; } })()}
                  onToggleNote={() => setNoteOpenTask(n => n === task.id ? null : task.id)}
                  onSaveNote={(text) => {
                    try {
                      const notes = JSON.parse(taskNotes || '{}');
                      if (text.trim()) notes[String(task.id)] = text;
                      else delete notes[String(task.id)];
                      setTaskNotes(JSON.stringify(notes));
                    } catch { /* ignore */ }
                  }}
                />
                {sectionIndex < filteredTasks.length - 1 && (
                  <SectionDivider label={String(sectionIndex + 1).padStart(2, "0")} />
                )}
              </div>
            ))
          )}
        </div>

        {/* ─── Separator ─── */}
        <SectionDivider label="MT" />

        {/* ═══ METHODOLOGY ═══ */}
        <section ref={registerSection("methodology")} id="methodology">
          <FadeIn>
            <Card className="border border-[#262626] bg-[#141414] border-l-2 border-l-[#ff6b2b] card-industrial ind-dot-grid">
              <CardHeader>
                <CardTitle className="text-xs uppercase tracking-widest text-[#8a8a8a]">
                  Methodology
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                  {[
                    { icon: TrendingUp, title: "Big O оптимизация", desc: "Всегда выбирай минимальную сложность. O(1) > O(log n) > O(n) > O(n²)" },
                    { icon: Database, title: "Кэш-локальность", desc: "Data-Oriented Design: compact arrays, sequential access, AoS vs SoA" },
                    { icon: Layers, title: "Минимизация аллокаций", desc: "Object pooling, arena allocators, pre-allocation, buffer reuse" },
                    { icon: Network, title: "Эффективный I/O", desc: "Async non-blocking I/O, buffering, batching системных вызовов" },
                    { icon: ArrowRightLeft, title: "Lock-free конкурентность", desc: "Atomic operations, ring buffers, CAS вместо mutex" },
                    { icon: Cpu, title: "Zero-cost абстракции", desc: "Inline, generics, monomorphization — абстракции без runtime overhead" },
                    { icon: Grid3x3, title: "SIMD векторизация", desc: "AVX2/AVX-512: 8-16 элементов параллельно в одной инструкции" },
                    { icon: Gauge, title: "Профилирование", desc: "Измеряй, а не гадай. criterion, perf, flamegraph" },
                  ].map((p, i) => {
                    const PIcon = p.icon;
                    return (
                      <div key={i} className="bg-[#0f0f0f] p-3 border border-[#262626] hover:border-[#ff6b2b]/20 transition-colors card-lift">
                        <PIcon className="size-4 text-[#8a8a8a] mb-2" />
                        <p className="text-xs uppercase tracking-wider text-[#d4d4d4] font-medium">
                          {p.title}
                        </p>
                        <p className="text-[10px] text-[#8a8a8a] mt-1 leading-relaxed">
                          {p.desc}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* ── Technique Tag Cloud ── */}
                <div className="mt-4 pt-4 border-t border-[#262626]">
                  <p className="text-[10px] font-[family-name:var(--font-ibm-mono)] text-[#666666] uppercase tracking-[0.2em] mb-2">Technique Tags</p>
                  <div className="flex flex-wrap gap-1.5">
                    {ALL_TECHNIQUES.map((tech) => (
                      <button
                        key={tech.name}
                        onClick={() => {
                          if (techniqueTag === tech.name) {
                            setTechniqueTag(null);
                            setSearchQuery("");
                          } else {
                            setTechniqueTag(tech.name);
                            setSearchQuery(tech.name);
                          }
                        }}
                        className={`chip-industrial ${techniqueTag === tech.name ? 'active' : ''}`}
                      >
                        {tech.name}
                        <span className="opacity-50">{tech.count}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </FadeIn>
        </section>

        {/* ─── Separator ─── */}
        <SectionDivider label="VB" />

        {/* ═══ VIBE CODER'S GUIDE ═══ */}
        <section ref={registerSection("vibe-coder")} id="vibe-coder">
          <FadeIn>
            <Card className="border border-[#262626] bg-[#141414] border-l-2 border-l-[#fbbf24] card-industrial">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Sparkles className="size-3.5 text-[#fbbf24]" />
                  <CardTitle className="text-xs uppercase tracking-widest text-[#8a8a8a]">
                    Vibe Coder&apos;s Guide
                  </CardTitle>
                </div>
                <p className="text-[10px] text-[#666666] font-[family-name:var(--font-ibm-mono)] mt-1">
                  Как перевести 5 задач с языка «ментального расстройства Rust-разработчика» на язык «комфортного веб-разработчика»
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Warning banner */}
                <div className="flex items-start gap-2 p-3 bg-[#fbbf24]/5 border border-[#fbbf24]/20 warning-stripe">
                  <AlertTriangle className="size-3.5 text-[#fbbf24] shrink-0 mt-0.5" />
                  <div className="text-[10px] text-[#fbbf24] leading-relaxed font-[family-name:var(--font-ibm-mono)]">
                    <p className="font-bold uppercase tracking-widest mb-1">Осторожно: мины замедленного действия</p>
                    <p>Задача 2 (CSV): Box::leak(mmap...) — утечка памяти. Задача 5 (Lock-free): unsafe impl Send/Sync — если ошибётесь хотя бы в одном Ordering, получите «призрачные» баги раз в месяц.</p>
                  </div>
                </div>

                {/* Vibe Coder Mantra */}
                <div className="p-4 bg-[#0f0f0f] border border-[#262626] border-l-2 border-l-[#fbbf24]">
                  <p className="text-xs text-[#d4d4d4] font-medium mb-1 font-[family-name:var(--font-ibm-mono)] quote-glow">
                    &quot;Все эти оптимизации уже написаны грустными людьми на Rust и C++. Моя задача — найти их npm-пакет и импортировать.&quot;
                  </p>
                  <p className="text-[9px] text-[#666666] uppercase tracking-widest font-[family-name:var(--font-ibm-mono)]">— Мантра вайб-кодера на 2026</p>
                </div>

                {/* 5 task translations */}
                <div className="space-y-3">
                  {[
                    {
                      id: 1,
                      vibe: 'array.filter((v, i, a) => a.indexOf(v) === i) или new Set(data)',
                      doc: 'Не создавай 10 миллионов строк в памяти!',
                      tip: 'В JavaScript строки иммутабельны. Просто используй базу данных: SELECT column, COUNT(*) FROM table GROUP BY column HAVING COUNT(*) > 1. Пусть Postgres страдает.',
                      color: '#ff6b2b',
                    },
                    {
                      id: 2,
                      vibe: 'Загружу файл в multer, прогоню через Papa Parse, отдам JSON',
                      doc: 'Не загружай всё в RAM! Делай zero-copy и SIMD!',
                      tip: '500 МБ CSV → JSON на Node.js = FATAL ERROR: CALL_AND_RETRY_LAST Allocation failed. Используй Streams API или csv-parse. А для анализа — DuckDB одной SQL-командой.',
                      color: '#f87171',
                    },
                    {
                      id: 3,
                      vibe: 'Promise.all(urls.map(url => fetch(url))) и пойду за кофе',
                      doc: 'Сделай семафор, настрой пул соединений, иначе упадёшь!',
                      tip: '100K запросов = EMFILE (too many open files) или socket hang up + бан за DDoS. Ставь p-limit: const limit = pLimit(100); await Promise.all(urls.map(url => limit(() => fetch(url)))).',
                      color: '#a78bfa',
                    },
                    {
                      id: 4,
                      vibe: 'Зачем мне это? Я делаю CRM на React',
                      doc: 'Кэшируй тайлы, разворачивай циклы!',
                      tip: 'Никогда не пиши математику на JS/TS. Подключай библиотеку на C++/Rust/WASM (numpy, tensorflow.js, mathjs). Передавай данные и смотри в стену.',
                      color: '#38bdf8',
                    },
                    {
                      id: 5,
                      vibe: 'Создам таблицу jobs со статусом pending в Prisma',
                      doc: 'Избегай Mutex, делай Cache-padding!',
                      tip: 'В вебе очереди в RAM не живут (сервер перезапустится — всё умрёт). Используй BullMQ (Node.js) или SQS/RabbitMQ. Они написаны на C и решили все проблемы.',
                      color: '#4ade80',
                    },
                  ].map((item) => (
                    <div key={item.id} className="group p-3 bg-[#0f0f0f] border border-[#262626] hover:border-[#262626] transition-colors vibe-card" style={{ '--vibe-color': item.color } as React.CSSProperties}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-[family-name:var(--font-ibm-mono)] font-bold px-1.5 py-0 border" style={{ color: item.color, borderColor: `${item.color}30` }}>
                          #{item.id}
                        </span>
                        <span className="text-[9px] font-[family-name:var(--font-ibm-mono)] text-[#666666] uppercase tracking-widest">Задача {item.id}</span>
                      </div>
                      {/* Vibe coder thinks */}
                      <div className="mb-2 pl-3 border-l-2 border-[#262626]">
                        <p className="text-[9px] font-[family-name:var(--font-ibm-mono)] text-[#8a8a8a] uppercase tracking-wider mb-0.5">Вайб кодер думает:</p>
                        <code className="vibe-code">{item.vibe}</code>
                      </div>
                      {/* Document says */}
                      <div className="mb-2 pl-3 border-l-2" style={{ borderColor: `${item.color}40` }}>
                        <p className="text-[9px] font-[family-name:var(--font-ibm-mono)] uppercase tracking-wider mb-0.5" style={{ color: item.color }}>Документ говорит:</p>
                        <p className="text-[10px] text-[#d4d4d4]">{item.doc}</p>
                      </div>
                      {/* Vibe tip */}
                      <div className="pl-3 border-l-2 border-[#fbbf24]/30 bg-[#fbbf24]/5 -mx-3 px-6 py-2 tip-callout">
                        <p className="text-[9px] font-[family-name:var(--font-ibm-mono)] text-[#fbbf24] uppercase tracking-wider mb-0.5">Выжимка →</p>
                        <p className="text-[10px] text-[#d4d4d4] leading-relaxed">{item.tip}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Quick reference table */}
                <div className="overflow-x-auto custom-scrollbar">
                  <div className="text-[9px] font-[family-name:var(--font-ibm-mono)] text-[#666666] uppercase tracking-widest mb-2">Quick Reference: Rust → Web</div>
                  <table className="w-full text-[10px]">
                    <thead>
                      <tr className="border-b border-[#262626]">
                        <th className="text-left py-1.5 pr-3 text-[#8a8a8a] font-[family-name:var(--font-ibm-mono)]">Rust Concept</th>
                        <th className="text-left py-1.5 pr-3 text-[#8a8a8a] font-[family-name:var(--font-ibm-mono)]">Web Equivalent</th>
                        <th className="text-left py-1.5 text-[#8a8a8a] font-[family-name:var(--font-ibm-mono)]">npm Package</th>
                      </tr>
                    </thead>
                    <tbody className="font-[family-name:var(--font-ibm-mono)]">
                      {[
                        { rust: 'String Interning', web: 'Cache / Memoization', pkg: 'lru-cache, memoizee' },
                        { rust: 'Memory-mapped I/O', web: 'File Streams', pkg: 'fs.createReadStream, csv-parse' },
                        { rust: 'SIMD memchr', web: 'WASM / Native Addons', pkg: '@napi-rs/canvas, WASM modules' },
                        { rust: 'Semaphore / Backpressure', web: 'Concurrency Limit', pkg: 'p-limit, bottleneck' },
                        { rust: 'Connection Pooling', web: 'HTTP Agent / Keep-alive', pkg: 'undici, got (built-in pool)' },
                        { rust: 'Cache Tiling', web: 'OffscreenCanvas / WebWorker', pkg: 'comlink, GPU.js' },
                        { rust: 'Lock-free CAS', web: 'Message Queue', pkg: 'BullMQ, RabbitMQ, SQS' },
                        { rust: 'Cache-line Padding', web: 'Worker Threads isolation', pkg: 'worker_threads, piscina' },
                      ].map((row, i) => (
                        <tr key={i} className="border-b border-[#1c1c1c] vibe-row">
                          <td className="py-1.5 pr-3 text-[#8a8a8a]">{row.rust}</td>
                          <td className="py-1.5 pr-3 text-[#d4d4d4]">{row.web}</td>
                          <td className="py-1.5 text-[#ff6b2b]">{row.pkg}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Final rule */}
                <div className="p-3 bg-[#ff6b2b]/5 border border-[#ff6b2b]/20">
                  <p className="text-[10px] text-[#d4d4d4] leading-relaxed font-[family-name:var(--font-ibm-mono)]">
                    <span className="text-[#ff6b2b] font-bold uppercase tracking-wider">Единственное правило:</span> Если твой Array.prototype.map().filter().reduce() на 50K элементов фризит фронтенд на секунду — вспомни Задачу 1 и 4. Не делай эту работу в JS. Отдай на бэк или в Web Worker.
                  </p>
                </div>
              </CardContent>
            </Card>
          </FadeIn>
        </section>

        {/* ─── Separator ─── */}
        <SectionDivider label="RS" />

        {/* ═══ OPTIMIZATION HEATMAP ═══ */}
        <section ref={registerSection("heatmap")} id="heatmap">
          <FadeIn>
            <Card className="border border-[#262626] bg-[#141414] border-l-2 border-l-[#a78bfa] card-industrial card-lift">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Waypoints className="size-3.5 text-[#a78bfa]" />
                  <CardTitle className="text-xs uppercase tracking-widest text-[#8a8a8a]">
                    Optimization Impact Heatmap
                  </CardTitle>
                </div>
                <p className="text-[10px] text-[#666666] font-[family-name:var(--font-ibm-mono)] mt-1">
                  Multi-dimensional task analysis — intensity shows relative optimization impact (0–100)
                </p>
              </CardHeader>
              <CardContent>
                <OptimizationHeatmap />
                {/* Legend */}
                <div className="flex items-center gap-3 mt-3 pt-3 border-t border-[#262626]">
                  <span className="text-[8px] font-[family-name:var(--font-ibm-mono)] text-[#666666] uppercase tracking-widest">Low</span>
                  <div className="flex gap-px">
                    {[0.1, 0.3, 0.5, 0.7, 0.9].map((v) => (
                      <div key={v} className="w-5 h-3 heatmap-cell" style={{ '--heat': v } as React.CSSProperties} />
                    ))}
                  </div>
                  <span className="text-[8px] font-[family-name:var(--font-ibm-mono)] text-[#666666] uppercase tracking-widest">High</span>
                </div>
              </CardContent>
            </Card>
          </FadeIn>
        </section>

        {/* ─── Separator ─── */}
        <SectionDivider label="DB" />

        {/* ═══ DASHBOARD SECTION ═══ */}
        <section ref={registerSection("dashboard")} id="dashboard">
          <FadeIn>
            <Card className="bg-[#141414] border border-[#262626] card-industrial card-lift">
              <CardHeader>
                <CardTitle className="text-xs uppercase tracking-widest text-[#8a8a8a]">
                  <BarChart className="size-3 inline mr-1.5 text-[#ff6b2b]" />
                  Dashboard
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {(() => {
                    const totalLines = TASKS.reduce((a, t) => a + t.optimized.code.split('\n').length, 0);
                    const allTechniques = new Set(TASKS.flatMap(t => t.techniques.map(tp => tp.name)));
                    const bestTask = TASKS.reduce((best, t) => (t.baseline.time / t.optimized.time) > (best.baseline.time / best.optimized.time) ? t : best);
                    const bestSp = (bestTask.baseline.time / bestTask.optimized.time).toFixed(1);
                    const complexityReduced = TASKS.filter(t => {
                      const bo = (t.baseline.timeComplexity || '').replace(/[O()]/g, '').trim();
                      const oo = (t.optimized.timeComplexity || '').replace(/[O()]/g, '').trim();
                      return oo.length > 0 && bo.length > 0 && oo.length < bo.length;
                    }).length;
                    return [
                      { label: 'Lines Optimized', value: totalLines, suffix: 'lines', color: '#ff6b2b' },
                      { label: 'Techniques Used', value: allTechniques.size, suffix: 'unique', color: '#4ade80' },
                      { label: 'Avg Speedup', value: AVG_SPEEDUP.toFixed(1), suffix: '×', color: '#ff6b2b' },
                      { label: 'Best Improvement', value: `#${bestTask.id}`, suffix: `${bestSp}×`, color: '#fbbf24' },
                      { label: 'Total Time Saved', value: TOTAL_TIME_SAVED >= 1000 ? `${(TOTAL_TIME_SAVED / 1000).toFixed(1)}s` : `${TOTAL_TIME_SAVED.toFixed(0)}ms`, suffix: '', color: '#4ade80' },
                      { label: 'Complexity Reduced', value: `${complexityReduced}/${TASKS.length}`, suffix: 'tasks', color: '#ff6b2b' },
                    ];
                  })().map((stat, i) => (
                    <div key={i} className="bg-[#0d0d0d] border border-[#262626] p-3 stat-card-hover">
                      <p className="text-[8px] font-[family-name:var(--font-ibm-mono)] text-[#666666] uppercase tracking-widest mb-1">{stat.label}</p>
                      <p className="text-xl font-bold font-[family-name:var(--font-ibm-mono)]" style={{ color: stat.color }}>{stat.value}</p>
                      {stat.suffix && <p className="text-[9px] font-[family-name:var(--font-ibm-mono)] text-[#8a8a8a] mt-0.5">{stat.suffix}</p>}
                    </div>
                  ))}
                </div>
                {/* Technique distribution bar */}
                <div className="mt-4 pt-4 border-t border-[#262626]">
                  <p className="text-[8px] font-[family-name:var(--font-ibm-mono)] text-[#666666] uppercase tracking-widest mb-2">Speedup Distribution</p>
                  <div className="flex items-end gap-1.5 h-12">
                    {TASKS.map((t) => {
                      const sp = t.baseline.time / t.optimized.time;
                      const maxSp = MAX_SPEEDUP;
                      const height = Math.max(8, (sp / maxSp) * 100);
                      return (
                        <div key={t.id} className="flex-1 flex flex-col items-center gap-1">
                          <span className="text-[8px] font-[family-name:var(--font-ibm-mono)] text-[#ff6b2b]">{sp.toFixed(1)}×</span>
                          <div className="w-full bg-[#ff6b2b]/10 relative" style={{ height: `${height}%` }}>
                            <div className="absolute inset-0 bg-[#ff6b2b]/40 hover:bg-[#ff6b2b]/60 transition-colors" />
                          </div>
                          <span className="text-[7px] font-[family-name:var(--font-ibm-mono)] text-[#666666]">#{t.id}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </FadeIn>
        </section>

        {/* ─── Separator ─── */}
        <SectionDivider label="RT" />

        {/* ═══ RESULTS TABLE ═══ */}
        <section ref={registerSection("results")} id="results">
          <FadeIn>
            <Card className="bg-[#141414] border border-[#262626] card-industrial card-lift">
              <CardHeader>
                <CardTitle className="text-xs uppercase tracking-widest text-[#8a8a8a]">
                  Results
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#262626]">
                        <th className="text-left py-2 pr-4 text-[#8a8a8a] sort-header" onClick={() => handleSort("id")} aria-sort={sortColumn === "id" ? (sortDirection === "asc" ? "ascending" : "descending") : "none"}>
                          # <SortIcon col="id" activeCol={sortColumn} direction={sortDirection} />
                        </th>
                        <th className="text-left py-2 pr-4 text-[#8a8a8a]">Task</th>
                        <th className="text-right py-2 px-3 text-[#8a8a8a] sort-header" onClick={() => handleSort("baseline")} aria-sort={sortColumn === "baseline" ? (sortDirection === "asc" ? "ascending" : "descending") : "none"}>
                          Baseline <SortIcon col="baseline" activeCol={sortColumn} direction={sortDirection} />
                        </th>
                        <th className="text-right py-2 px-3 text-[#8a8a8a] sort-header" onClick={() => handleSort("optimized")} aria-sort={sortColumn === "optimized" ? (sortDirection === "asc" ? "ascending" : "descending") : "none"}>
                          Optimized <SortIcon col="optimized" activeCol={sortColumn} direction={sortDirection} />
                        </th>
                        <th className="text-right py-2 px-3 text-[#8a8a8a] sort-header" onClick={() => handleSort("speedup")} aria-sort={sortColumn === "speedup" ? (sortDirection === "asc" ? "ascending" : "descending") : "none"}>
                          Speedup <SortIcon col="speedup" activeCol={sortColumn} direction={sortDirection} />
                        </th>
                        <th className="text-right py-2 text-[#8a8a8a] sort-header" onClick={() => handleSort("memory")} aria-sort={sortColumn === "memory" ? (sortDirection === "asc" ? "ascending" : "descending") : "none"}>
                          Memory <SortIcon col="memory" activeCol={sortColumn} direction={sortDirection} />
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedTasks.map((t) => {
                        const sp = (t.baseline.time / t.optimized.time).toFixed(1);
                        const ms = ((1 - t.optimized.memory / t.baseline.memory) * 100).toFixed(0);
                        const memImproved = t.optimized.memory < t.baseline.memory;
                        const formatT = formatMs;
                        return (
                          <tr
                            key={t.id}
                            className="border-b border-[#1c1c1c] hover:bg-[#0f0f0f] transition-colors row-stripe"
                          >
                            <td className="py-2.5 pr-4">
                              <span className="text-[10px] font-[family-name:var(--font-ibm-mono)] text-[#8a8a8a] tabular-nums">
                                #{t.id}
                              </span>
                            </td>
                            <td className="py-2.5 pr-4 max-w-[200px]">
                              <p className="text-[#8a8a8a] text-xs truncate">{t.title}</p>
                            </td>
                            <td className="py-2.5 px-3 text-right font-[family-name:var(--font-ibm-mono)] text-[#8a8a8a] tabular-nums">
                              {formatT(t.baseline.time)}
                            </td>
                            <td className="py-2.5 px-3 text-right font-[family-name:var(--font-ibm-mono)] text-[#4ade80] tabular-nums">
                              {formatT(t.optimized.time)}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <span className="font-bold font-[family-name:var(--font-ibm-mono)] text-[#ff6b2b] tabular-nums">
                                {sp}×
                              </span>
                            </td>
                            <td className="py-2.5 text-right">
                              <span className={`font-medium font-[family-name:var(--font-ibm-mono)] tabular-nums ${memImproved ? "text-[#4ade80]" : "text-[#f87171]"}`}>
                                {memImproved ? `-` : `+`}{Math.abs(parseInt(ms))}%
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Speedup Chart — pure SVG (no recharts) */}
                <div className="h-[220px] flex items-center justify-center">
                  <svg viewBox="0 0 400 200" className="w-full max-w-[500px]" preserveAspectRatio="xMidYMid meet">
                    {(() => {
                      const items = TASKS.map((t) => ({
                        name: `#${t.id}`,
                        speedup: parseFloat((t.baseline.time / t.optimized.time).toFixed(1)),
                        memory: parseFloat(((1 - t.optimized.memory / t.baseline.memory) * 100).toFixed(0)),
                      }));
                      const maxSpeedup = Math.max(...items.map(i => i.speedup), 1);
                      const maxMem = Math.max(...items.map(i => Math.abs(i.memory)), 1);
                      const leftPad = 40;
                      const barGroupH = 34;
                      const gap = 6;
                      const barH = 14;
                      const chartW = 300;
                      const chartH = items.length * barGroupH;
                      // Vertical grid lines
                      const gridLines = [0.25, 0.5, 0.75, 1];
                      return (
                        <>
                          {gridLines.map(p => (
                            <line key={p} x1={leftPad + chartW * p} y1={5} x2={leftPad + chartW * p} y2={chartH + 5} stroke="#1c1c1c" strokeWidth={1} />
                          ))}
                          {/* X axis label for max speedup */}
                          <text x={leftPad + chartW} y={chartH + 20} textAnchor="end" fill="#525252" fontSize={9} fontFamily="var(--font-ibm-mono), monospace">{maxSpeedup.toFixed(0)}×</text>
                          <text x={leftPad} y={chartH + 20} textAnchor="start" fill="#525252" fontSize={9} fontFamily="var(--font-ibm-mono), monospace">0</text>
                          {items.map((item, i) => {
                            const y = i * barGroupH;
                            const speedupW = (item.speedup / maxSpeedup) * chartW;
                            const memW = (Math.abs(item.memory) / maxMem) * chartW;
                            return (
                              <g key={i}>
                                <text x={leftPad - 6} y={y + barGroupH / 2} textAnchor="end" dominantBaseline="middle" fill="#525252" fontSize={10} fontFamily="var(--font-ibm-mono), monospace">{item.name}</text>
                                {/* Speedup bar */}
                                <rect x={leftPad} y={y} width={Math.max(speedupW, 1)} height={barH} fill="#ff6b2b" rx={0} />
                                <text x={leftPad + speedupW + 4} y={y + barH / 2} dominantBaseline="middle" fill="#d4d4d4" fontSize={9} fontFamily="var(--font-ibm-mono), monospace">{item.speedup}×</text>
                                {/* Memory bar */}
                                <rect x={leftPad} y={y + barH + 3} width={Math.max(memW, 1)} height={barH} fill={item.memory >= 0 ? "#4ade80" : "#f87171"} rx={0} />
                                <text x={leftPad + memW + 4} y={y + barH + 3 + barH / 2} dominantBaseline="middle" fill={item.memory >= 0 ? "#4ade80" : "#f87171"} fontSize={9} fontFamily="var(--font-ibm-mono), monospace">{item.memory > 0 ? `−${item.memory}%` : `${item.memory}%`}</text>
                              </g>
                            );
                          })}
                          {/* Legend */}
                          <rect x={leftPad} y={chartH + 30} width={8} height={8} fill="#ff6b2b" />
                          <text x={leftPad + 12} y={chartH + 37} fill="#525252" fontSize={9} fontFamily="var(--font-ibm-mono), monospace">Speedup (×)</text>
                          <rect x={leftPad + 100} y={chartH + 30} width={8} height={8} fill="#4ade80" />
                          <text x={leftPad + 112} y={chartH + 37} fill="#525252" fontSize={9} fontFamily="var(--font-ibm-mono), monospace">Memory save (%)</text>
                        </>
                      );
                    })()}
                  </svg>
                </div>
              </CardContent>
            </Card>
          </FadeIn>
        </section>

        {/* ─── RADAR CHART ─── */}
        <FadeIn>
          <Card className="bg-[#141414] border border-[#262626] card-industrial card-lift">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs uppercase tracking-widest text-[#8a8a8a]">
                Multi-dimensional Comparison
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RadarChart tasks={TASKS} />
            </CardContent>
          </Card>
        </FadeIn>

        {/* ─── Separator ─── */}
        <SectionDivider label="SM" />

        {/* ═══ SUMMARY ═══ */}
        <section ref={registerSection("summary")} id="summary">
          <FadeIn>
            <Card className="border border-[#262626] bg-[#141414] border-l-2 border-l-[#ff6b2b] card-industrial card-lift">
              <CardHeader>
                <CardTitle className="text-xs uppercase tracking-widest text-[#8a8a8a]">
                  Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                  {TASKS.map((t, idx) => {
                    const sp = (t.baseline.time / t.optimized.time).toFixed(1);
                    return (
                      <motion.div
                        key={t.id}
                        initial={{ opacity: 0, y: 12 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.3, delay: idx * 0.1 }}
                      >
                      <div
                        key={t.id}
                        className="text-center p-3 bg-[#0f0f0f] border border-[#262626]"
                      >
                        <p className="text-xl font-bold text-[#ff6b2b] font-[family-name:var(--font-ibm-mono)] tabular-nums">
                          {sp}×
                        </p>
                        <p className="text-[10px] text-[#8a8a8a] font-[family-name:var(--font-ibm-mono)] uppercase tracking-widest mt-1">
                          #{t.id}
                        </p>
                        <div className="mt-2">
                          <AnimatedProgressBar value={parseFloat(sp)} max={MAX_SPEEDUP} />
                        </div>
                      </div>
                      </motion.div>
                    );
                  })}
                </div>
                <div className="mt-4 bg-[#1c1c1c] p-4 border border-[#262626]">
                  <p className="text-sm text-[#8a8a8a] leading-relaxed">
                    <span className="font-semibold text-[#d4d4d4]">8 принципов high-performance кода:</span>{" "}
                    Big O оптимизация → Кэш-локальность (Data-Oriented Design) →
                    Минимизация аллокаций → Async I/O → Lock-free конкурентность →
                    Zero-cost абстракции → SIMD векторизация → Профилирование
                    («Измеряй, а не гадай»).
                  </p>
                  <div className="flex items-center gap-4 mt-3">
                    <div className="flex items-center gap-2">
                      <Zap className="size-3.5 text-[#ff6b2b]" />
                      <span className="text-xs text-[#8a8a8a] font-[family-name:var(--font-ibm-mono)]">
                        Total speedup:{" "}
                        <span className="text-[var(--accent-color,#ff6b2b)] font-bold neon-text">
                          {TOTAL_SPEEDUP.toFixed(0)}×
                        </span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MemoryStick className="size-3.5 text-[#4ade80]" />
                      <span className="text-xs text-[#8a8a8a] font-[family-name:var(--font-ibm-mono)]">
                        Memory improved:{" "}
                        <span className="text-[#4ade80] font-bold">
                          {MEM_IMPROVED_COUNT}/{TASKS.length}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </FadeIn>
        </section>
      </main>

      {/* ─── PERFORMANCE SUMMARY WIDGET (System Monitor) ─── */}
      <div className="fixed bottom-6 left-6 z-50">
        <AnimatePresence>
          {monitorExpanded && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="bg-[#141414] border border-[#262626] p-4 w-64 mb-2 glass-dark"
            >
              <div className="flex items-center gap-2 mb-3">
                <Monitor className="size-3.5 text-[#ff6b2b]" />
                <span className="text-[10px] font-[family-name:var(--font-ibm-mono)] text-[#8a8a8a] uppercase tracking-widest">System Monitor</span>
              </div>

              {/* Time saved */}
              <div className="metric-card p-3 border border-[#262626] mb-2" style={{ "--metric-color": "#ff6b2b" } as React.CSSProperties}>
                <p className="text-[9px] font-[family-name:var(--font-ibm-mono)] text-[#8a8a8a] uppercase tracking-widest mb-1">Total Time Saved</p>
                <p className="text-lg font-bold text-[#ff6b2b] font-[family-name:var(--font-ibm-mono)] tabular-nums">
                  {formatMs(Math.abs(TOTAL_TIME_SAVED))}
                </p>
              </div>

              {/* Memory saved */}
              <div className="metric-card p-3 border border-[#262626] mb-3" style={{ "--metric-color": TOTAL_MEM_SAVED >= 0 ? "#4ade80" : "#f87171" } as React.CSSProperties}>
                <p className="text-[9px] font-[family-name:var(--font-ibm-mono)] text-[#8a8a8a] uppercase tracking-widest mb-1">Total Memory Delta</p>
                <p className={`text-lg font-bold font-[family-name:var(--font-ibm-mono)] tabular-nums ${TOTAL_MEM_SAVED >= 0 ? "text-[#4ade80]" : "text-[#f87171]"}`}>
                  {TOTAL_MEM_SAVED >= 0 ? "−" : "+"}{Math.abs(TOTAL_MEM_SAVED)} MB
                </p>
              </div>

              {/* Speedup distribution bar chart */}
              <p className="text-[9px] font-[family-name:var(--font-ibm-mono)] text-[#8a8a8a] uppercase tracking-widest mb-2">Speedup Distribution</p>
              <div className="flex items-end gap-1 h-16">
                {TASKS.map((t, i) => {
                  const sp = t.baseline.time / t.optimized.time;
                  const maxSp = MAX_SPEEDUP;
                  const h = (sp / maxSp) * 100;
                  return (
                    <div key={t.id} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-[8px] font-[family-name:var(--font-ibm-mono)] text-[#8a8a8a] tabular-nums">{sp.toFixed(0)}×</span>
                      <div
                        className="w-full bg-[#ff6b2b] min-h-[2px] transition-all duration-300"
                        style={{ height: `${h}%` }}
                      />
                      <span className="text-[7px] font-[family-name:var(--font-ibm-mono)] text-[#666666]">#{t.id}</span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Collapsed indicator dot */}
        <button
          onClick={() => setMonitorExpanded(c => !c)}
          className="size-8 bg-[#141414] border border-[#262626] flex items-center justify-center text-[#8a8a8a] hover:text-[#ff6b2b] hover:border-[#ff6b2b]/30 transition-colors"
          aria-label="Toggle system monitor"
        >
          <Monitor className="size-3.5" />
        </button>
      </div>

      {/* ─── TASK COMPARISON PANEL ─── */}
      {taskCompareMode && compareSelected.size === 2 && (() => {
        const ids = Array.from(compareSelected);
        const tA = TASKS.find(t => t.id === ids[0])!;
        const tB = TASKS.find(t => t.id === ids[1])!;
        const spA = tA.baseline.time / tA.optimized.time;
        const spB = tB.baseline.time / tB.optimized.time;
        const maxSp = Math.max(spA, spB);
        const memA = (1 - tA.optimized.memory / tA.baseline.memory) * 100;
        const memB = (1 - tB.optimized.memory / tB.baseline.memory) * 100;
        const maxMem = Math.max(Math.abs(memA), Math.abs(memB));
        return (
          <div className={`compare-panel custom-scrollbar ${compareSelected.size === 2 ? 'open' : ''}`}>
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-[family-name:var(--font-ibm-mono)] text-[#8a8a8a] uppercase tracking-widest">Task Comparison</span>
                <button
                  onClick={() => { setCompareSelected(new Set()); setTaskCompareMode(false); }}
                  className="text-[#8a8a8a] hover:text-[#ff6b2b] transition-colors"
                >
                  <ChevronUp className="size-4 rotate-90" />
                </button>
              </div>

              {/* Task names */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-[#0f0f0f] border border-[#262626]">
                  <span className="text-[10px] font-[family-name:var(--font-ibm-mono)] text-[#ff6b2b]">#{tA.id}</span>
                  <p className="text-xs text-[#d4d4d4] mt-1 line-clamp-2">{tA.title}</p>
                </div>
                <div className="p-3 bg-[#0f0f0f] border border-[#262626]">
                  <span className="text-[10px] font-[family-name:var(--font-ibm-mono)] text-[#4ade80]">#{tB.id}</span>
                  <p className="text-xs text-[#d4d4d4] mt-1 line-clamp-2">{tB.title}</p>
                </div>
              </div>

              {/* Speedup comparison */}
              <div className="p-3 bg-[#141414] border border-[#262626]">
                <p className="text-[9px] font-[family-name:var(--font-ibm-mono)] text-[#666666] uppercase tracking-widest mb-3">Speedup Comparison</p>
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-[family-name:var(--font-ibm-mono)] text-[#ff6b2b]">#{tA.id}</span>
                      <span className="text-sm font-bold font-[family-name:var(--font-ibm-mono)] text-[#ff6b2b] metric-pulse">{spA.toFixed(1)}×</span>
                    </div>
                    <div className="compare-bar-track"><div className="compare-bar-fill bg-[#ff6b2b]" style={{ width: `${(spA / maxSp) * 100}%` }} /></div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-[family-name:var(--font-ibm-mono)] text-[#4ade80]">#{tB.id}</span>
                      <span className="text-sm font-bold font-[family-name:var(--font-ibm-mono)] text-[#4ade80] metric-pulse">{spB.toFixed(1)}×</span>
                    </div>
                    <div className="compare-bar-track"><div className="compare-bar-fill bg-[#4ade80]" style={{ width: `${(spB / maxSp) * 100}%` }} /></div>
                  </div>
                </div>
              </div>

              {/* Memory comparison */}
              <div className="p-3 bg-[#141414] border border-[#262626]">
                <p className="text-[9px] font-[family-name:var(--font-ibm-mono)] text-[#666666] uppercase tracking-widest mb-3">Memory Delta</p>
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-[family-name:var(--font-ibm-mono)] text-[#ff6b2b]">#{tA.id}</span>
                      <span className={`text-sm font-bold font-[family-name:var(--font-ibm-mono)] ${memA > 0 ? 'text-[#4ade80]' : 'text-[#f87171]'}`}>{memA > 0 ? '-' : '+'}{Math.abs(memA)}%</span>
                    </div>
                    <div className="compare-bar-track"><div className={`compare-bar-fill ${memA > 0 ? 'bg-[#4ade80]' : 'bg-[#f87171]'}`} style={{ width: `${(Math.abs(memA) / maxMem) * 100}%` }} /></div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-[family-name:var(--font-ibm-mono)] text-[#4ade80]">#{tB.id}</span>
                      <span className={`text-sm font-bold font-[family-name:var(--font-ibm-mono)] ${memB > 0 ? 'text-[#4ade80]' : 'text-[#f87171]'}`}>{memB > 0 ? '-' : '+'}{Math.abs(memB)}%</span>
                    </div>
                    <div className="compare-bar-track"><div className={`compare-bar-fill ${memB > 0 ? 'bg-[#4ade80]' : 'bg-[#f87171]'}`} style={{ width: `${(Math.abs(memB) / maxMem) * 100}%` }} /></div>
                  </div>
                </div>
              </div>

              {/* Complexity badges */}
              <div className="p-3 bg-[#141414] border border-[#262626]">
                <p className="text-[9px] font-[family-name:var(--font-ibm-mono)] text-[#666666] uppercase tracking-widest mb-3">Complexity</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[9px] font-[family-name:var(--font-ibm-mono)] text-[#ff6b2b]">#{tA.id}</span>
                    <div className="mt-1 space-y-1">
                      <p className="text-[10px] font-[family-name:var(--font-ibm-mono)] text-[#8a8a8a]">Time: <span className="text-[#d4d4d4]">{tA.optimized.timeComplexity}</span></p>
                      <p className="text-[10px] font-[family-name:var(--font-ibm-mono)] text-[#8a8a8a]">Space: <span className="text-[#d4d4d4]">{tA.optimized.spaceComplexity}</span></p>
                    </div>
                  </div>
                  <div>
                    <span className="text-[9px] font-[family-name:var(--font-ibm-mono)] text-[#4ade80]">#{tB.id}</span>
                    <div className="mt-1 space-y-1">
                      <p className="text-[10px] font-[family-name:var(--font-ibm-mono)] text-[#8a8a8a]">Time: <span className="text-[#d4d4d4]">{tB.optimized.timeComplexity}</span></p>
                      <p className="text-[10px] font-[family-name:var(--font-ibm-mono)] text-[#8a8a8a]">Space: <span className="text-[#d4d4d4]">{tB.optimized.spaceComplexity}</span></p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Technique count comparison */}
              <div className="p-3 bg-[#141414] border border-[#262626]">
                <p className="text-[9px] font-[family-name:var(--font-ibm-mono)] text-[#666666] uppercase tracking-widest mb-3">Techniques & Category</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] font-[family-name:var(--font-ibm-mono)] text-[#ff6b2b]">#{tA.id}: {tA.techniques.length} techniques</p>
                    <p className="text-[10px] text-[#8a8a8a] mt-0.5">{tA.category} · {tA.difficulty}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-[family-name:var(--font-ibm-mono)] text-[#4ade80]">#{tB.id}: {tB.techniques.length} techniques</p>
                    <p className="text-[10px] text-[#8a8a8a] mt-0.5">{tB.category} · {tB.difficulty}</p>
                  </div>
                </div>
              </div>

              {/* CSS bar chart - visual comparison */}
              <div className="p-3 bg-[#141414] border border-[#262626]">
                <p className="text-[9px] font-[family-name:var(--font-ibm-mono)] text-[#666666] uppercase tracking-widest mb-3">Relative Performance</p>
                <div className="space-y-2">
                  {[{ label: 'Speedup', valA: spA, valB: spB, max: maxSp }, { label: 'Baseline Time (s)', valA: tA.baseline.time / 1000, valB: tB.baseline.time / 1000, max: Math.max(tA.baseline.time, tB.baseline.time) / 1000, invert: true }].map((row, i) => (
                    <div key={i}>
                      <p className="text-[9px] font-[family-name:var(--font-ibm-mono)] text-[#8a8a8a] mb-1">{row.label}</p>
                      <div className="flex gap-1 items-center">
                        <span className="text-[8px] font-[family-name:var(--font-ibm-mono)] text-[#ff6b2b] w-6 text-right">{row.label === 'Speedup' ? row.valA.toFixed(1) : row.valA.toFixed(1)}</span>
                        <div className="flex-1 compare-bar-track">
                          <div className="compare-bar-fill bg-[#ff6b2b]" style={{ width: `${row.invert ? Math.max(5, 100 - (row.valA / row.max) * 95) : (row.valA / row.max) * 100}%` }} />
                        </div>
                      </div>
                      <div className="flex gap-1 items-center">
                        <span className="text-[8px] font-[family-name:var(--font-ibm-mono)] text-[#4ade80] w-6 text-right">{row.label === 'Speedup' ? row.valB.toFixed(1) : row.valB.toFixed(1)}</span>
                        <div className="flex-1 compare-bar-track">
                          <div className="compare-bar-fill bg-[#4ade80]" style={{ width: `${row.invert ? Math.max(5, 100 - (row.valB / row.max) * 95) : (row.valB / row.max) * 100}%` }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ─── ACHIEVEMENT TOAST ─── */}
      <AnimatePresence>
        {achievementToastRaw && (
          <div role="status" aria-live="polite">
          <AchievementToast
            achievement={achievementToastRaw}
            onDismiss={() => setAchievementToastRaw(null)}
          />
          </div>
        )}
      </AnimatePresence>

      {/* ─── BACK TO TOP BUTTON ─── */}
      <AnimatePresence>
        {showBackToTop && (
          <motion.button
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2 }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="fixed bottom-6 right-6 z-50 size-10 bg-[#141414] border border-[#262626] flex items-center justify-center text-[#8a8a8a] hover:text-[#ff6b2b] hover:border-[#ff6b2b]/30 transition-colors"
            aria-label="Back to top"
          >
            <ArrowUp className="size-4" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* ─── COMMAND PALETTE ─── */}
      <CommandPalette
        open={showCmdPalette}
        onClose={() => setShowCmdPalette(false)}
        onNavigate={(id) => scrollTo(id)}
        onAction={handleCmdAction}
        allTasks={TASKS}
      />

      {/* ─── HELP MODAL ─── */}
      <HelpModal
        open={showHelpModal}
        onClose={() => setShowHelpModal(false)}
      />

      {/* ─── FOOTER ─── */}
      <footer className="mt-auto border-t border-[#262626] bg-[#0a0a0a] relative overflow-hidden">
        <div aria-hidden="true" className="circuit-pattern absolute inset-0 pointer-events-none" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 relative z-10">
          <p className="text-xs font-[family-name:var(--font-ibm-mono)] text-[#8a8a8a] uppercase tracking-widest">
            Performance Lab
          </p>
          <p className="text-xs font-[family-name:var(--font-ibm-mono)] text-[#666666] uppercase tracking-widest">
            Rust · SIMD · Lock-free · Zero-copy
          </p>
        </div>
      </footer>
    </div>
  );
}
