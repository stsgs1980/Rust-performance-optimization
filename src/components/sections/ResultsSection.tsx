"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FadeIn, SortIcon } from "@/components/perf/SmallComponents";
import { TASKS, formatMs } from "@/lib/perf-data";
import type { TaskData } from "@/lib/perf-data";

interface ResultsSectionProps {
  sortColumn: string;
  sortDirection: "asc" | "desc";
  sortedTasks: TaskData[];
  handleSort: (col: string) => void;
}

export function ResultsSection({
  sortColumn,
  sortDirection,
  sortedTasks,
  handleSort,
}: ResultsSectionProps) {
  return (
    <section id="results">
      <FadeIn>
        <Card className="bg-[#141414] border border-[#262626] card-industrial card-lift">
          <CardHeader>
            <CardTitle className="text-xs uppercase tracking-widest text-[#8a8a8a]">
              Итоги
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
                    <th className="text-left py-2 pr-4 text-[#8a8a8a]">Задача</th>
                    <th className="text-right py-2 px-3 text-[#8a8a8a] sort-header" onClick={() => handleSort("baseline")} aria-sort={sortColumn === "baseline" ? (sortDirection === "asc" ? "ascending" : "descending") : "none"}>
                      Базовый <SortIcon col="baseline" activeCol={sortColumn} direction={sortDirection} />
                    </th>
                    <th className="text-right py-2 px-3 text-[#8a8a8a] sort-header" onClick={() => handleSort("optimized")} aria-sort={sortColumn === "optimized" ? (sortDirection === "asc" ? "ascending" : "descending") : "none"}>
                      Оптим. <SortIcon col="optimized" activeCol={sortColumn} direction={sortDirection} />
                    </th>
                    <th className="text-right py-2 px-3 text-[#8a8a8a] sort-header" onClick={() => handleSort("speedup")} aria-sort={sortColumn === "speedup" ? (sortDirection === "asc" ? "ascending" : "descending") : "none"}>
                      Ускорение <SortIcon col="speedup" activeCol={sortColumn} direction={sortDirection} />
                    </th>
                    <th className="text-right py-2 text-[#8a8a8a] sort-header" onClick={() => handleSort("memory")} aria-sort={sortColumn === "memory" ? (sortDirection === "asc" ? "ascending" : "descending") : "none"}>
                      Память <SortIcon col="memory" activeCol={sortColumn} direction={sortDirection} />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedTasks.map((t) => {
                    const sp = (t.baseline.time / t.optimized.time).toFixed(1);
                    const ms = ((1 - t.optimized.memory / t.baseline.memory) * 100).toFixed(0);
                    const memImproved = t.optimized.memory < t.baseline.memory;

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
                          {formatMs(t.baseline.time)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-[family-name:var(--font-ibm-mono)] text-[#4ade80] tabular-nums">
                          {formatMs(t.optimized.time)}
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

            {/* Speedup Chart — pure SVG */}
            <div className="h-[220px] flex items-center justify-center">
              <SpeedupChart />
            </div>
          </CardContent>
        </Card>
      </FadeIn>
    </section>
  );
}

function SpeedupChart() {
  const items = TASKS.map((t) => ({
    name: `#${t.id}`,
    speedup: parseFloat((t.baseline.time / t.optimized.time).toFixed(1)),
    memory: parseFloat(((1 - t.optimized.memory / t.baseline.memory) * 100).toFixed(0)),
  }));
  const maxSpeedup = Math.max(...items.map(i => i.speedup), 1);
  const maxMem = Math.max(...items.map(i => Math.abs(i.memory)), 1);
  const leftPad = 40;
  const barGroupH = 34;
  const barH = 14;
  const chartW = 300;
  const chartH = items.length * barGroupH;

  return (
    <svg viewBox={`0 0 400 ${chartH + 60}`} className="w-full max-w-[500px]" preserveAspectRatio="xMidYMid meet">
      {[0.25, 0.5, 0.75, 1].map(p => (
        <line key={p} x1={leftPad + chartW * p} y1={5} x2={leftPad + chartW * p} y2={chartH + 5} stroke="#1c1c1c" strokeWidth={1} />
      ))}
      <text x={leftPad + chartW} y={chartH + 20} textAnchor="end" fill="#525252" fontSize={9} fontFamily="var(--font-ibm-mono), monospace">{maxSpeedup.toFixed(0)}×</text>
      <text x={leftPad} y={chartH + 20} textAnchor="start" fill="#525252" fontSize={9} fontFamily="var(--font-ibm-mono), monospace">0</text>
      {items.map((item, i) => {
        const y = i * barGroupH;
        const speedupW = (item.speedup / maxSpeedup) * chartW;
        const memW = (Math.abs(item.memory) / maxMem) * chartW;
        return (
          <g key={i}>
            <text x={leftPad - 6} y={y + barGroupH / 2} textAnchor="end" dominantBaseline="middle" fill="#525252" fontSize={10} fontFamily="var(--font-ibm-mono), monospace">{item.name}</text>
            <rect x={leftPad} y={y} width={Math.max(speedupW, 1)} height={barH} fill="#ff6b2b" rx={0} />
            <text x={leftPad + speedupW + 4} y={y + barH / 2} dominantBaseline="middle" fill="#d4d4d4" fontSize={9} fontFamily="var(--font-ibm-mono), monospace">{item.speedup}×</text>
            <rect x={leftPad} y={y + barH + 3} width={Math.max(memW, 1)} height={barH} fill={item.memory >= 0 ? "#4ade80" : "#f87171"} rx={0} />
            <text x={leftPad + memW + 4} y={y + barH + 3 + barH / 2} dominantBaseline="middle" fill={item.memory >= 0 ? "#4ade80" : "#f87171"} fontSize={9} fontFamily="var(--font-ibm-mono), monospace">{item.memory > 0 ? `-${item.memory}%` : `${item.memory}%`}</text>
          </g>
        );
      })}
      {/* Legend */}
      <rect x={leftPad} y={chartH + 30} width={8} height={8} fill="#ff6b2b" />
      <text x={leftPad + 12} y={chartH + 37} fill="#525252" fontSize={9} fontFamily="var(--font-ibm-mono), monospace">Ускорение (×)</text>
      <rect x={leftPad + 100} y={chartH + 30} width={8} height={8} fill="#4ade80" />
      <text x={leftPad + 112} y={chartH + 37} fill="#525252" fontSize={9} fontFamily="var(--font-ibm-mono), monospace">Экономия памяти (%)</text>
    </svg>
  );
}
