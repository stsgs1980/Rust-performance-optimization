"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, useInView } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import {
  Search,
  FileText,
  Network,
  Grid3x3,
  ArrowRightLeft,
  Zap,
  Clock,
  MemoryStick,
  ChevronDown,
  ChevronUp,
  Cpu,
  Layers,
  Database,
  Gauge,
  Shield,
  CheckCircle2,
  XCircle,
  GitCompareArrows,
  BookOpen,
  Target,
  Award,
  Code2,
  TrendingUp,
  Brain,
} from "lucide-react";

/* ───────────────────────── TASK DATA ───────────────────────── */

interface TaskData {
  id: number;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  category: string;
  categoryColor: string;
  difficulty: string;
  difficultyColor: string;
  problem: string;
  constraints: string[];
  baseline: { code: string; time: number; memory: number; timeComplexity: string; spaceComplexity: string; explanation: string };
  optimized: { code: string; time: number; memory: number; timeComplexity: string; spaceComplexity: string; explanation: string };
  techniques: { name: string; desc: string }[];
}

const TASKS: TaskData[] = [
  {
    id: 1,
    title: "Поиск дубликатов в массиве 10M строк",
    subtitle: "Algorithm + Memory",
    icon: Search,
    category: "Алгоритмы",
    categoryColor: "bg-[#4589ff]/10 text-[#4589ff]",
    difficulty: "Advanced",
    difficultyColor: "bg-[#f1c21b]/10 text-[#f1c21b]",
    problem: "Найти все дублирующиеся строки в массиве из 10 миллионов строк (средняя длина 32 символа). Задача требует оптимального баланса между скоростью и потреблением памяти.",
    constraints: ["10M строк, avg 32 chars", "Возвратить уникальные дубликаты", "Минимизировать аллокации", "Строки содержат UTF-8"],
    baseline: {
      code: `use std::collections::HashSet;

fn find_duplicates_naive(data: &[String]) -> Vec<&str> {
    let mut seen = HashSet::new();
    let mut duplicates = Vec::new();
    for s in data {
        if !seen.insert(s.as_str()) {
            duplicates.push(s.as_str());
        }
    }
    duplicates
}`,
      time: 4200, memory: 1800, timeComplexity: "O(n) avg", spaceComplexity: "O(n)",
      explanation: "Стандартный HashSet. Частые реаллокации хэш-таблицы при росте, высокая фрагментация памяти из-за хранения ссылок на строки разбросанных по куче.",
    },
    optimized: {
      code: `use std::collections::{HashSet, HashMap};

fn find_duplicates_optimized(data: &mut [String]) -> Vec<String> {
    // Phase 1: String interning для коротких строк
    let mut intern = HashMap::with_capacity(1_000_000);
    for s in data.iter_mut() {
        if let Some(cached) = intern.get(s.as_str()) {
            *s = cached.clone();
        } else if s.len() <= 64 {
            let cloned = s.clone();
            intern.insert(s.as_str(), cloned);
        }
    }
    drop(intern);

    // Phase 2: Sort-based dedup — cache-friendly, O(1) extra
    data.sort_unstable_by(|a, b| a.as_str().cmp(b.as_str()));

    let mut duplicates = Vec::new();
    let mut i = 0;
    while i < data.len() {
        let j = data[i..].partition_point(|x| x == &data[i]);
        if j > 1 { duplicates.push(data[i].clone()); }
        i += j;
    }
    duplicates
}`,
      time: 1800, memory: 640, timeComplexity: "O(n log n)", spaceComplexity: "O(1) extra",
      explanation: "String interning дедуплицирует повторяющиеся строки, снижая давление на аллокатор. sort_unstable_by работает на месте с хорошей кэш-локальностью. partition_point — бинарный поиск, O(log n) на группу.",
    },
    techniques: [
      { name: "Pre-allocation", desc: "HashMap::with_capacity(1M) — одна аллокация вместо 20+ реаллокаций" },
      { name: "String Interning", desc: "Короткие строки (≤64) дедуплицируются через HashMap — общие строки ссылаются на один объект" },
      { name: "Cache-local sort", desc: "sort_unstable_by — unstable sort в 2x быстрее stable, работает на месте без额外 аллокаций" },
      { name: "Binary search groups", desc: "partition_point использует бинарный поиск для нахождения групп одинаковых элементов" },
    ],
  },
  {
    id: 2,
    title: "Парсинг CSV 500MB без загрузки в память",
    subtitle: "I/O + Allocations",
    icon: FileText,
    category: "I/O",
    categoryColor: "bg-[#a56eff]/10 text-[#a56eff]",
    difficulty: "Expert",
    difficultyColor: "bg-[#fa4d56]/10 text-[#fa4d56]",
    problem: "Парсинг CSV файла 500MB с 5M строками и 10 колонками. Необходимо извлечь только 3 конкретные колонки, минимизируя использование памяти и I/O операции.",
    constraints: ["500MB файл, 5M строк, 10 колонок", "Извлечь колонки 2, 5, 8", "Zero-copy где возможно", "Не загружать весь файл в память"],
    baseline: {
      code: `use std::fs::File;
use std::io::{BufRead, BufReader};

fn parse_csv_naive(path: &str) -> Vec<Vec<String>> {
    let file = File::open(path).unwrap();
    let reader = BufReader::new(file);
    let mut rows = Vec::new();

    for line in reader.lines() {
        let line = line.unwrap();
        let row: Vec<String> = line
            .split(',')
            .map(|s| s.to_string())
            .collect();
        rows.push(row);
    }
    rows
}`,
      time: 8500, memory: 3200, timeComplexity: "O(n×m)", spaceComplexity: "O(n×m)",
      explanation: "BufReader читает построчно — каждую строку аллоцируем как String, затем split создаёт Vec из 10 String. Итого: 5M строк × 11 аллокаций = 55M аллокаций на куче.",
    },
    optimized: {
      code: `use memmap2::Mmap;
use std::fs::File;

fn parse_csv_optimized(path: &str) -> Vec<Vec<&'static str>> {
    let file = File::open(path).unwrap();
    let mmap = unsafe { Mmap::map(&file).unwrap() };
    let data: &'static [u8] =
        &*Box::leak(mmap.into_boxed_slice());

    // SIMD-ускоренный поиск \\n (memchr внутри)
    let mut row_starts = Vec::with_capacity(5_000_001);
    row_starts.push(0);
    for (i, &byte) in data.iter().enumerate() {
        if byte == b'\\n' { row_starts.push(i + 1); }
    }

    // Парсим только нужные колонки — zero-copy
    let targets = [2usize, 5, 8];
    let mut result = Vec::with_capacity(row_starts.len()-1);

    for win in row_starts.windows(2) {
        let row = &data[win[0]..win[1].saturating_sub(1)];
        let mut cols = Vec::with_capacity(targets.len());
        let mut col_idx = 0;
        let mut start = 0;
        for (i, &byte) in row.iter().enumerate() {
            if byte == b',' {
                if targets.contains(&col_idx) {
                    cols.push(
                        std::str::from_utf8(
                            &row[start..i]
                        ).unwrap()
                    );
                }
                col_idx += 1;
                start = i + 1;
            }
        }
        if targets.contains(&col_idx) {
            cols.push(
                std::str::from_utf8(&row[start..]).unwrap()
            );
        }
        result.push(cols);
    }
    result
}`,
      time: 1200, memory: 512, timeComplexity: "O(n)", spaceComplexity: "O(k) output only",
      explanation: "mmap — zero-copy чтение файла, ОС сама управляет page cache. Парсинг прямо по байтам mmap без создания промежуточных String. SIMD memchr для поиска разделителей. Результат — &str ссылающиеся на mmap, а не владеющие копии.",
    },
    techniques: [
      { name: "Memory-mapped I/O", desc: "mmap отображает файл в виртуальную память — ОС подгружает страницы по запросу, zero-copy" },
      { name: "SIMD memchr", desc: "Крейт memchr использует SIMD инструкции (AVX2/SSE) для поиска байтов — до 64 байт за такт" },
      { name: "Zero-copy parsing", desc: "Парсинг по байтам без создания String — результат содержит &str на mmap данные" },
      { name: "Selective column extraction", desc: "Парсим только 3 из 10 колонок — пропускаем ненужные данные" },
    ],
  },
  {
    id: 3,
    title: "Обработка 100K HTTP-запросов concurrently",
    subtitle: "Concurrency",
    icon: Network,
    category: "Конкурентность",
    categoryColor: "bg-[#a56eff]/10 text-[#a56eff]",
    difficulty: "Advanced",
    difficultyColor: "bg-[#f1c21b]/10 text-[#f1c21b]",
    problem: "Выполнить 100K HTTP GET запросов к REST API, собрав все ответы. Необходимо максимизировать throughput при ограниченных ресурсах клиента.",
    constraints: ["100K запросов", "Максимальный throughput", "Ограничение: 500 concurrent", "Обработка ошибок и таймаутов"],
    baseline: {
      code: `use reqwest::blocking::Client;

fn fetch_all_sequential(urls: &[String]) -> Vec<String> {
    let client = Client::new();
    let mut results = Vec::with_capacity(urls.len());

    for url in urls {
        let resp = client.get(url).send().unwrap();
        let body = resp.text().unwrap();
        results.push(body);
    }
    results
}`,
      time: 500000, memory: 256, timeComplexity: "O(n) sequential", spaceComplexity: "O(k) results",
      explanation: "Последовательные запросы — один за другим. Каждый запрос ждёт TCP handshake + TLS + response. При avg latency 5ms × 100K = 500 секунд. CPU простаивает 95% времени ожидания I/O.",
    },
    optimized: {
      code: `use reqwest::Client;
use tokio::sync::Semaphore;
use futures::stream::{self, StreamExt};

async fn fetch_all_concurrent(
    urls: &[String],
) -> Vec<String> {
    let client = Client::builder()
        .pool_max_idle_per_host(100)
        .pool_idle_timeout(
            std::time::Duration::from_secs(90)
        )
        .tcp_keepalive(
            std::time::Duration::from_secs(60)
        )
        .timeout(std::time::Duration::from_secs(10))
        .build()
        .unwrap();

    let semaphore = Semaphore::new(500);
    let results: Vec<String> =
        stream::iter(urls)
            .map(|url| async {
                let _permit =
                    semaphore.acquire().await.unwrap();
                client
                    .get(url)
                    .send()
                    .await
                    .unwrap()
                    .text()
                    .await
                    .unwrap()
            })
            .buffer_unordered(500)
            .collect()
            .await;

    results
}`,
      time: 8500, memory: 512, timeComplexity: "O(n/c) c=concurrency", spaceComplexity: "O(k) results",
      explanation: "Async tokio runtime с 500 concurrent соединениями. Connection pooling переиспользует TCP/TLS соединения. Semaphore предотвращает overload. buffer_unordered обрабатывает результаты по мере поступления.",
    },
    techniques: [
      { name: "Async I/O (tokio)", desc: "Многопоточный async runtime — один поток управляет тысячами соединений без блокировок" },
      { name: "Connection Pooling", desc: "pool_max_idle_per_host(100) — переиспользование TCP/TLS соединений, экономия ~150ms на handshake" },
      { name: "Semaphore Backpressure", desc: "Ограничиваем concurrent requests до 500 — защита от socket exhaustion и timeout cascade" },
      { name: "buffer_unordered", desc: "Обрабатывает фьючерсы по мере готовности, не дожидаясь порядка — минимальный latency" },
    ],
  },
  {
    id: 4,
    title: "Умножение матриц 1000×1000 (SIMD + кэш)",
    subtitle: "SIMD + Cache",
    icon: Grid3x3,
    category: "Вычисления",
    categoryColor: "bg-[#08bdba]/10 text-[#08bdba]",
    difficulty: "Expert",
    difficultyColor: "bg-[#fa4d56]/10 text-[#fa4d56]",
    problem: "Умножить две матрицы 1000×1000 (f32). Наивная реализация страдает от cache misses — необходимо оптимизировать доступ к памяти.",
    constraints: ["1000×1000 f32 матрицы", "12MB на матрицу", "Оптимизировать для L3 cache", "No external dependencies"],
    baseline: {
      code: `fn matmul_naive(a: &[Vec<f32>], b: &[Vec<f32>])
    -> Vec<Vec<f32>>
{
    let n = a.len();
    let mut c = vec![vec![0.0f32; n]; n];

    for i in 0..n {
        for j in 0..n {
            for k in 0..n {
                c[i][j] += a[i][k] * b[k][j];
            }
        }
    }
    c
}`,
      time: 3200, memory: 12, timeComplexity: "O(n³)", spaceComplexity: "O(n²)",
      explanation: "Тройной вложенный цикл. Доступ к b[k][j] — скачки по памяти на n*sizeof(f32)=4KB каждый шаг k. Это вызывет cache miss на каждой итерации внутреннего цикла. L1 cache miss = ~4 cycles penalty.",
    },
    optimized: {
      code: `fn matmul_tiled(a: &[f32], b: &[f32], n: usize)
    -> Vec<f32>
{
    const TILE: usize = 64;
    let mut c = vec![0.0f32; n * n];
    let b_packed = pack_matrix(b, n, TILE);

    for i in (0..n).step_by(TILE) {
        for j in (0..n).step_by(TILE) {
            for k in (0..n).step_by(TILE) {
                micro_kernel(
                    &a[i*n..], &b_packed, &mut c[i*n..],
                    n, j, k, TILE,
                );
            }
        }
    }
    c
}

#[inline(always)]
fn micro_kernel(
    a_tile: &[f32], b_packed: &[f32], c_tile: &mut [f32],
    n: usize, j: usize, k: usize, tile: usize,
) {
    let mut ii = 0;
    while ii + 4 <= tile {
        let mut jj = 0;
        while jj + 4 <= tile && j + jj + 4 <= n {
            // 4x4 unrolled micro-kernel
            let mut c00 = c_tile[ii*n + j + jj];
            let mut c01 = c_tile[ii*n + j + jj + 1];
            let mut c02 = c_tile[ii*n + j + jj + 2];
            let mut c03 = c_tile[ii*n + j + jj + 3];

            for kk in 0..tile.min(n - k) {
                let a0 = a_tile[ii * n + k + kk];
                let a1 = a_tile[(ii+1)*n + k + kk];
                let a2 = a_tile[(ii+2)*n + k + kk];
                let a3 = a_tile[(ii+3)*n + k + kk];
                let bi = &b_packed[(k+kk)*n + j+jj..];
                c00 += a0 * bi[0];
                c01 += a0 * bi[1];
                c02 += a0 * bi[2];
                c03 += a0 * bi[3];
                // ... c10-c33 similarly
            }
            c_tile[ii*n + j+jj]     = c00;
            c_tile[ii*n + j+jj + 1] = c01;
            c_tile[ii*n + j+jj + 2] = c02;
            c_tile[ii*n + j+jj + 3] = c03;
            jj += 4;
        }
        ii += 4;
    }
}

fn pack_matrix(b: &[f32], n: usize, _t: usize)
    -> Vec<f32>
{
    b.to_vec()
}`,
      time: 380, memory: 24, timeComplexity: "O(n³)", spaceComplexity: "O(n²)",
      explanation: "Tiling 64×64 помещает рабочие блоки в L1 cache (32KB). Unrolled 4x4 micro-kernel — компилятор auto-vectorizes через AVX2 (8 f32 параллельно). Packed B matrix — column-major порядок для sequential access.",
    },
    techniques: [
      { name: "Cache Tiling", desc: "64×64 блоки (16KB) полностью помещаются в L1 cache (32KB) — нулевые cache misses внутри блока" },
      { name: "Loop Unrolling 4×4", desc: "Развёрнутый micro-kernel даёт компилятору возможность auto-vectorize через AVX2" },
      { name: "Packed Matrix Format", desc: "Матрица B перепакована в column-major порядок для sequential доступа в цикле по k" },
      { name: "Flat array layout", desc: "Vec<f32> вместо Vec<Vec<f32>> — один контiguous allocation, данные в кэше рядом" },
    ],
  },
  {
    id: 5,
    title: "Lock-free очередь для Producer-Consumer",
    subtitle: "Parallelism",
    icon: ArrowRightLeft,
    category: "Параллелизм",
    categoryColor: "bg-[#08bdba]/10 text-[#08bdba]",
    difficulty: "Expert",
    difficultyColor: "bg-[#fa4d56]/10 text-[#fa4d56]",
    problem: "Реализовать bounded MPSC очередь: 8 producer threads, 1 consumer thread, 10M сообщений. Mutex-блокировки создают contention bottleneck.",
    constraints: ["8 producers, 1 consumer", "10M сообщений", "Bounded ring buffer", "Wait-free для producers"],
    baseline: {
      code: `use std::sync::{Arc, Mutex};

struct MutexQueue<T> {
    data: Mutex<Vec<T>>,
}

impl<T> MutexQueue<T> {
    fn new() -> Self {
        Self { data: Mutex::new(Vec::new()) }
    }

    fn push(&self, value: T) {
        self.data.lock().unwrap().push(value);
    }

    fn pop(&self) -> Option<T> {
        self.data.lock().unwrap().pop()
    }
}`,
      time: 12000, memory: 256, timeComplexity: "O(n) + contention", spaceComplexity: "O(n)",
      explanation: "Каждый push/pop захватывает mutex — 8 producers + 1 consumer = постоянные cache line invalidations. При contention: kernel-level thread scheduling, context switches (~10μs каждый), store buffer flush.",
    },
    optimized: {
      code: `use std::sync::atomic::{AtomicUsize, Ordering};
use std::cell::UnsafeCell;
use std::mem::MaybeUninit;

// Cache-line padding — prevents false sharing
#[repr(align(64))]
struct CachePadded<T>(T);

struct LockFreeQueue<T> {
    buffer: UnsafeCell<Vec<MaybeUninit<T>>>,
    capacity: usize,
    mask: usize,
    head: CachePadded<AtomicUsize>,
    tail: CachePadded<AtomicUsize>,
}

unsafe impl<T: Send> Send for LockFreeQueue<T> {}
unsafe impl<T: Send> Sync for LockFreeQueue<T> {}

impl<T> LockFreeQueue<T> {
    fn new(power_of_two: usize) -> Self {
        let cap = power_of_two.next_power_of_two();
        let mut buf = Vec::with_capacity(cap);
        unsafe { buf.set_len(cap); }
        Self {
            buffer: UnsafeCell::new(buf),
            capacity: cap,
            mask: cap - 1,
            head: CachePadded(AtomicUsize::new(0)),
            tail: CachePadded(AtomicUsize::new(0)),
        }
    }

    fn push(&self, value: T) -> bool {
        let tail = self.tail.0.load(Ordering::Relaxed);
        let head = self.head.0.load(Ordering::Acquire);
        if tail.wrapping_sub(head) >= self.capacity {
            return false; // Full
        }
        unsafe {
            let slot = &mut (*self.buffer.get())
                [tail & self.mask];
            slot.write(value);
        }
        self.tail.0.store(
            tail.wrapping_add(1),
            Ordering::Release,
        );
        true
    }

    fn pop(&self) -> Option<T> {
        let head = self.head.0.load(Ordering::Relaxed);
        let tail = self.tail.0.load(Ordering::Acquire);
        if head == tail { return None; }
        let value = unsafe {
            (*self.buffer.get())
                [head & self.mask]
                .assume_init_read()
        };
        self.head.0.store(
            head.wrapping_add(1),
            Ordering::Release,
        );
        Some(value)
    }
}

impl<T> Drop for LockFreeQueue<T> {
    fn drop(&mut self) {
        let h = *self.head.0.get_mut();
        let t = *self.tail.0.get_mut();
        for i in h..t {
            unsafe {
                (*self.buffer.get())
                    [i & self.mask]
                    .assume_init_drop();
            }
        }
    }
}`,
      time: 450, memory: 128, timeComplexity: "O(n) amortized", spaceComplexity: "O(capacity)",
      explanation: "CAS (Compare-And-Swap) операции вместо mutex — нет kernel scheduling, нет context switches. CachePadded (64-byte align) — head и tail на разных cache lines, нулевое false sharing. Release/Acquire ordering — слабее SeqCst, даёт компилятору больше свободы.",
    },
    techniques: [
      { name: "Lock-free CAS", desc: "Atomic operations вместо mutex — нет блокировок, нет context switches, нет kernel involvement" },
      { name: "Cache-line Padding", desc: "#[repr(align(64))] — head и tail на разных cache lines, предотвращает false sharing между CPU ядрами" },
      { name: "Relaxed + Acquire/Release", desc: "Relaxed для локальных нагрузок, Release/Acquire для синхронизации — слабее SeqCst, аналогичная корректность" },
      { name: "Ring Buffer", desc: "Фиксированный буфер с power-of-two capacity — mask вместо modulo, одна аллокация на весь срок жизни" },
    ],
  },
];

/* ─────────────────────── SMALL COMPONENTS ─────────────────────── */

function FadeIn({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 12 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.3, delay }} className={className}>
      {children}
    </motion.div>
  );
}

function CodeBlock({ code, title, variant }: { code: string; title: string; variant: "baseline" | "optimized" }) {
  return (
    <div className="overflow-hidden border border-[#393939]">
      <div className={`px-4 py-2.5 flex items-center justify-between border-b border-[#393939] ${variant === "baseline" ? "bg-[#fa4d56]/10" : "bg-[#4589ff]/10"}`}>
        <div className="flex items-center gap-2">
          <Code2 className={`size-4 ${variant === "baseline" ? "text-[#fa4d56]" : "text-[#4589ff]"}`} />
          <span className={`text-xs font-medium uppercase tracking-wider ${variant === "baseline" ? "text-[#fa4d56]" : "text-[#4589ff]"}`}>{title}</span>
        </div>
        <Badge variant={variant === "baseline" ? "destructive" : "outline"} className="text-[10px] uppercase tracking-wider">
          {variant === "baseline" ? "Naive" : "Optimized"}
        </Badge>
      </div>
      <div className="max-h-[480px] overflow-auto custom-scrollbar bg-[#1a1a1a]">
        <SyntaxHighlighter
          language="rust"
          style={oneDark}
          customStyle={{ margin: 0, padding: "1rem", background: "#1a1a1a", fontSize: "0.8rem", lineHeight: "1.5", fontFamily: "var(--font-ibm-mono), monospace" }}
          showLineNumbers
          lineNumberStyle={{ color: "#4d4d4d", minWidth: "2.5em" }}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}

function BenchChart({ task }: { task: TaskData }) {
  const speedup = (task.baseline.time / task.optimized.time).toFixed(1);
  const memSave = ((1 - task.optimized.memory / task.baseline.memory) * 100).toFixed(0);

  const formatTime = (ms: number) => {
    if (ms >= 1000) return `${(ms / 1000).toFixed(ms >= 10000 ? 0 : 1)}s`;
    return `${ms.toFixed(0)}ms`;
  };

  const chartData = [
    { name: "Время", Baseline: task.baseline.time, Optimized: task.optimized.time },
    { name: "Память (MB)", Baseline: task.baseline.memory, Optimized: task.optimized.memory },
  ];

  return (
    <Card className="h-full bg-[#262626] border-[#393939]">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm uppercase tracking-wider text-[#a8a8a8]">
          <Gauge className="size-4" />
          Benchmark
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#4589ff]/5 p-4 text-center border border-[#4589ff]/20">
            <p className="text-2xl font-bold text-[#4589ff] font-[family-name:var(--font-ibm-mono)]">{speedup}×</p>
            <p className="text-[10px] text-[#8d8d8d] uppercase tracking-wider mt-1">Speedup</p>
          </div>
          <div className="bg-[#42be65]/5 p-4 text-center border border-[#42be65]/20">
            <p className="text-2xl font-bold text-[#42be65] font-[family-name:var(--font-ibm-mono)]">−{memSave}%</p>
            <p className="text-[10px] text-[#8d8d8d] uppercase tracking-wider mt-1">Memory save</p>
          </div>
        </div>

        {/* Detail table */}
        <div className="space-y-2.5 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-[#8d8d8d] flex items-center gap-1.5 text-xs uppercase tracking-wider"><Clock className="size-3.5" /> Baseline</span>
            <span className="font-[family-name:var(--font-ibm-mono)] font-medium text-[#f4f4f4]">{formatTime(task.baseline.time)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#8d8d8d] flex items-center gap-1.5 text-xs uppercase tracking-wider"><Clock className="size-3.5 text-[#42be65]" /> Optimized</span>
            <span className="font-[family-name:var(--font-ibm-mono)] font-medium text-[#42be65]">{formatTime(task.optimized.time)}</span>
          </div>
          <Separator className="bg-[#393939]" />
          <div className="flex items-center justify-between">
            <span className="text-[#8d8d8d] flex items-center gap-1.5 text-xs uppercase tracking-wider"><MemoryStick className="size-3.5" /> Baseline</span>
            <span className="font-[family-name:var(--font-ibm-mono)] font-medium text-[#f4f4f4]">{task.baseline.memory} MB</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#8d8d8d] flex items-center gap-1.5 text-xs uppercase tracking-wider"><MemoryStick className="size-3.5 text-[#42be65]" /> Optimized</span>
            <span className="font-[family-name:var(--font-ibm-mono)] font-medium text-[#42be65]">{task.optimized.memory} MB</span>
          </div>
        </div>

        {/* Chart */}
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} barCategoryGap="20%" barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#393939" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#8d8d8d" }} />
              <YAxis tick={{ fontSize: 11, fill: "#8d8d8d" }} />
              <Bar dataKey="Baseline" fill="#fa4d56" />
              <Bar dataKey="Optimized" fill="#4589ff" />
              <Legend iconSize={8} wrapperStyle={{ fontSize: "11px", color: "#8d8d8d" }} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

function ComplexityBadge({ label, complexity }: { label: string; complexity: string }) {
  const isOk = complexity.includes("n³") || complexity === "O(n×m)";
  const color = isOk
    ? "border-[#fa4d56]/30 text-[#fa4d56] bg-[#fa4d56]/5"
    : complexity === "O(n)" || complexity === "O(n) avg" || complexity === "O(n²)" || complexity === "O(n×m)"
      ? "border-[#f1c21b]/30 text-[#f1c21b] bg-[#f1c21b]/5"
      : "border-[#42be65]/30 text-[#42be65] bg-[#42be65]/5";
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-[family-name:var(--font-ibm-mono)] font-medium px-2 py-0.5 border ${color}`}>
      {label}: {complexity}
    </span>
  );
}

function TaskSection({ task }: { task: TaskData }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = task.icon;
  const speedup = (task.baseline.time / task.optimized.time).toFixed(1);

  return (
    <section id={`task-${task.id}`} className="scroll-mt-20">
      {/* Task Header */}
      <FadeIn>
        <Card
          className="border border-[#393939] bg-[#262626] hover:border-[#4589ff]/50 transition-colors cursor-pointer"
          onClick={() => setExpanded(!expanded)}
        >
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex items-center gap-3 flex-1">
                <div className="size-12 bg-[#4589ff] flex items-center justify-center shrink-0">
                  <Icon className="size-6 text-white" />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <Badge className="bg-[#4589ff] text-white text-[10px]">#{task.id}</Badge>
                    <Badge className={task.difficultyColor}>{task.difficulty}</Badge>
                    <Badge className={task.categoryColor}>{task.category}</Badge>
                    <Badge variant="outline" className="border-[#42be65]/40 text-[#42be65]">
                      <Zap className="size-3 mr-0.5" /> {speedup}× faster
                    </Badge>
                  </div>
                  <CardTitle className="text-base font-semibold">{task.title}</CardTitle>
                </div>
              </div>
              <div className="flex items-center gap-2 text-[#8d8d8d] sm:pr-2">
                {expanded ? <ChevronUp className="size-5" /> : <ChevronDown className="size-5" />}
              </div>
            </div>
          </CardHeader>
        </Card>
      </FadeIn>

      {/* Expanded Content */}
      {expanded && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mt-4 space-y-4"
        >
          {/* Problem Statement */}
          <FadeIn delay={0.05}>
            <Card className="bg-[#262626] border-[#393939]">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm uppercase tracking-wider text-[#a8a8a8]">
                  <Target className="size-4" />
                  Problem Statement
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm leading-relaxed text-[#c6c6c6]">{task.problem}</p>
                <div className="flex flex-wrap gap-2">
                  {task.constraints.map((c, i) => (
                    <Badge key={i} variant="outline" className="text-[11px] font-normal border-[#393939] text-[#8d8d8d]">
                      <Shield className="size-3 mr-1" /> {c}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </FadeIn>

          {/* Code Comparison + Bench Chart */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <Tabs defaultValue="baseline" className="w-full">
              <TabsList className="w-full bg-[#262626] border border-[#393939]">
                <TabsTrigger value="baseline" className="flex-1 text-xs uppercase tracking-wider">
                  <XCircle className="size-3.5 mr-1 text-[#fa4d56]" /> Baseline
                </TabsTrigger>
                <TabsTrigger value="optimized" className="flex-1 text-xs uppercase tracking-wider">
                  <CheckCircle2 className="size-3.5 mr-1 text-[#4589ff]" /> Optimized
                </TabsTrigger>
              </TabsList>
              <TabsContent value="baseline" className="mt-3">
                <CodeBlock code={task.baseline.code} title={`Naive — ${task.title}`} variant="baseline" />
              </TabsContent>
              <TabsContent value="optimized" className="mt-3">
                <CodeBlock code={task.optimized.code} title={`Optimized — ${task.title}`} variant="optimized" />
              </TabsContent>
            </Tabs>
            <BenchChart task={task} />
          </div>

          {/* Big O Analysis */}
          <FadeIn delay={0.1}>
            <Card className="bg-[#262626] border-[#393939]">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm uppercase tracking-wider text-[#a8a8a8]">
                  <GitCompareArrows className="size-4" />
                  Big O Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-[#fa4d56]/5 p-4 border border-[#fa4d56]/20">
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#fa4d56] mb-2">Baseline</p>
                    <div className="flex flex-wrap gap-2">
                      <ComplexityBadge label="Time" complexity={task.baseline.timeComplexity} />
                      <ComplexityBadge label="Space" complexity={task.baseline.spaceComplexity} />
                    </div>
                    <p className="text-xs text-[#8d8d8d] mt-2 leading-relaxed">{task.baseline.explanation}</p>
                  </div>
                  <div className="bg-[#4589ff]/5 p-4 border border-[#4589ff]/20">
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#4589ff] mb-2">Optimized</p>
                    <div className="flex flex-wrap gap-2">
                      <ComplexityBadge label="Time" complexity={task.optimized.timeComplexity} />
                      <ComplexityBadge label="Space" complexity={task.optimized.spaceComplexity} />
                    </div>
                    <p className="text-xs text-[#8d8d8d] mt-2 leading-relaxed">{task.optimized.explanation}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </FadeIn>

          {/* Key Optimizations */}
          <FadeIn delay={0.15}>
            <Card className="bg-[#262626] border-[#393939]">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm uppercase tracking-wider text-[#a8a8a8]">
                  <BookOpen className="size-4" />
                  Key Optimizations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {task.techniques.map((t, i) => (
                    <div key={i} className="bg-[#161616] p-3 border border-[#393939]">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="size-2 bg-[#4589ff]" />
                        <p className="text-sm font-semibold">{t.name}</p>
                      </div>
                      <p className="text-xs text-[#8d8d8d] leading-relaxed">{t.desc}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </FadeIn>
        </motion.div>
      )}
    </section>
  );
}

/* ─────────────────────── MAIN PAGE ─────────────────────── */

export default function PerformanceLab() {
  const [activeSection, setActiveSection] = useState<string>("hero");
  const sectionsRef = useRef<Record<string, HTMLElement | null>>({});

  const registerSection = useCallback((id: string) => (el: HTMLElement | null) => {
    sectionsRef.current[id] = el;
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY + 120;
      let current = "hero";
      const ids = Object.keys(sectionsRef.current).sort(
        (a, b) => (sectionsRef.current[a]?.offsetTop ?? 0) - (sectionsRef.current[b]?.offsetTop ?? 0)
      );
      for (const id of ids) {
        if (sectionsRef.current[id] && sectionsRef.current[id]!.offsetTop <= scrollY) current = id;
      }
      setActiveSection(current);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

  const navItems = [
    { id: "hero", label: "Обзор" },
    ...TASKS.map(t => ({ id: `task-${t.id}`, label: `#${t.id}` })),
    { id: "methodology", label: "Методология" },
    { id: "results", label: "Результаты" },
  ];

  const totalSpeedup = TASKS.reduce((a, t) => a + t.baseline.time / t.optimized.time, 0);
  const avgMemSave = Math.round(TASKS.reduce((a, t) => a + (1 - t.optimized.memory / t.baseline.memory), 0) / TASKS.length * 100);

  return (
    <div className="min-h-screen flex flex-col bg-[#161616]">
      {/* ─── STICKY HEADER ─── */}
      <header className="sticky top-0 z-50 bg-[#161616] border-b border-[#393939]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-12">
            <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar max-w-[75vw]">
              {navItems.map((item) => (
                <Button
                  key={item.id}
                  variant={activeSection === item.id ? "default" : "ghost"}
                  size="sm"
                  className="text-xs shrink-0 h-8 uppercase tracking-wider"
                  onClick={() => scrollTo(item.id)}
                >
                  {item.label}
                </Button>
              ))}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Badge variant="outline" className="hidden sm:inline-flex text-[#a8a8a8] border-[#393939] text-[10px]">
                <Cpu className="size-3 mr-1" /> 5 Tasks
              </Badge>
              <Badge variant="outline" className="hidden sm:inline-flex text-[#a8a8a8] border-[#393939] text-[10px]">
                Rust
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* ─── MAIN ─── */}
      <main className="flex-1 mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* ═══ HERO SECTION ═══ */}
        <section ref={registerSection("hero")} id="hero">
          <div className="bg-[#0f62fe] p-6 sm:p-10">
            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="size-12 bg-white/10 flex items-center justify-center border border-white/20">
                    <Zap className="size-7 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight uppercase">Performance Lab</h1>
                    <p className="text-blue-200 text-xs uppercase tracking-wider mt-0.5">5 задач на высокопроизводительный код</p>
                  </div>
                </div>
                <p className="text-white/70 text-sm sm:text-base max-w-2xl leading-relaxed mt-4">
                  Каждый challenge — реальная задача системного программирования. Naive vs Optimized подход на Rust с анализом Big O, бенчмарками и объяснением каждой оптимизации.
                </p>
              </div>

              {/* Stats */}
              <div className="flex flex-wrap gap-3">
                {[
                  { icon: Layers, val: "5", label: "Tasks" },
                  { icon: Gauge, val: `${totalSpeedup.toFixed(0)}×`, label: "Total speedup" },
                  { icon: MemoryStick, val: `${avgMemSave}%`, label: "Avg memory save" },
                  { icon: Cpu, val: "Rust", label: "Language" },
                ].map((s, i) => {
                  const SIcon = s.icon;
                  return (
                    <div key={i} className="bg-white/5 px-4 py-2.5 border border-white/10">
                      <div className="flex items-center gap-2">
                        <SIcon className="size-4 text-white/60" />
                        <span className="text-xl font-bold text-white font-[family-name:var(--font-ibm-mono)]">{s.val}</span>
                        <span className="text-[10px] text-white/50 uppercase tracking-wider">{s.label}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Task Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
                {TASKS.map((t) => {
                  const TIcon = t.icon;
                  const sp = (t.baseline.time / t.optimized.time).toFixed(1);
                  return (
                    <button
                      key={t.id}
                      onClick={() => scrollTo(`task-${t.id}`)}
                      className="bg-white/5 p-4 border border-white/10 hover:bg-white/10 transition-colors text-left group"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <TIcon className="size-4 text-white/60 group-hover:text-white transition-colors" />
                        <Badge className="bg-white/10 text-white/80 text-[10px] border-white/10">#{t.id}</Badge>
                        <Badge className={`${t.difficultyColor} text-[10px]`}>{t.difficulty}</Badge>
                      </div>
                      <p className="text-white/80 text-xs font-medium line-clamp-2 leading-relaxed">{t.title}</p>
                      <p className="text-white font-bold mt-2 font-[family-name:var(--font-ibm-mono)]">{sp}×</p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* ═══ TASK SECTIONS ═══ */}
        <div className="space-y-8">
          {TASKS.map((task) => (
            <TaskSection key={task.id} task={task} />
          ))}
        </div>

        {/* ═══ METHODOLOGY ═══ */}
        <section ref={registerSection("methodology")} id="methodology">
          <FadeIn>
            <Card className="border border-[#393939] bg-[#262626] border-l-4 border-l-[#4589ff]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg uppercase tracking-wider">
                  <Brain className="size-5 text-[#4589ff]" />
                  8 принципов high-performance кода
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
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
                      <div key={i} className="bg-[#161616] p-3 border border-[#393939] hover:border-[#4589ff]/30 transition-colors">
                        <PIcon className="size-5 text-[#4589ff] mb-2" />
                        <p className="text-sm font-semibold uppercase tracking-wider text-[#f4f4f4]">{p.title}</p>
                        <p className="text-xs text-[#8d8d8d] mt-1 leading-relaxed">{p.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </FadeIn>
        </section>

        {/* ═══ RESULTS TABLE ═══ */}
        <section ref={registerSection("results")} id="results">
          <FadeIn>
            <Card className="bg-[#262626] border-[#393939]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg uppercase tracking-wider">
                  <Gauge className="size-5 text-[#4589ff]" />
                  Сводная таблица результатов
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Results Table */}
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#393939]">
                        <th className="text-left py-2 pr-4 text-[#8d8d8d]">#</th>
                        <th className="text-left py-2 pr-4 text-[#8d8d8d]">Task</th>
                        <th className="text-right py-2 px-3 text-[#8d8d8d]">Baseline</th>
                        <th className="text-right py-2 px-3 text-[#8d8d8d]">Optimized</th>
                        <th className="text-right py-2 px-3 text-[#8d8d8d]">Speedup</th>
                        <th className="text-right py-2 text-[#8d8d8d]">Memory save</th>
                      </tr>
                    </thead>
                    <tbody>
                      {TASKS.map((t) => {
                        const sp = (t.baseline.time / t.optimized.time).toFixed(1);
                        const ms = ((1 - t.optimized.memory / t.baseline.memory) * 100).toFixed(0);
                        const formatT = (v: number) => v >= 1000 ? `${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}s` : `${v}ms`;
                        return (
                          <tr key={t.id} className="border-b border-[#393939]/50 hover:bg-[#161616] transition-colors">
                            <td className="py-2.5 pr-4">
                              <Badge variant="outline" className="text-[10px] border-[#393939] text-[#8d8d8d]">#{t.id}</Badge>
                            </td>
                            <td className="py-2.5 pr-4 max-w-[200px]">
                              <p className="font-medium text-[#c6c6c6] truncate">{t.title}</p>
                              <Badge variant="secondary" className="text-[9px] mt-0.5 bg-[#393939] text-[#8d8d8d]">{t.difficulty}</Badge>
                            </td>
                            <td className="py-2.5 px-3 text-right font-[family-name:var(--font-ibm-mono)] text-[#fa4d56]">{formatT(t.baseline.time)}</td>
                            <td className="py-2.5 px-3 text-right font-[family-name:var(--font-ibm-mono)] text-[#42be65]">{formatT(t.optimized.time)}</td>
                            <td className="py-2.5 px-3 text-right">
                              <span className="font-bold text-[#42be65] font-[family-name:var(--font-ibm-mono)]">{sp}×</span>
                            </td>
                            <td className="py-2.5 text-right">
                              <span className="font-medium text-[#08bdba] font-[family-name:var(--font-ibm-mono)]">-{ms}%</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Speedup Chart - Horizontal bars */}
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={TASKS.map(t => ({
                        name: `#${t.id}`,
                        speedup: parseFloat((t.baseline.time / t.optimized.time).toFixed(1)),
                        memory: parseFloat(((1 - t.optimized.memory / t.baseline.memory) * 100).toFixed(0)),
                      }))}
                      layout="vertical"
                      barCategoryGap="15%"
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#393939" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 11, fill: "#8d8d8d" }} />
                      <YAxis dataKey="name" type="category" width={35} tick={{ fontSize: 12, fill: "#c6c6c6" }} />
                      <Bar dataKey="speedup" name="Speedup (x)" fill="#4589ff" />
                      <Bar dataKey="memory" name="Memory save (%)" fill="#08bdba" />
                      <Legend iconSize={8} wrapperStyle={{ fontSize: "11px", color: "#8d8d8d" }} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </FadeIn>
        </section>

        {/* ═══ SUMMARY ═══ */}
        <section ref={registerSection("summary")} id="summary">
          <FadeIn>
            <Card className="border border-[#393939] bg-[#262626] border-l-4 border-l-[#4589ff]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg uppercase tracking-wider">
                  <Award className="size-5 text-[#4589ff]" />
                  Итоги Performance Lab
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  {TASKS.map((t) => {
                    const sp = (t.baseline.time / t.optimized.time).toFixed(1);
                    return (
                      <div key={t.id} className="text-center p-3 bg-[#161616] border border-[#393939]">
                        <p className="text-2xl font-bold text-[#4589ff] font-[family-name:var(--font-ibm-mono)]">{sp}×</p>
                        <p className="text-[10px] text-[#8d8d8d] uppercase tracking-wider mt-1">#{t.id}</p>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-4 bg-[#4589ff]/5 p-4 border border-[#4589ff]/20">
                  <p className="text-sm text-[#c6c6c6] leading-relaxed">
                    <span className="font-semibold uppercase tracking-wider text-[#f4f4f4]">8 принципов performance-code-generator:</span>{" "}
                    Big O оптимизация → Кэш-локальность (Data-Oriented Design) → Минимизация аллокаций → Async I/O → Lock-free конкурентность → Zero-cost абстракции → SIMD векторизация → Профилирование («Измеряй, а не гадай»).
                  </p>
                  <div className="flex items-center gap-2 mt-3">
                    <Zap className="size-4 text-[#4589ff]" />
                    <span className="text-xs text-[#8d8d8d] uppercase tracking-wider">
                      Total speedup across all tasks: <span className="text-[#4589ff] font-bold font-[family-name:var(--font-ibm-mono)]">{totalSpeedup.toFixed(0)}×</span>
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </FadeIn>
        </section>
      </main>

      {/* ─── FOOTER ─── */}
      <footer className="mt-auto border-t border-[#393939] bg-[#161616]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-[#8d8d8d] uppercase tracking-wider">Performance Lab</p>
          <p className="text-xs text-[#6f6f6f] uppercase tracking-wider">Rust | SIMD | Lock-free | Zero-copy</p>
        </div>
      </footer>
    </div>
  );
}
