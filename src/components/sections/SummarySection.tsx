"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FadeIn, AnimatedProgressBar } from "@/components/perf/SmallComponents";
import { TASKS, TOTAL_SPEEDUP, MEM_IMPROVED_COUNT, MAX_SPEEDUP } from "@/lib/perf-data";
import { Zap, MemoryStick } from "lucide-react";

export function SummarySection() {
  return (
    <section id="summary">
      <FadeIn>
        <Card className="border border-[#262626] bg-[#141414] border-l-2 border-l-[#ff6b2b] card-industrial card-lift">
          <CardHeader>
            <CardTitle className="text-xs uppercase tracking-widest text-[#8a8a8a]">
              Итоги
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
                    <div className="text-center p-3 bg-[#0f0f0f] border border-[#262626]">
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
                <span className="font-semibold text-[#d4d4d4]">8 принципов высокопроизводительного кода:</span>{" "}
                Big O оптимизация → Кэш-локальность (Data-Oriented Design) →
                Минимизация аллокаций → Async I/O → Lock-free конкурентность →
                Zero-cost абстракции → SIMD векторизация → Профилирование
                ("Измеряй, а не гадай").
              </p>
              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-2">
                  <Zap className="size-3.5 text-[#ff6b2b]" />
                  <span className="text-xs text-[#8a8a8a] font-[family-name:var(--font-ibm-mono)]">
                    Общее ускорение:{" "}
                    <span className="text-[#ff6b2b] font-bold neon-text">
                      {TOTAL_SPEEDUP.toFixed(0)}×
                    </span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <MemoryStick className="size-3.5 text-[#4ade80]" />
                  <span className="text-xs text-[#8a8a8a] font-[family-name:var(--font-ibm-mono)]">
                    Память улучшена:{" "}
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
  );
}
