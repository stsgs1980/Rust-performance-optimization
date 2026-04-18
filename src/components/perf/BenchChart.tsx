"use client";

import { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Gauge, Clock, MemoryStick, AlertTriangle } from "lucide-react";
import { TaskData, formatMs } from "@/lib/perf-data";

/* ─── Lightweight SVG Bar Chart (replaces recharts ~200KB) ─── */

function MiniBarChart({ data }: {
  data: { label: string; baseline: number; optimized: number; baselineColor?: string; optimizedColor?: string }[];
}) {
  const maxVal = Math.max(...data.flatMap(d => [d.baseline, d.optimized]), 1);
  const barH = 20;
  const gap = 12;
  const groupH = barH * 2 + 6;
  const chartH = data.length * (groupH + gap) - gap;
  const leftPad = 70;
  const rightPad = 20;
  const chartW = 280 - leftPad - rightPad;

  return (
    <svg viewBox={`0 0 280 ${chartH + 10}`} className="w-full" preserveAspectRatio="xMidYMid meet">
      {/* Grid lines */}
      {[0.25, 0.5, 0.75, 1].map(p => (
        <line key={p} x1={leftPad} y1={chartH * (1 - p) + 5} x2={280 - rightPad} y2={chartH * (1 - p) + 5} stroke="#1c1c1c" strokeWidth={1} />
      ))}
      {data.map((d, i) => {
        const y = i * (groupH + gap);
        const bw = chartW;
        return (
          <g key={i}>
            <text x={leftPad - 6} y={y + groupH / 2} textAnchor="end" dominantBaseline="middle" fill="#8a8a8a" fontSize={10} fontFamily="var(--font-ibm-mono), monospace">{d.label}</text>
            {/* Baseline bar */}
            <rect x={leftPad} y={y} width={(d.baseline / maxVal) * bw} height={barH} fill={d.baselineColor || "#3a3a3a"} rx={0} />
            <text x={leftPad + (d.baseline / maxVal) * bw + 4} y={y + barH / 2} dominantBaseline="middle" fill="#8a8a8a" fontSize={9} fontFamily="var(--font-ibm-mono), monospace">{d.baseline}</text>
            {/* Optimized bar */}
            <rect x={leftPad} y={y + barH + 6} width={(d.optimized / maxVal) * bw} height={barH} fill={d.optimizedColor || "#ff6b2b"} rx={0} />
            <text x={leftPad + (d.optimized / maxVal) * bw + 4} y={y + barH + 6 + barH / 2} dominantBaseline="middle" fill="#d4d4d4" fontSize={9} fontFamily="var(--font-ibm-mono), monospace">{d.optimized}</text>
          </g>
        );
      })}
      {/* Legend */}
      <rect x={leftPad} y={chartH + 4} width={8} height={8} fill="#3a3a3a" />
      <text x={leftPad + 12} y={chartH + 11} fill="#8a8a8a" fontSize={9} fontFamily="var(--font-ibm-mono), monospace">Базовый</text>
      <rect x={leftPad + 70} y={chartH + 4} width={8} height={8} fill="#ff6b2b" />
      <text x={leftPad + 82} y={chartH + 11} fill="#8a8a8a" fontSize={9} fontFamily="var(--font-ibm-mono), monospace">Оптимизированный</text>
    </svg>
  );
}

const BenchChart = memo(function BenchChart({ task }: { task: TaskData }) {
  const speedup = (task.baseline.time / task.optimized.time).toFixed(1);
  const memSave = ((1 - task.optimized.memory / task.baseline.memory) * 100).toFixed(0);

  const chartData = [
    { label: "Время (мс)", baseline: task.baseline.time, optimized: task.optimized.time },
    { label: "Память (МБ)", baseline: task.baseline.memory, optimized: task.optimized.memory },
  ];

  return (
    <Card className="h-full bg-[#141414] border border-[#262626] card-industrial card-lift">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#8a8a8a]">
          <Gauge className="size-3.5" />
          Бенчмарк
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 text-center border border-[#262626] metric-card depth-shadow-1" style={{ "--metric-color": "#ff6b2b" } as React.CSSProperties}>
            <p className="text-2xl font-bold text-[#ff6b2b] font-[family-name:var(--font-ibm-mono)] text-shadow-industrial">
              {speedup}×
            </p>
            <p className="text-[10px] text-[#8a8a8a] uppercase tracking-widest mt-1 font-[family-name:var(--font-ibm-mono)]">
              Ускорение
            </p>
          </div>
          <div className="p-4 text-center border border-[#262626] metric-card depth-shadow-1" style={{ "--metric-color": parseInt(memSave) > 0 ? "#4ade80" : "#f87171" } as React.CSSProperties}>
            <p className={`text-2xl font-bold font-[family-name:var(--font-ibm-mono)] text-shadow-industrial ${parseInt(memSave) > 0 ? "text-[#4ade80]" : "text-[#f87171]"}`}>
              {parseInt(memSave) > 0 ? `−${memSave}%` : `+${Math.abs(parseInt(memSave))}%`}
            </p>
            <p className="text-[10px] text-[#8a8a8a] uppercase tracking-widest mt-1 font-[family-name:var(--font-ibm-mono)]">
              Память
            </p>
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-[#8a8a8a] flex items-center gap-1.5 text-xs font-[family-name:var(--font-ibm-mono)]">
              <Clock className="size-3" /> базовый
            </span>
            <span className="font-[family-name:var(--font-ibm-mono)] text-[#d4d4d4]">
              {formatMs(task.baseline.time)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#8a8a8a] flex items-center gap-1.5 text-xs font-[family-name:var(--font-ibm-mono)]">
              <Clock className="size-3" /> оптимизированный
            </span>
            <span className="font-[family-name:var(--font-ibm-mono)] text-[#4ade80]">
              {formatMs(task.optimized.time)}
            </span>
          </div>
          <Separator className="bg-[#262626]" />
          <div className="flex items-center justify-between">
            <span className="text-[#8a8a8a] flex items-center gap-1.5 text-xs font-[family-name:var(--font-ibm-mono)]">
              <MemoryStick className="size-3" /> базовый
            </span>
            <span className="font-[family-name:var(--font-ibm-mono)] text-[#d4d4d4]">
              {task.baseline.memory} МБ
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#8a8a8a] flex items-center gap-1.5 text-xs font-[family-name:var(--font-ibm-mono)]">
              <MemoryStick className="size-3" /> оптимизированный
            </span>
            <span className="font-[family-name:var(--font-ibm-mono)] text-[#4ade80]">
              {task.optimized.memory} МБ
            </span>
          </div>
        </div>

        {/* Tradeoff note for tasks where optimized memory > baseline memory */}
        {task.optimized.memory > task.baseline.memory && (
          <div className="flex items-start gap-2 p-2.5 bg-[#fbbf24]/5 border border-[#fbbf24]/20">
            <AlertTriangle className="size-3.5 text-[#fbbf24] shrink-0 mt-0.5" />
            <p className="text-[10px] text-[#fbbf24] leading-relaxed font-[family-name:var(--font-ibm-mono)]">
              Компромисс по памяти: +{task.optimized.memory - task.baseline.memory} МБ в обмен на {(task.baseline.time / task.optimized.time).toFixed(1)}× ускорение
            </p>
          </div>
        )}

        {/* SVG Bar Chart — replaces recharts */}
        <div className="h-[120px] flex items-center">
          <MiniBarChart data={chartData} />
        </div>
      </CardContent>
    </Card>
  );
});

export { BenchChart };
