"use client";

import { useEffect, useRef, useState, useCallback, Fragment } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import {
  GitCompareArrows,
  Plus,
  Minus,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  XCircle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Download,
  Star,
  Command,
  Hash,
  Brain,
  Award,
  Target,
  Search,
  Keyboard,
} from "lucide-react";
import { TaskData, getGrade, ACHIEVEMENTS, HEATMAP_DATA } from "@/lib/perf-data";

/* ── FadeIn ── */
export function FadeIn({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 4 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.2, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ── Task Quick-Preview Tooltip ── */
export function TaskPreviewTooltip({ task, visible, anchorRect }: { task: TaskData; visible: boolean; anchorRect: DOMRect | null }) {
  if (!visible || !anchorRect) return null;
  const sp = (task.baseline.time / task.optimized.time).toFixed(1);
  const memSave = ((1 - task.optimized.memory / task.baseline.memory) * 100).toFixed(0);
  const grade = getGrade(parseFloat(sp));
  return (
    <div
      className="task-preview-tooltip glass-dark p-4"
      style={{
        top: anchorRect.bottom + 8,
        left: Math.min(anchorRect.left, window.innerWidth - 360),
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[9px] font-[family-name:var(--font-ibm-mono)] text-[#ff6b2b]">#{task.id}</span>
        <span className={`text-[9px] font-[family-name:var(--font-ibm-mono)] uppercase border px-1.5 py-0 ${grade.className}`}>{grade.letter}</span>
        <span className="text-[9px] font-[family-name:var(--font-ibm-mono)] text-[#8a8a8a]">{task.difficulty}</span>
      </div>
      <p className="text-xs text-[#d4d4d4] font-medium line-clamp-2 mb-2">{task.title}</p>
      <div className="space-y-1.5 text-[10px] font-[family-name:var(--font-ibm-mono)]">
        <div className="flex justify-between"><span className="text-[#8a8a8a]">Speedup</span><span className="text-[#ff6b2b] font-bold">{sp}×</span></div>
        <div className="flex justify-between"><span className="text-[#8a8a8a]">Memory</span><span className={parseInt(memSave) > 0 ? 'text-[#4ade80]' : 'text-[#f87171]'}>{parseInt(memSave) > 0 ? '-' : '+'}{Math.abs(parseInt(memSave))}%</span></div>
        <div className="flex justify-between"><span className="text-[#8a8a8a]">Time Complex</span><span className="text-[#d4d4d4]">{task.optimized.timeComplexity}</span></div>
      </div>
      <div className="mt-2 pt-2 border-t border-[#1c1c1c]">
        <p className="text-[9px] text-[#666666] uppercase tracking-widest mb-1">Key Techniques</p>
        <div className="flex flex-wrap gap-1">
          {task.techniques.slice(0, 3).map((t, i) => (
            <span key={i} className="text-[8px] font-[family-name:var(--font-ibm-mono)] text-[#8a8a8a] bg-[#1c1c1c] px-1.5 py-0.5">{t.name}</span>
          ))}
          {task.techniques.length > 3 && <span className="text-[8px] text-[#666666]">+{task.techniques.length - 3}</span>}
        </div>
      </div>
    </div>
  );
}

/* ── Activity Timeline Component ── */
export function ActivityTimeline({ tasks, reviewedTasks }: { tasks: TaskData[]; reviewedTasks: Set<number> }) {
  const activities = tasks.map(t => {
    const sp = (t.baseline.time / t.optimized.time).toFixed(1);
    const grade = getGrade(parseFloat(sp));
    return {
      id: t.id,
      title: t.title,
      speedup: sp,
      grade,
      reviewed: reviewedTasks.has(t.id),
      difficulty: t.difficulty,
    };
  });

  return (
    <div className="space-y-3">
      {activities.map((a) => (
        <div key={a.id} className={`timeline-item ${a.reviewed ? 'active' : ''}`}>
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-[10px] font-[family-name:var(--font-ibm-mono)] text-[#8a8a8a]">
              #{a.id} {a.title.substring(0, 35)}...
            </span>
            <div className="flex items-center gap-2">
              <span className={`text-[9px] font-[family-name:var(--font-ibm-mono)] uppercase border px-1.5 py-0 ${a.grade.className}`}>{a.grade.letter}</span>
              <span className="text-[10px] font-[family-name:var(--font-ibm-mono)] text-[#ff6b2b] font-bold">{a.speedup}×</span>
            </div>
          </div>
          <div className="text-[9px] font-[family-name:var(--font-ibm-mono)] text-[#666666]">
            {a.reviewed ? 'Reviewed' : 'Not reviewed'} · {a.difficulty}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Share URL Handler ── */
export function useShareURL(expandedTasks: Set<number>) {
  return useCallback(() => {
    const params = new URLSearchParams();
    if (expandedTasks.size > 0 && expandedTasks.size < 5) {
      params.set('expanded', Array.from(expandedTasks).join(','));
    }
    const url = `${window.location.origin}${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
    navigator.clipboard.writeText(url);
    return url;
  }, [expandedTasks]);
}

/* ── Animated Counter ── */
export function AnimatedCounter({ value, suffix = "" }: { value: string; suffix?: string }) {
  const num = parseFloat(value);
  const isNumeric = !isNaN(num);
  const [display, setDisplay] = useState(isNumeric ? "0" : value);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const animatedRef = useRef(false);

  useEffect(() => {
    if (!inView || !isNumeric || animatedRef.current) return;
    animatedRef.current = true;
    const duration = 800;
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = num * eased;
      if (Number.isInteger(num)) {
        setDisplay(Math.round(current).toString());
      } else {
        setDisplay(current.toFixed(1));
      }
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setDisplay(value);
      }
    };
    requestAnimationFrame(animate);
  }, [inView, value, num, isNumeric]);

  return (
    <span ref={ref}>
      {display}{suffix}
    </span>
  );
}

/* ── Section Divider ── */
export function SectionDivider({ label }: { label: string }) {
  const hexLeft = ('0x' + (label.charCodeAt(0) || 0x30).toString(16).toUpperCase().padStart(2, '0'));
  const hexRight = ('0x' + (label.charCodeAt(label.length - 1) || 0x30).toString(16).toUpperCase().padStart(2, '0'));
  return (
    <div className="flex items-center gap-3 py-2">
      <span className="hex-coord">{hexLeft}</span>
      <div className="flex-1 h-px bg-[#1c1c1c]" />
      <span className="text-[9px] font-[family-name:var(--font-ibm-mono)] text-[#666666] uppercase tracking-[0.3em]">{label}</span>
      <div className="flex-1 h-px bg-[#1c1c1c]" />
      <span className="hex-coord">{hexRight}</span>
    </div>
  );
}

/* ── Complexity Badge ── */
export function ComplexityBadge({ label, complexity }: { label: string; complexity: string }) {
  const isBad = complexity.includes("n³") || complexity === "O(n×m)" || complexity === "O(n) sequential" || complexity === "O(n) + contention";
  const isMedium = complexity === "O(n)" || complexity === "O(n) avg" || complexity === "O(n²)";
  const color = isBad
    ? "border-[#f87171]/30 text-[#f87171]"
    : isMedium
      ? "border-[#fbbf24]/30 text-[#fbbf24]"
      : "border-[#4ade80]/30 text-[#4ade80]";
  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] font-[family-name:var(--font-ibm-mono)] font-medium px-2 py-0.5 border badge-hover ${color}`}
    >
      {label}: {complexity}
    </span>
  );
}

/* ── Animated Progress Bar ── */
export function AnimatedProgressBar({ value, max }: { value: number; max: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });
  const pct = max > 0 ? (value / max) * 100 : 0;

  return (
    <div ref={ref} className="progress-bar-track w-full">
      <div
        className="progress-bar-fill"
        style={{ width: inView ? `${pct}%` : "0%" }}
      />
    </div>
  );
}

/* ── Ambient Particles ── */
export function AmbientParticles() {
  const particles = [
    { id: 0, left: '12%', bottom: '5%', delay: '0.2s', duration: '5s', size: 1, opacity: 0.15 },
    { id: 1, left: '28%', bottom: '12%', delay: '1.1s', duration: '6s', size: 2, opacity: 0.25 },
    { id: 2, left: '45%', bottom: '3%', delay: '0.8s', duration: '4s', size: 1, opacity: 0.18 },
    { id: 3, left: '67%', bottom: '18%', delay: '2.3s', duration: '7s', size: 2, opacity: 0.2 },
    { id: 4, left: '82%', bottom: '8%', delay: '3.5s', duration: '5s', size: 1, opacity: 0.3 },
    { id: 5, left: '5%', bottom: '22%', delay: '1.7s', duration: '6s', size: 2, opacity: 0.12 },
    { id: 6, left: '35%', bottom: '15%', delay: '0.5s', duration: '4s', size: 1, opacity: 0.22 },
    { id: 7, left: '55%', bottom: '10%', delay: '4.1s', duration: '7s', size: 2, opacity: 0.28 },
    { id: 8, left: '90%', bottom: '25%', delay: '2.8s', duration: '5s', size: 1, opacity: 0.16 },
    { id: 9, left: '18%', bottom: '20%', delay: '3.2s', duration: '6s', size: 2, opacity: 0.24 },
    { id: 10, left: '72%', bottom: '6%', delay: '0.9s', duration: '4s', size: 1, opacity: 0.19 },
    { id: 11, left: '40%', bottom: '28%', delay: '5.0s', duration: '7s', size: 2, opacity: 0.14 },
    { id: 12, left: '60%', bottom: '14%', delay: '1.5s', duration: '5s', size: 1, opacity: 0.26 },
    { id: 13, left: '95%', bottom: '2%', delay: '3.8s', duration: '6s', size: 2, opacity: 0.17 },
    { id: 14, left: '50%', bottom: '22%', delay: '2.0s', duration: '4s', size: 1, opacity: 0.21 },
  ];
  return (
    <div className="ambient-particles">
      {particles.map((p) => (
        <div
          key={p.id}
          className="particle"
          style={{
            left: p.left,
            bottom: p.bottom,
            animationDelay: p.delay,
            animationDuration: p.duration,
            width: p.size,
            height: p.size,
            opacity: p.opacity,
          }}
        />
      ))}
    </div>
  );
}

/* ── Sort Icon ── */
export function SortIcon({ col, activeCol, direction }: { col: string; activeCol: string; direction: "asc" | "desc" }) {
  if (activeCol !== col) return <ArrowUpDown className="size-3 inline ml-1 opacity-40" />;
  return direction === "desc"
    ? <ArrowDown className="size-3 inline ml-1 text-[#ff6b2b]" />
    : <ArrowUp className="size-3 inline ml-1 text-[#ff6b2b]" />;
}

/* ── Code Diff ── */
export function CodeDiff({ baseline, optimized, title }: { baseline: string; optimized: string; title: string }) {
  const bLines = baseline.split('\n');
  const oLines = optimized.split('\n');
  const maxLines = Math.max(bLines.length, oLines.length);

  const diffLines: { type: 'context' | 'added' | 'removed'; line: string; num: number }[] = [];
  for (let i = 0; i < maxLines; i++) {
    if (i < bLines.length && i < oLines.length) {
      if (bLines[i] === oLines[i]) {
        diffLines.push({ type: 'context', line: oLines[i], num: i + 1 });
      } else {
        diffLines.push({ type: 'removed', line: bLines[i], num: i + 1 });
        diffLines.push({ type: 'added', line: oLines[i], num: i + 1 });
      }
    } else if (i < bLines.length) {
      diffLines.push({ type: 'removed', line: bLines[i], num: i + 1 });
    } else {
      diffLines.push({ type: 'added', line: oLines[i], num: i + 1 });
    }
  }

  const addedCount = diffLines.filter(d => d.type === 'added').length;
  const removedCount = diffLines.filter(d => d.type === 'removed').length;

  return (
    <div className="overflow-hidden border border-[#262626] code-block-hover">
      <div className="px-4 py-2 flex items-center justify-between border-b border-[#262626] bg-[#0f0f0f]">
        <div className="flex items-center gap-2 min-w-0">
          <GitCompareArrows className="size-3.5 text-[#8a8a8a] shrink-0" />
          <span className="text-xs font-[family-name:var(--font-ibm-mono)] text-[#8a8a8a] truncate">{title}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="diff-badge diff-badge-added"><Plus className="size-2.5" />{addedCount}</span>
          <span className="diff-badge diff-badge-removed"><Minus className="size-2.5" />{removedCount}</span>
        </div>
      </div>
      <div className="max-h-[480px] overflow-auto scrollbar-glow bg-[#0d0d0d]">
        <div className="text-[11px] font-[family-name:var(--font-ibm-mono)] leading-[1.6]">
          {diffLines.map((d, i) => (
            <div
              key={i}
              className={`flex items-start px-3 ${
                d.type === 'added' ? 'diff-line-added' : d.type === 'removed' ? 'diff-line-removed' : 'diff-line-context'
              }`}
            >
              <span className="w-8 shrink-0 text-right text-[#666666] select-none mr-3 text-[10px]">{d.num}</span>
              <span className={`w-4 shrink-0 text-center select-none mr-3 ${
                d.type === 'added' ? 'text-[#4ade80]' : d.type === 'removed' ? 'text-[#f87171]' : 'text-[#666666]'
              }`}>
                {d.type === 'added' ? '+' : d.type === 'removed' ? '−' : ' '}
              </span>
              <span className={`flex-1 whitespace-pre ${d.type === 'added' ? 'text-[#4ade80]/80' : d.type === 'removed' ? 'text-[#f87171]/60 line-through' : 'text-[#8a8a8a]'}`}>
                {d.line}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Command Palette ── */
export function CommandPalette({
  open,
  onClose,
  onNavigate,
  onAction,
  allTasks,
}: {
  open: boolean;
  onClose: () => void;
  onNavigate: (id: string) => void;
  onAction: (action: string) => void;
  allTasks: TaskData[];
}) {
  const [query, setQuery] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(timer);
  }, []);

  const navItems = [
    { id: "hero", label: "Обзор", icon: Sparkles, group: "Навигация" },
    ...allTasks.map(t => ({ id: `task-${t.id}`, label: `#${t.id} ${t.title}`, icon: Hash, group: "Задачи" })),
    { id: "methodology", label: "Методология", icon: Brain, group: "Навигация" },
    { id: "results", label: "Результаты", icon: Award, group: "Навигация" },
    { id: "summary", label: "Итоги", icon: Target, group: "Навигация" },
  ];

  const actions = [
    { id: "expand-all", label: "Развернуть все задачи", icon: ChevronDown, group: "Действия" },
    { id: "collapse-all", label: "Свернуть все задачи", icon: ChevronUp, group: "Действия" },
    { id: "export-md", label: "Экспорт в Markdown", icon: Download, group: "Действия" },
    { id: "compare", label: "Переключить сравнение", icon: GitCompareArrows, group: "Действия" },
    { id: "starred-filter", label: "Фильтр избранных", icon: Star, group: "Действия" },
  ];

  const q = query.toLowerCase().trim();
  const filteredNav = q ? navItems.filter(item => item.label.toLowerCase().includes(q)) : navItems;
  const filteredActions = q ? actions.filter(a => a.label.toLowerCase().includes(q)) : actions;
  const allItems = [...filteredNav.map(i => ({ ...i, type: 'nav' as const })), ...filteredActions.map(a => ({ ...a, type: 'action' as const }))];

  const executeItem = (item: typeof allItems[number]) => {
    if (item.type === 'nav') onNavigate(item.id);
    else onAction(item.id);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, allItems.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)); }
    else if (e.key === "Enter" && allItems[activeIdx]) { executeItem(allItems[activeIdx]); }
    else if (e.key === "Escape") { onClose(); }
  };

  if (!open) return null;

  return (
    <div className="cmd-overlay" onClick={onClose}>
      <div className="cmd-palette" onClick={e => e.stopPropagation()}>
        <input
          ref={inputRef}
          className="cmd-input"
          placeholder="Введите команду или поисковый запрос..."
          value={query}
          onChange={e => { setQuery(e.target.value); setActiveIdx(0); }}
          onKeyDown={handleKeyDown}
        />
        <div className="cmd-list">
          {allItems.length === 0 ? (
            <div className="p-4 text-center text-[10px] font-[family-name:var(--font-ibm-mono)] text-[#666666] uppercase tracking-widest">Нет результатов</div>
          ) : (
            allItems.map((item, i) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  className={`cmd-item ${i === activeIdx ? 'active' : ''}`}
                  onClick={() => executeItem(item)}
                  onMouseEnter={() => setActiveIdx(i)}
                >
                  <div className="cmd-icon">
                    <Icon className="size-3.5 text-[#8a8a8a]" />
                  </div>
                  <div className="cmd-label">{item.label}</div>
                  <span className="cmd-hint">{item.type === 'nav' ? 'Перейти' : 'Действие'}</span>
                </div>
              );
            })
          )}
        </div>
        <div className="px-3 py-2 border-t border-[#1c1c1c] flex items-center gap-3">
          <span className="text-[9px] font-[family-name:var(--font-ibm-mono)] text-[#666666] flex items-center gap-1"><span className="help-key text-[8px]">↑↓</span> Навигация</span>
          <span className="text-[9px] font-[family-name:var(--font-ibm-mono)] text-[#666666] flex items-center gap-1"><span className="help-key text-[8px]">↵</span> Выбрать</span>
          <span className="text-[9px] font-[family-name:var(--font-ibm-mono)] text-[#666666] flex items-center gap-1"><span className="help-key text-[8px]">Esc</span> Закрыть</span>
        </div>
      </div>
    </div>
  );
}

/* ── Help Modal ── */
export function HelpModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  const shortcuts = [
    { keys: ["Ctrl+K"], desc: "Открыть палитру команд" },
    { keys: ["?"], desc: "Показать горячие клавиши" },
    { keys: ["E"], desc: "Развернуть / свернуть все задачи" },
    { keys: ["1", "-", "5"], desc: "Перейти к задаче 1-5" },
    { keys: ["Esc"], desc: "Закрыть диалоги" },
  ];

  return (
    <div className="help-overlay" onClick={onClose}>
      <div className="help-modal" onClick={e => e.stopPropagation()}>
        <div className="px-4 py-3 border-b border-[#262626] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Keyboard className="size-3.5 text-[#ff6b2b]" />
            <span className="text-xs font-[family-name:var(--font-ibm-mono)] text-[#8a8a8a] uppercase tracking-widest">Горячие клавиши</span>
          </div>
          <button onClick={onClose} className="text-[#666666] hover:text-[#d4d4d4] transition-colors">
            <ChevronUp className="size-4 rotate-45" />
          </button>
        </div>
        <div className="py-2">
          {shortcuts.map((s, i) => (
            <div key={i} className="help-shortcut-row">
              <span className="text-xs text-[#8a8a8a]">{s.desc}</span>
              <div className="flex items-center gap-1">
                {s.keys.map((k, ki) => (
                  <span key={ki} className="help-key">{k}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="px-4 py-2 border-t border-[#1c1c1c]">
          <span className="text-[9px] font-[family-name:var(--font-ibm-mono)] text-[#666666]">
            Совет: нажмите <span className="help-key text-[8px]">Ctrl+K</span> в любой момент для быстрого доступа
          </span>
        </div>
      </div>
    </div>
  );
}

/* ── Optimization Heatmap ── */
export function OptimizationHeatmap() {
  const metrics = ["Speed", "Memory", "Cache Locality", "Parallelism", "Code Complexity"] as const;

  return (
    <div className="overflow-x-auto custom-scrollbar">
      <div className="min-w-[400px]">
        <div className="grid grid-cols-[100px_repeat(5,1fr)] gap-px">
          {/* Header row */}
          <div className="p-2 text-[8px] font-[family-name:var(--font-ibm-mono)] text-[#666666] uppercase tracking-widest" />
          {metrics.map((m) => (
            <div key={m} className="p-2 text-[8px] font-[family-name:var(--font-ibm-mono)] text-[#666666] uppercase tracking-widest text-center">
              {m}
            </div>
          ))}
          {/* Data rows */}
          {HEATMAP_DATA.map((row) => (
            <Fragment key={row.task}>
              <div className="p-2 text-[9px] font-[family-name:var(--font-ibm-mono)] text-[#8a8a8a] flex items-center">
                #{row.task}
              </div>
              {[row.speed, row.memory, row.cache, row.parallelism, row.complexity].map((val, mi) => (
                <div
                  key={mi}
                  className="heatmap-cell p-2 text-center"
                  style={{ '--heat': val } as React.CSSProperties}
                >
                  <span className="text-[9px] font-[family-name:var(--font-ibm-mono)] text-[#d4d4d4]">
                    {(val * 100).toFixed(0)}
                  </span>
                </div>
              ))}
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Achievement Toast ── */
export function AchievementToast({ achievement, onDismiss }: { achievement: typeof ACHIEVEMENTS[0]; onDismiss: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 4000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.9 }}
      className="fixed top-20 right-6 z-[70] glass-accent p-4 w-72"
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl">{achievement.icon}</span>
        <div className="flex-1 min-w-0">
          <p className="text-[9px] font-[family-name:var(--font-ibm-mono)] text-[#fbbf24] uppercase tracking-widest mb-0.5">Achievement Unlocked</p>
          <p className="text-sm font-bold text-[#d4d4d4]">{achievement.name}</p>
          <p className="text-[10px] text-[#8a8a8a]">{achievement.desc}</p>
        </div>
        <button onClick={onDismiss} className="text-[#666666] hover:text-[#8a8a8a] transition-colors">
          <XCircle className="size-3" />
        </button>
      </div>
    </motion.div>
  );
}
