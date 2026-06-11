"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FadeIn } from "@/components/perf/SmallComponents";
import { TASKS, AVG_SPEEDUP, TOTAL_TIME_SAVED, MAX_SPEEDUP } from "@/lib/perf-data";
import { BarChart } from "lucide-react";

export function DashboardSection() {
  // Calculate dashboard stats
  const totalLines = TASKS.reduce((a, t) => a + t.optimized.code.split('\n').length, 0);
  const allTechniques = new Set(TASKS.flatMap(t => t.techniques.map(tp => tp.name)));
  const bestTask = TASKS.reduce((best, t) => (t.baseline.time / t.optimized.time) > (best.baseline.time / best.optimized.time) ? t : best);
  const bestSp = (bestTask.baseline.time / bestTask.optimized.time).toFixed(1);
  const complexityReduced = TASKS.filter(t => {
    const bo = (t.baseline.timeComplexity || '').replace(/[O()]/g, '').trim();
    const oo = (t.optimized.timeComplexity || '').replace(/[O()]/g, '').trim();
    return oo.length > 0 && bo.length > 0 && oo.length < bo.length;
  }).length;

  const stats = [
    { label: 'Строк оптимизировано', value: totalLines, suffix: 'строк', color: '#ff6b2b' },
    { label: 'Техник использовано', value: allTechniques.size, suffix: 'уник.', color: '#4ade80' },
    { label: 'Среднее ускорение', value: AVG_SPEEDUP.toFixed(1), suffix: '×', color: '#ff6b2b' },
    { label: 'Лучший результат', value: `#${bestTask.id}`, suffix: `${bestSp}×`, color: '#fbbf24' },
    { label: 'Общее время сэкономлено', value: TOTAL_TIME_SAVED >= 1000 ? `${(TOTAL_TIME_SAVED / 1000).toFixed(1)}s` : `${TOTAL_TIME_SAVED.toFixed(0)}ms`, suffix: '', color: '#4ade80' },
    { label: 'Сложность снижена', value: `${complexityReduced}/${TASKS.length}`, suffix: 'задач', color: '#ff6b2b' },
  ];

  return (
    <section id="dashboard">
      <FadeIn>
        <Card className="bg-[#141414] border border-[#262626] card-industrial card-lift">
          <CardHeader>
            <CardTitle className="text-xs uppercase tracking-widest text-[#8a8a8a]">
              <BarChart className="size-3 inline mr-1.5 text-[#ff6b2b]" />
              Дашборд
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {stats.map((stat, i) => (
                <div key={i} className="bg-[#0d0d0d] border border-[#262626] p-3 stat-card-hover">
                  <p className="text-[8px] font-[family-name:var(--font-ibm-mono)] text-[#666666] uppercase tracking-widest mb-1">{stat.label}</p>
                  <p className="text-xl font-bold font-[family-name:var(--font-ibm-mono)]" style={{ color: stat.color }}>{stat.value}</p>
                  {stat.suffix && <p className="text-[9px] font-[family-name:var(--font-ibm-mono)] text-[#8a8a8a] mt-0.5">{stat.suffix}</p>}
                </div>
              ))}
            </div>

            {/* Technique distribution bar */}
            <div className="mt-4 pt-4 border-t border-[#262626]">
              <p className="text-[8px] font-[family-name:var(--font-ibm-mono)] text-[#666666] uppercase tracking-widest mb-2">Распределение ускорения</p>
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
  );
}
