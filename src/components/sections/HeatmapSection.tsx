"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FadeIn, OptimizationHeatmap } from "@/components/perf/SmallComponents";
import { Waypoints } from "lucide-react";

export function HeatmapSection() {
  return (
    <section id="heatmap">
      <FadeIn>
        <Card className="border border-[#262626] bg-[#141414] border-l-2 border-l-[#a78bfa] card-industrial card-lift">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Waypoints className="size-3.5 text-[#a78bfa]" />
              <CardTitle className="text-xs uppercase tracking-widest text-[#8a8a8a]">
                Тепловая карта влияния оптимизаций
              </CardTitle>
            </div>
            <p className="text-[10px] text-[#666666] font-[family-name:var(--font-ibm-mono)] mt-1">
              Многомерный анализ задач — интенсивность показывает относительный эффект оптимизации (0–100)
            </p>
          </CardHeader>
          <CardContent>
            <OptimizationHeatmap />
            {/* Legend */}
            <div className="flex items-center gap-3 mt-3 pt-3 border-t border-[#262626]">
              <span className="text-[8px] font-[family-name:var(--font-ibm-mono)] text-[#666666] uppercase tracking-widest">Низкий</span>
              <div className="flex gap-px">
                {[0.1, 0.3, 0.5, 0.7, 0.9].map((v) => (
                  <div key={v} className="w-5 h-3 heatmap-cell" style={{ '--heat': v } as React.CSSProperties} />
                ))}
              </div>
              <span className="text-[8px] font-[family-name:var(--font-ibm-mono)] text-[#666666] uppercase tracking-widest">Высокий</span>
            </div>
          </CardContent>
        </Card>
      </FadeIn>
    </section>
  );
}
