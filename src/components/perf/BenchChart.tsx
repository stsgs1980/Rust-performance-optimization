"use client";

import { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Gauge, Clock, MemoryStick, AlertTriangle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from "recharts";
import { TaskData, formatMs } from "@/lib/perf-data";

const BenchChart = memo(function BenchChart({ task }: { task: TaskData }) {
  const speedup = (task.baseline.time / task.optimized.time).toFixed(1);
  const memSave = ((1 - task.optimized.memory / task.baseline.memory) * 100).toFixed(0);



  const chartData = [
    { name: "Time", Baseline: task.baseline.time, Optimized: task.optimized.time },
    { name: "Memory", Baseline: task.baseline.memory, Optimized: task.optimized.memory },
  ];

  return (
    <Card className="h-full bg-[#141414] border border-[#262626] card-industrial card-lift">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#8a8a8a]">
          <Gauge className="size-3.5" />
          Benchmark
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 text-center border border-[#262626] metric-card depth-shadow-1" style={{ "--metric-color": "#ff6b2b" } as React.CSSProperties}>
            <p className="text-2xl font-bold text-[#ff6b2b] font-[family-name:var(--font-ibm-mono)] text-shadow-industrial">
              {speedup}×
            </p>
            <p className="text-[10px] text-[#8a8a8a] uppercase tracking-widest mt-1 font-[family-name:var(--font-ibm-mono)]">
              Speedup
            </p>
          </div>
          <div className="p-4 text-center border border-[#262626] metric-card depth-shadow-1" style={{ "--metric-color": parseInt(memSave) > 0 ? "#4ade80" : "#f87171" } as React.CSSProperties}>
            <p className={`text-2xl font-bold font-[family-name:var(--font-ibm-mono)] text-shadow-industrial ${parseInt(memSave) > 0 ? "text-[#4ade80]" : "text-[#f87171]"}`}>
              {parseInt(memSave) > 0 ? `−${memSave}%` : `+${Math.abs(parseInt(memSave))}%`}
            </p>
            <p className="text-[10px] text-[#8a8a8a] uppercase tracking-widest mt-1 font-[family-name:var(--font-ibm-mono)]">
              Memory
            </p>
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-[#8a8a8a] flex items-center gap-1.5 text-xs font-[family-name:var(--font-ibm-mono)]">
              <Clock className="size-3" /> baseline
            </span>
            <span className="font-[family-name:var(--font-ibm-mono)] text-[#d4d4d4]">
              {formatMs(task.baseline.time)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#8a8a8a] flex items-center gap-1.5 text-xs font-[family-name:var(--font-ibm-mono)]">
              <Clock className="size-3" /> optimized
            </span>
            <span className="font-[family-name:var(--font-ibm-mono)] text-[#4ade80]">
              {formatMs(task.optimized.time)}
            </span>
          </div>
          <Separator className="bg-[#262626]" />
          <div className="flex items-center justify-between">
            <span className="text-[#8a8a8a] flex items-center gap-1.5 text-xs font-[family-name:var(--font-ibm-mono)]">
              <MemoryStick className="size-3" /> baseline
            </span>
            <span className="font-[family-name:var(--font-ibm-mono)] text-[#d4d4d4]">
              {task.baseline.memory} MB
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#8a8a8a] flex items-center gap-1.5 text-xs font-[family-name:var(--font-ibm-mono)]">
              <MemoryStick className="size-3" /> optimized
            </span>
            <span className="font-[family-name:var(--font-ibm-mono)] text-[#4ade80]">
              {task.optimized.memory} MB
            </span>
          </div>
        </div>

        {/* Tradeoff note for tasks where optimized memory > baseline memory */}
        {task.optimized.memory > task.baseline.memory && (
          <div className="flex items-start gap-2 p-2.5 bg-[#fbbf24]/5 border border-[#fbbf24]/20">
            <AlertTriangle className="size-3.5 text-[#fbbf24] shrink-0 mt-0.5" />
            <p className="text-[10px] text-[#fbbf24] leading-relaxed font-[family-name:var(--font-ibm-mono)]">
              Memory tradeoff: +{task.optimized.memory - task.baseline.memory} MB in exchange for {(task.baseline.time / task.optimized.time).toFixed(1)}× speed improvement
            </p>
          </div>
        )}

        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} barCategoryGap="20%" barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1c1c1c" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#525252" }} />
              <YAxis tick={{ fontSize: 10, fill: "#525252" }} />
              <Bar dataKey="Baseline" fill="#3a3a3a" />
              <Bar dataKey="Optimized" fill="#ff6b2b" />
              <Legend
                iconSize={8}
                wrapperStyle={{ fontSize: "10px", color: "#525252", fontFamily: "var(--font-ibm-mono), monospace" }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
});

export { BenchChart };
