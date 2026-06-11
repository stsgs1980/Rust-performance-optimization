"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { Trophy, Check } from "lucide-react";
import {
  TASKS, TOTAL_SPEEDUP, MEM_IMPROVED_COUNT,
  MIN_SPEEDUP, MAX_SPEEDUP, AVG_SPEEDUP, getGrade,
} from "@/lib/perf-data";
import {
  FadeIn, AnimatedCounter, ActivityTimeline, AmbientParticles,
} from "@/components/perf/SmallComponents";
import type { TaskData } from "@/lib/perf-data";

// Isolated Live Clock - memo prevents full-page re-render every second
const LiveClock = memo(function LiveClock() {
  const [time, setTime] = useState('');
  useEffect(() => {
    const update = () => {
      const now = new Date();
      requestAnimationFrame(() => {
        setTime(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`);
      });
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);
  return <span className="text-[10px] font-[family-name:var(--font-ibm-mono)] text-[#8a8a8a]">{time}</span>;
});

// Need to import useState and useEffect for LiveClock
import { useState, useEffect } from "react";

interface HeroSectionProps {
  reviewedTasks: Set<number>;
  reviewedCount: number;
  scrollTo: (id: string) => void;
  setHoveredTask: (task: TaskData | null) => void;
  setTooltipRect: (rect: DOMRect | null) => void;
  tooltipRect: DOMRect | null;
  hoveredTask: TaskData | null;
}

export function HeroSection({
  reviewedTasks,
  reviewedCount,
  scrollTo,
  setHoveredTask,
  setTooltipRect,
  tooltipRect,
  hoveredTask,
}: HeroSectionProps) {
  return (
    <section id="hero">
      {/* Terminal status bar */}
      <div className="terminal-bar px-4 py-1.5 flex items-center gap-3 border border-[#262626] border-b-0">
        <span className="size-1.5 rounded-full bg-[#4ade80] pulse-dot" />
        <span className="font-[family-name:var(--font-ibm-mono)]">
          <span className="typing-text text-[#8a8a8a]">&gt; system.init() | rust v1.78.0 | 5 задач загружено | статус: работает</span>
        </span>
        <div className="ml-auto flex items-center gap-2">
          <LiveClock />
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
              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-bold text-[#d4d4d4] tracking-wider uppercase cursor-blink flicker">
                Rust performance optimization
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="size-1.5 rounded-full bg-[#4ade80] pulse-dot" />
                <p className="text-xs font-[family-name:var(--font-ibm-mono)] text-[#8a8a8a]">
                  5 задач на высокопроизводительный код
                </p>
              </div>
              <p className="text-sm text-[#8a8a8a] max-w-2xl leading-relaxed mt-4">
                Каждый челлендж — реальная задача системного программирования. Подход Naive
                vs Optimized на Rust с анализом Big O, бенчмарками и
                объяснением каждой оптимизации.
              </p>
              {/* Keyboard shortcut hints */}
              <div className="flex items-center gap-3 flex-wrap" data-tour-help>
                <kbd className="text-[9px] font-[family-name:var(--font-ibm-mono)] text-[#666666] bg-[#0f0f0f] border border-[#262626] px-1.5 py-0.5">Ctrl+K</kbd>
                <span className="text-[10px] text-[#666666]">Палитра команд</span>
                <kbd className="text-[9px] font-[family-name:var(--font-ibm-mono)] text-[#666666] bg-[#0f0f0f] border border-[#262626] px-1.5 py-0.5">?</kbd>
                <span className="text-[10px] text-[#666666]">Горячие клавиши</span>
                <kbd className="text-[9px] font-[family-name:var(--font-ibm-mono)] text-[#666666] bg-[#0f0f0f] border border-[#262626] px-1.5 py-0.5">E</kbd>
                <span className="text-[10px] text-[#666666]">Развернуть все</span>
                <kbd className="text-[9px] font-[family-name:var(--font-ibm-mono)] text-[#666666] bg-[#0f0f0f] border border-[#262626] px-1.5 py-0.5">1-5</kbd>
                <span className="text-[10px] text-[#666666]">Перейти к задаче</span>
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-[#262626] border border-[#262626]">
              {[
                { val: "5", label: "Задач", isCounter: true },
                { val: TOTAL_SPEEDUP.toFixed(0), label: "Общий ускорение", suffix: "×", isCounter: true },
                { val: `${MEM_IMPROVED_COUNT}/${TASKS.length}`, label: "Память улучшена", isCounter: false },
                { val: "Rust", label: "Язык", isCounter: false },
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
              <span className="text-[10px] font-[family-name:var(--font-ibm-mono)] text-[#666666] uppercase tracking-widest">Быстрая статистика</span>
              <span className="text-[10px] font-[family-name:var(--font-ibm-mono)] text-[#8a8a8a] bg-[#0f0f0f] border border-[#262626] px-2 py-0.5 tabular-nums">
                мин {MIN_SPEEDUP.toFixed(1)}×
              </span>
              <span className="text-[10px] font-[family-name:var(--font-ibm-mono)] text-[#8a8a8a] bg-[#0f0f0f] border border-[#262626] px-2 py-0.5 tabular-nums">
                макс {MAX_SPEEDUP.toFixed(1)}×
              </span>
              <span className="text-[10px] font-[family-name:var(--font-ibm-mono)] text-[#8a8a8a] bg-[#0f0f0f] border border-[#262626] px-2 py-0.5 tabular-nums">
                ср {AVG_SPEEDUP.toFixed(1)}×
              </span>
              {reviewedCount > 0 && (
                <span className="text-[10px] font-[family-name:var(--font-ibm-mono)] text-[#4ade80] bg-[#4ade80]/5 border border-[#4ade80]/20 px-2 py-0.5">
                  просмотрено {reviewedCount}/{TASKS.length}
                </span>
              )}
            </div>

            {/* Progress Timeline */}
            {reviewedCount > 0 && (
              <div className="p-4 border border-[#262626] bg-[#0f0f0f]">
                <div className="flex items-center gap-2 mb-3">
                  <Trophy className="size-3.5 text-[#ff6b2b]" />
                  <span className="text-[10px] font-[family-name:var(--font-ibm-mono)] text-[#8a8a8a] uppercase tracking-widest">
                    Прогресс
                  </span>
                  <span className="ml-auto text-[9px] font-[family-name:var(--font-ibm-mono)] text-[#4ade80] uppercase">
                    {reviewedCount}/{TASKS.length}
                  </span>
                </div>
                <ActivityTimeline tasks={TASKS} reviewedTasks={reviewedTasks} />
              </div>
            )}

            {/* Task quick links */}
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
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </FadeIn>
    </section>
  );
}
