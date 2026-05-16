"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FadeIn } from "@/components/perf/SmallComponents";
import {
  TrendingUp, Database, Layers, Network,
  ArrowRightLeft, Cpu, Grid3x3, Gauge,
} from "lucide-react";
import { ALL_TECHNIQUES } from "@/lib/perf-data";

interface MethodologySectionProps {
  techniqueTag: string | null;
  setTechniqueTag: (tag: string | null) => void;
  setSearchQuery: (query: string) => void;
}

export function MethodologySection({
  techniqueTag,
  setTechniqueTag,
  setSearchQuery,
}: MethodologySectionProps) {
  return (
    <section id="methodology">
      <FadeIn>
        <Card className="border border-[#262626] bg-[#141414] border-l-2 border-l-[#ff6b2b] card-industrial ind-dot-grid">
          <CardHeader>
            <CardTitle className="text-xs uppercase tracking-widest text-[#8a8a8a]">
              Методология
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

            {/* Technique Tag Cloud */}
            <div className="mt-4 pt-4 border-t border-[#262626]">
              <p className="text-[10px] font-[family-name:var(--font-ibm-mono)] text-[#666666] uppercase tracking-[0.2em] mb-2">Теги техник</p>
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
  );
}
