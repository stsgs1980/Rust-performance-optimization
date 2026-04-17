"use client";

import { memo } from "react";
import { TaskData } from "@/lib/perf-data";

const RadarChart = memo(function RadarChart({ tasks }: { tasks: TaskData[] }) {
  const dimensions = ["Speed", "Memory", "Complexity", "Techniques", "Code Quality"];
  const n = dimensions.length;
  const cx = 150, cy = 150, r = 110;
  const angleStep = (2 * Math.PI) / n;

  const getPoint = (angle: number, dist: number) => ({
    x: cx + dist * Math.cos(angle - Math.PI / 2),
    y: cy + dist * Math.sin(angle - Math.PI / 2),
  });

  const getTaskData = (task: TaskData) => {
    const sp = task.baseline.time / task.optimized.time;
    const maxSp = Math.max(...tasks.map(t => t.baseline.time / t.optimized.time));
    const memDelta = task.optimized.memory < task.baseline.memory ? 1 : 0.5;
    const complexScore = task.optimized.timeComplexity.length < task.baseline.timeComplexity.length ? 1 : 0.7;
    const techScore = Math.min(task.techniques.length / 5, 1);
    const codeScore = task.optimized.code.length > task.baseline.code.length ? 0.9 : 0.7;
    return [sp / maxSp, memDelta, complexScore, techScore, codeScore];
  };

  const gridLevels = [0.2, 0.4, 0.6, 0.8, 1.0];

  const colors = ["#ff6b2b", "#4ade80", "#fbbf24", "#22d3ee", "#a78bfa"];

  return (
    <div className="radar-container p-4">
      <svg viewBox="0 0 300 300" className="w-full h-auto">
        {/* Grid */}
        {gridLevels.map((level, li) => {
          const pts = Array.from({ length: n }, (_, i) => {
            const p = getPoint(i * angleStep, r * level);
            return `${p.x},${p.y}`;
          }).join(" ");
          return <polygon key={li} points={pts} fill="none" stroke="#1c1c1c" strokeWidth="0.5" />;
        })}
        {/* Axis lines */}
        {Array.from({ length: n }, (_, i) => {
          const p = getPoint(i * angleStep, r);
          return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="#1c1c1c" strokeWidth="0.5" />;
        })}
        {/* Labels */}
        {dimensions.map((dim, i) => {
          const p = getPoint(i * angleStep, r + 16);
          const anchor = Math.abs(p.x - cx) < 10 ? "middle" : p.x > cx ? "start" : "end";
          return (
            <text key={dim} x={p.x} y={p.y} textAnchor={anchor} fill="#525252" fontSize="9" fontFamily="var(--font-ibm-mono), monospace">
              {dim}
            </text>
          );
        })}
        {/* Task polygons */}
        {tasks.map((task, ti) => {
          const data = getTaskData(task);
          const pts = data.map((val, i) => {
            const p = getPoint(i * angleStep, r * val);
            return `${p.x},${p.y}`;
          }).join(" ");
          return (
            <g key={task.id}>
              <polygon
                points={pts}
                fill={`${colors[ti]}10`}
                stroke={colors[ti]}
                strokeWidth="1"
                opacity={0.7}
              />
              {/* Data points */}
              {data.map((val, i) => {
                const p = getPoint(i * angleStep, r * val);
                return <circle key={i} cx={p.x} cy={p.y} r="2.5" fill={colors[ti]} />;
              })}
            </g>
          );
        })}
      </svg>
      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-2">
        {tasks.map((task, i) => (
          <div key={task.id} className="flex items-center gap-1.5">
            <span className="size-2" style={{ background: colors[i] }} />
            <span className="text-[9px] font-[family-name:var(--font-ibm-mono)] text-[#8a8a8a]">#{task.id}</span>
          </div>
        ))}
      </div>
    </div>
  );
});

export { RadarChart };
