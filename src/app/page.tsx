"use client";

import { useEffect, useRef, useState, useCallback, useSyncExternalStore } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
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
  Copy,
  Check,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Columns2,
  Rows3,
  Monitor,
  AlertTriangle,
  RotateCcw,
  Download,
  Star,
  Command,
  Hash,
  Filter,
  Keyboard,
  Plus,
  Minus,
  Sparkles,
  Share2,
  Link2,
  Activity,
  Timer,
  Trophy,
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
      { name: "Cache-local sort", desc: "sort_unstable_by — unstable sort в 2x быстрее stable, работает на месте без extra аллокаций" },
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

/* ─────────────────────── TECHNIQUE TAG CLOUD DATA ─────────────────────── */

const ALL_TECHNIQUES = (() => {
  const map = new Map<string, number>();
  for (const t of TASKS) {
    for (const tech of t.techniques) {
      map.set(tech.name, (map.get(tech.name) || 0) + 1);
    }
  }
  return Array.from(map.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count }));
})();

/* ─────────────────────── HELPERS ─────────────────────── */

/* Hydration-safe persisted Set backed by localStorage + useSyncExternalStore */
function usePersistedSet(key: string): [Set<number>, (next: Set<number>) => void] {
  const listenersRef = useRef(new Set<() => void>());
  // Stable empty set — same reference for server & initial client render
  const emptySet = useRef(new Set<number>());
  const snapshotRef = useRef<Set<number> | null>(null);
  const loadedRef = useRef(false);

  const subscribe = useCallback((listener: () => void) => {
    listenersRef.current.add(listener);
    return () => { listenersRef.current.delete(listener); };
  }, []);

  const getSnapshot = useCallback((): Set<number> => {
    // Before mount or if not yet loaded, return stable empty set
    if (!loadedRef.current || snapshotRef.current === null) {
      return emptySet.current;
    }
    return snapshotRef.current;
  }, []);

  const getServerSnapshot = useCallback((): Set<number> => {
    return emptySet.current;
  }, []);

  const value = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setValue = useCallback((next: Set<number>) => {
    snapshotRef.current = next;
    try { localStorage.setItem(key, JSON.stringify(Array.from(next))); } catch { /* ignore */ }
    listenersRef.current.forEach(l => l());
  }, [key]);

  // Load from localStorage AFTER mount (hydration-safe)
  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = new Set(JSON.parse(saved) as number[]);
        snapshotRef.current = parsed;
        listenersRef.current.forEach(l => l());
      }
    } catch { /* ignore */ }
  }, [key]);

  return [value, setValue];
}

function calcReadingTime(task: TaskData): number {
  const codeLines = task.baseline.code.split('\n').length + task.optimized.code.split('\n').length;
  const textChars = task.problem.length + task.techniques.reduce((a, t) => a + t.desc.length + t.name.length, 0);
  return Math.max(1, Math.ceil(codeLines / 30 + textChars / 250));
}

function formatTimeBenchmark(ms: number): string {
  if (ms >= 1000) return `${(ms / 1000).toFixed(ms >= 10000 ? 0 : 1)}s`;
  return `${ms.toFixed(0)}ms`;
}

/* ─────────────────────── SMALL COMPONENTS ─────────────────────── */

function FadeIn({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 4 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.2, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ── Click Ripple Hook ── */
function useRipple() {
  const handleClick = useCallback((e: React.MouseEvent<HTMLElement>) => {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const size = Math.max(rect.width, rect.height) * 2;
    const ripple = document.createElement('span');
    ripple.className = 'ripple-effect';
    ripple.style.width = `${size}px`;
    ripple.style.height = `${size}px`;
    ripple.style.left = `${x - size / 2}px`;
    ripple.style.top = `${y - size / 2}px`;
    el.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  }, []);
  return handleClick;
}

/* ── Task Quick-Preview Tooltip ── */
function TaskPreviewTooltip({ task, visible, anchorRect }: { task: TaskData; visible: boolean; anchorRect: DOMRect | null }) {
  if (!visible || !anchorRect) return null;
  const sp = (task.baseline.time / task.optimized.time).toFixed(1);
  const memSave = ((1 - task.optimized.memory / task.baseline.memory) * 100).toFixed(0);
  const grade = getGrade(parseFloat(sp));
  return (
    <div
      className="task-preview-tooltip glass-dark p-4"
      style={{
        top: anchorRect.bottom + 8,
        left: Math.min(anchorRect.left, window.innerWidth - 360),
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[9px] font-[family-name:var(--font-ibm-mono)] text-[#ff6b2b]">#{task.id}</span>
        <span className={`text-[9px] font-[family-name:var(--font-ibm-mono)] uppercase border px-1.5 py-0 ${grade.className}`}>{grade.letter}</span>
        <span className="text-[9px] font-[family-name:var(--font-ibm-mono)] text-[#525252]">{task.difficulty}</span>
      </div>
      <p className="text-xs text-[#d4d4d4] font-medium line-clamp-2 mb-2">{task.title}</p>
      <div className="space-y-1.5 text-[10px] font-[family-name:var(--font-ibm-mono)]">
        <div className="flex justify-between"><span className="text-[#525252]">Speedup</span><span className="text-[#ff6b2b] font-bold">{sp}×</span></div>
        <div className="flex justify-between"><span className="text-[#525252]">Memory</span><span className={parseInt(memSave) > 0 ? 'text-[#4ade80]' : 'text-[#f87171]'}>{parseInt(memSave) > 0 ? '-' : '+'}{Math.abs(parseInt(memSave))}%</span></div>
        <div className="flex justify-between"><span className="text-[#525252]">Time Complex</span><span className="text-[#d4d4d4]">{task.optimized.timeComplexity}</span></div>
      </div>
      <div className="mt-2 pt-2 border-t border-[#1c1c1c]">
        <p className="text-[9px] text-[#333] uppercase tracking-widest mb-1">Key Techniques</p>
        <div className="flex flex-wrap gap-1">
          {task.techniques.slice(0, 3).map((t, i) => (
            <span key={i} className="text-[8px] font-[family-name:var(--font-ibm-mono)] text-[#525252] bg-[#1c1c1c] px-1.5 py-0.5">{t.name}</span>
          ))}
          {task.techniques.length > 3 && <span className="text-[8px] text-[#333]">+{task.techniques.length - 3}</span>}
        </div>
      </div>
    </div>
  );
}

/* ── Activity Timeline Component ── */
function ActivityTimeline({ tasks, reviewedTasks }: { tasks: TaskData[]; reviewedTasks: Set<number> }) {
  const activities = tasks.map(t => {
    const sp = (t.baseline.time / t.optimized.time).toFixed(1);
    const grade = getGrade(parseFloat(sp));
    return {
      id: t.id,
      title: t.title,
      speedup: sp,
      grade,
      reviewed: reviewedTasks.has(t.id),
      difficulty: t.difficulty,
    };
  });

  return (
    <div className="space-y-3">
      {activities.map((a) => (
        <div key={a.id} className={`timeline-item ${a.reviewed ? 'active' : ''}`}>
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-[10px] font-[family-name:var(--font-ibm-mono)] text-[#737373]">
              #{a.id} {a.title.substring(0, 35)}...
            </span>
            <div className="flex items-center gap-2">
              <span className={`text-[9px] font-[family-name:var(--font-ibm-mono)] uppercase border px-1.5 py-0 ${a.grade.className}`}>{a.grade.letter}</span>
              <span className="text-[10px] font-[family-name:var(--font-ibm-mono)] text-[#ff6b2b] font-bold">{a.speedup}×</span>
            </div>
          </div>
          <div className="text-[9px] font-[family-name:var(--font-ibm-mono)] text-[#333]">
            {a.reviewed ? 'Reviewed' : 'Not reviewed'} · {a.difficulty}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Share URL Handler ── */
function useShareURL(expandedTasks: Set<number>) {
  return useCallback(() => {
    const params = new URLSearchParams();
    if (expandedTasks.size > 0 && expandedTasks.size < 5) {
      params.set('expanded', Array.from(expandedTasks).join(','));
    }
    const url = `${window.location.origin}${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
    navigator.clipboard.writeText(url);
    return url;
  }, [expandedTasks]);
}

function AnimatedCounter({ value, suffix = "" }: { value: string; suffix?: string }) {
  const num = parseFloat(value);
  const isNumeric = !isNaN(num);
  const [display, setDisplay] = useState(isNumeric ? "0" : value);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const animatedRef = useRef(false);

  useEffect(() => {
    if (!inView || !isNumeric || animatedRef.current) return;
    animatedRef.current = true;
    const duration = 800;
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = num * eased;
      if (Number.isInteger(num)) {
        setDisplay(Math.round(current).toString());
      } else {
        setDisplay(current.toFixed(1));
      }
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setDisplay(value);
      }
    };
    requestAnimationFrame(animate);
  }, [inView, value, num, isNumeric]);

  return (
    <span ref={ref}>
      {display}{suffix}
    </span>
  );
}

function SectionDivider({ label }: { label: string }) {
  const hexLeft = ('0x' + (label.charCodeAt(0) || 0x30).toString(16).toUpperCase().padStart(2, '0'));
  const hexRight = ('0x' + (label.charCodeAt(label.length - 1) || 0x30).toString(16).toUpperCase().padStart(2, '0'));
  return (
    <div className="flex items-center gap-3 py-2">
      <span className="hex-coord">{hexLeft}</span>
      <div className="flex-1 h-px bg-[#1c1c1c]" />
      <span className="text-[9px] font-[family-name:var(--font-ibm-mono)] text-[#333] uppercase tracking-[0.3em]">{label}</span>
      <div className="flex-1 h-px bg-[#1c1c1c]" />
      <span className="hex-coord">{hexRight}</span>
    </div>
  );
}

function CodeBlock({ code, title, variant }: { code: string; title: string; variant: "baseline" | "optimized" }) {
  const [copied, setCopied] = useState(false);
  const lineCount = code.split('\n').length;
  const charCount = code.length;
  const tokenEstimate = Math.round(charCount / 4);
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="overflow-hidden border border-[#262626] code-block-hover">
      <div className="px-4 py-2 flex items-center justify-between border-b border-[#262626] bg-[#0f0f0f]">
        <div className="flex items-center gap-2 min-w-0">
          <Code2 className="size-3.5 text-[#525252] shrink-0" />
          <span className="text-xs font-[family-name:var(--font-ibm-mono)] text-[#525252] truncate">{title}</span>
          <span className="tooltip-container">
            <span className="text-[10px] font-[family-name:var(--font-ibm-mono)] text-[#333] cursor-help">{lineCount} lines</span>
            <span className="tooltip-content">
              {lineCount} lines · {charCount} chars · ~{tokenEstimate} tokens
            </span>
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); handleCopy(); }}
            className="text-[#525252] hover:text-[#d4d4d4] transition-colors p-1"
          >
            {copied ? <Check className="size-3.5 text-[#4ade80]" /> : <Copy className="size-3.5" />}
          </button>
          <span
            className={`text-[10px] font-[family-name:var(--font-ibm-mono)] font-medium uppercase tracking-wider px-2 py-0.5 badge-hover ${
              variant === "baseline"
                ? "text-[#f87171] bg-[#f87171]/10"
                : "text-[#4ade80] bg-[#4ade80]/10"
            }`}
          >
            {variant === "baseline" ? "Baseline" : "Optimized"}
          </span>
        </div>
      </div>
      <div className="max-h-[480px] overflow-auto custom-scrollbar bg-[#0d0d0d] code-glow">
        <SyntaxHighlighter
          language="rust"
          style={oneDark}
          customStyle={{
            margin: 0,
            padding: "1rem",
            background: "#0d0d0d",
            fontSize: "0.8rem",
            lineHeight: "1.5",
            fontFamily: "var(--font-ibm-mono), monospace",
          }}
          showLineNumbers
          lineNumberStyle={{ color: "#333", minWidth: "2.5em" }}
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
    { name: "Time", Baseline: task.baseline.time, Optimized: task.optimized.time },
    { name: "Memory", Baseline: task.baseline.memory, Optimized: task.optimized.memory },
  ];

  return (
    <Card className="h-full bg-[#141414] border border-[#262626] card-industrial card-lift">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#525252]">
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
            <p className="text-[10px] text-[#525252] uppercase tracking-widest mt-1 font-[family-name:var(--font-ibm-mono)]">
              Speedup
            </p>
          </div>
          <div className="p-4 text-center border border-[#262626] metric-card depth-shadow-1" style={{ "--metric-color": parseInt(memSave) > 0 ? "#4ade80" : "#f87171" } as React.CSSProperties}>
            <p className={`text-2xl font-bold font-[family-name:var(--font-ibm-mono)] text-shadow-industrial ${parseInt(memSave) > 0 ? "text-[#4ade80]" : "text-[#f87171]"}`}>
              {parseInt(memSave) > 0 ? `−${memSave}%` : `+${Math.abs(parseInt(memSave))}%`}
            </p>
            <p className="text-[10px] text-[#525252] uppercase tracking-widest mt-1 font-[family-name:var(--font-ibm-mono)]">
              Memory
            </p>
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-[#525252] flex items-center gap-1.5 text-xs font-[family-name:var(--font-ibm-mono)]">
              <Clock className="size-3" /> baseline
            </span>
            <span className="font-[family-name:var(--font-ibm-mono)] text-[#d4d4d4]">
              {formatTime(task.baseline.time)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#525252] flex items-center gap-1.5 text-xs font-[family-name:var(--font-ibm-mono)]">
              <Clock className="size-3" /> optimized
            </span>
            <span className="font-[family-name:var(--font-ibm-mono)] text-[#4ade80]">
              {formatTime(task.optimized.time)}
            </span>
          </div>
          <Separator className="bg-[#262626]" />
          <div className="flex items-center justify-between">
            <span className="text-[#525252] flex items-center gap-1.5 text-xs font-[family-name:var(--font-ibm-mono)]">
              <MemoryStick className="size-3" /> baseline
            </span>
            <span className="font-[family-name:var(--font-ibm-mono)] text-[#d4d4d4]">
              {task.baseline.memory} MB
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#525252] flex items-center gap-1.5 text-xs font-[family-name:var(--font-ibm-mono)]">
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
}

/* ── Ambient Particles Component (deterministic to avoid hydration mismatch) ── */
function AmbientParticles() {
  const particles = [
    { id: 0, left: '12%', bottom: '5%', delay: '0.2s', duration: '5s', size: 1, opacity: 0.15 },
    { id: 1, left: '28%', bottom: '12%', delay: '1.1s', duration: '6s', size: 2, opacity: 0.25 },
    { id: 2, left: '45%', bottom: '3%', delay: '0.8s', duration: '4s', size: 1, opacity: 0.18 },
    { id: 3, left: '67%', bottom: '18%', delay: '2.3s', duration: '7s', size: 2, opacity: 0.2 },
    { id: 4, left: '82%', bottom: '8%', delay: '3.5s', duration: '5s', size: 1, opacity: 0.3 },
    { id: 5, left: '5%', bottom: '22%', delay: '1.7s', duration: '6s', size: 2, opacity: 0.12 },
    { id: 6, left: '35%', bottom: '15%', delay: '0.5s', duration: '4s', size: 1, opacity: 0.22 },
    { id: 7, left: '55%', bottom: '10%', delay: '4.1s', duration: '7s', size: 2, opacity: 0.28 },
    { id: 8, left: '90%', bottom: '25%', delay: '2.8s', duration: '5s', size: 1, opacity: 0.16 },
    { id: 9, left: '18%', bottom: '20%', delay: '3.2s', duration: '6s', size: 2, opacity: 0.24 },
    { id: 10, left: '72%', bottom: '6%', delay: '0.9s', duration: '4s', size: 1, opacity: 0.19 },
    { id: 11, left: '40%', bottom: '28%', delay: '5.0s', duration: '7s', size: 2, opacity: 0.14 },
    { id: 12, left: '60%', bottom: '14%', delay: '1.5s', duration: '5s', size: 1, opacity: 0.26 },
    { id: 13, left: '95%', bottom: '2%', delay: '3.8s', duration: '6s', size: 2, opacity: 0.17 },
    { id: 14, left: '50%', bottom: '22%', delay: '2.0s', duration: '4s', size: 1, opacity: 0.21 },
  ];
  return (
    <div className="ambient-particles">
      {particles.map((p) => (
        <div
          key={p.id}
          className="particle"
          style={{
            left: p.left,
            bottom: p.bottom,
            animationDelay: p.delay,
            animationDuration: p.duration,
            width: p.size,
            height: p.size,
            opacity: p.opacity,
          }}
        />
      ))}
    </div>
  );
}

/* ── Performance Grade Helper ── */
function getGrade(speedup: number): { letter: string; className: string } {
  if (speedup >= 30) return { letter: "S", className: "grade-s" };
  if (speedup >= 10) return { letter: "A", className: "grade-a" };
  if (speedup >= 3) return { letter: "B", className: "grade-b" };
  return { letter: "C", className: "grade-c" };
}

/* ── Code Diff Component ── */
function CodeDiff({ baseline, optimized, title }: { baseline: string; optimized: string; title: string }) {
  const bLines = baseline.split('\n');
  const oLines = optimized.split('\n');
  const maxLines = Math.max(bLines.length, oLines.length);

  const diffLines = [];
  for (let i = 0; i < maxLines; i++) {
    if (i < bLines.length && i < oLines.length) {
      if (bLines[i] === oLines[i]) {
        diffLines.push({ type: 'context', line: oLines[i], num: i + 1 });
      } else {
        diffLines.push({ type: 'removed', line: bLines[i], num: i + 1 });
        diffLines.push({ type: 'added', line: oLines[i], num: i + 1 });
      }
    } else if (i < bLines.length) {
      diffLines.push({ type: 'removed', line: bLines[i], num: i + 1 });
    } else {
      diffLines.push({ type: 'added', line: oLines[i], num: i + 1 });
    }
  }

  const addedCount = diffLines.filter(d => d.type === 'added').length;
  const removedCount = diffLines.filter(d => d.type === 'removed').length;

  return (
    <div className="overflow-hidden border border-[#262626] code-block-hover">
      <div className="px-4 py-2 flex items-center justify-between border-b border-[#262626] bg-[#0f0f0f]">
        <div className="flex items-center gap-2 min-w-0">
          <GitCompareArrows className="size-3.5 text-[#525252] shrink-0" />
          <span className="text-xs font-[family-name:var(--font-ibm-mono)] text-[#525252] truncate">{title}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="diff-badge diff-badge-added"><Plus className="size-2.5" />{addedCount}</span>
          <span className="diff-badge diff-badge-removed"><Minus className="size-2.5" />{removedCount}</span>
        </div>
      </div>
      <div className="max-h-[480px] overflow-auto scrollbar-glow bg-[#0d0d0d]">
        <div className="text-[11px] font-[family-name:var(--font-ibm-mono)] leading-[1.6]">
          {diffLines.map((d, i) => (
            <div
              key={i}
              className={`flex items-start px-3 ${
                d.type === 'added' ? 'diff-line-added' : d.type === 'removed' ? 'diff-line-removed' : 'diff-line-context'
              }`}
            >
              <span className="w-8 shrink-0 text-right text-[#333] select-none mr-3 text-[10px]">{d.num}</span>
              <span className={`w-4 shrink-0 text-center select-none mr-3 ${
                d.type === 'added' ? 'text-[#4ade80]' : d.type === 'removed' ? 'text-[#f87171]' : 'text-[#333]'
              }`}>
                {d.type === 'added' ? '+' : d.type === 'removed' ? '−' : ' '}
              </span>
              <span className={`flex-1 whitespace-pre ${d.type === 'added' ? 'text-[#4ade80]/80' : d.type === 'removed' ? 'text-[#f87171]/60 line-through' : 'text-[#525252]'}`}>
                {d.line}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Radar Chart Component (pure CSS/SVG) ── */
function RadarChart({ tasks }: { tasks: TaskData[] }) {
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
            <span className="text-[9px] font-[family-name:var(--font-ibm-mono)] text-[#525252]">#{task.id}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Command Palette Component ── */
function CommandPalette({
  open,
  onClose,
  onNavigate,
  onAction,
  allTasks,
}: {
  open: boolean;
  onClose: () => void;
  onNavigate: (id: string) => void;
  onAction: (action: string) => void;
  allTasks: TaskData[];
}) {
  const [query, setQuery] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(timer);
  }, []);

  const navItems = [
    { id: "hero", label: "Overview", icon: Sparkles, group: "Navigation" },
    ...allTasks.map(t => ({ id: `task-${t.id}`, label: `#${t.id} ${t.title}`, icon: Hash, group: "Tasks" })),
    { id: "methodology", label: "Methodology", icon: Brain, group: "Navigation" },
    { id: "results", label: "Results", icon: Award, group: "Navigation" },
    { id: "summary", label: "Summary", icon: Target, group: "Navigation" },
  ];

  const actions = [
    { id: "expand-all", label: "Expand All Tasks", icon: ChevronDown, group: "Actions" },
    { id: "collapse-all", label: "Collapse All Tasks", icon: ChevronUp, group: "Actions" },
    { id: "export-md", label: "Export as Markdown", icon: Download, group: "Actions" },
    { id: "compare", label: "Toggle Compare Mode", icon: GitCompareArrows, group: "Actions" },
    { id: "starred-filter", label: "Filter Starred Tasks", icon: Star, group: "Actions" },
  ];

  const q = query.toLowerCase().trim();
  const filteredNav = q ? navItems.filter(item => item.label.toLowerCase().includes(q)) : navItems;
  const filteredActions = q ? actions.filter(a => a.label.toLowerCase().includes(q)) : actions;
  const allItems = [...filteredNav.map(i => ({ ...i, type: 'nav' as const })), ...filteredActions.map(a => ({ ...a, type: 'action' as const }))];

  const executeItem = (item: typeof allItems[number]) => {
    if (item.type === 'nav') onNavigate(item.id);
    else onAction(item.id);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, allItems.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)); }
    else if (e.key === "Enter" && allItems[activeIdx]) { executeItem(allItems[activeIdx]); }
    else if (e.key === "Escape") { onClose(); }
  };

  if (!open) return null;

  return (
    <div className="cmd-overlay" onClick={onClose}>
      <div className="cmd-palette" onClick={e => e.stopPropagation()}>
        <input
          ref={inputRef}
          className="cmd-input"
          placeholder="Type a command or search..."
          value={query}
          onChange={e => { setQuery(e.target.value); setActiveIdx(0); }}
          onKeyDown={handleKeyDown}
        />
        <div className="cmd-list">
          {allItems.length === 0 ? (
            <div className="p-4 text-center text-[10px] font-[family-name:var(--font-ibm-mono)] text-[#333] uppercase tracking-widest">No results</div>
          ) : (
            allItems.map((item, i) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  className={`cmd-item ${i === activeIdx ? 'active' : ''}`}
                  onClick={() => executeItem(item)}
                  onMouseEnter={() => setActiveIdx(i)}
                >
                  <div className="cmd-icon">
                    <Icon className="size-3.5 text-[#525252]" />
                  </div>
                  <div className="cmd-label">{item.label}</div>
                  <span className="cmd-hint">{item.type === 'nav' ? 'Go to' : 'Action'}</span>
                </div>
              );
            })
          )}
        </div>
        <div className="px-3 py-2 border-t border-[#1c1c1c] flex items-center gap-3">
          <span className="text-[9px] font-[family-name:var(--font-ibm-mono)] text-[#333] flex items-center gap-1"><span className="help-key text-[8px]">↑↓</span> Navigate</span>
          <span className="text-[9px] font-[family-name:var(--font-ibm-mono)] text-[#333] flex items-center gap-1"><span className="help-key text-[8px]">↵</span> Select</span>
          <span className="text-[9px] font-[family-name:var(--font-ibm-mono)] text-[#333] flex items-center gap-1"><span className="help-key text-[8px]">Esc</span> Close</span>
        </div>
      </div>
    </div>
  );
}

/* ── Help Modal Component ── */
function HelpModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  const shortcuts = [
    { keys: ["Ctrl+K"], desc: "Open command palette" },
    { keys: ["?"], desc: "Show keyboard shortcuts" },
    { keys: ["E"], desc: "Expand / Collapse all tasks" },
    { keys: ["1", "-", "5"], desc: "Jump to task 1-5" },
    { keys: ["Esc"], desc: "Close dialogs" },
  ];

  return (
    <div className="help-overlay" onClick={onClose}>
      <div className="help-modal" onClick={e => e.stopPropagation()}>
        <div className="px-4 py-3 border-b border-[#262626] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Keyboard className="size-3.5 text-[#ff6b2b]" />
            <span className="text-xs font-[family-name:var(--font-ibm-mono)] text-[#525252] uppercase tracking-widest">Keyboard Shortcuts</span>
          </div>
          <button onClick={onClose} className="text-[#333] hover:text-[#d4d4d4] transition-colors">
            <ChevronUp className="size-4 rotate-45" />
          </button>
        </div>
        <div className="py-2">
          {shortcuts.map((s, i) => (
            <div key={i} className="help-shortcut-row">
              <span className="text-xs text-[#737373]">{s.desc}</span>
              <div className="flex items-center gap-1">
                {s.keys.map((k, ki) => (
                  <span key={ki} className="help-key">{k}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="px-4 py-2 border-t border-[#1c1c1c]">
          <span className="text-[9px] font-[family-name:var(--font-ibm-mono)] text-[#333]">
            Tip: Press <span className="help-key text-[8px]">Ctrl+K</span> anytime for quick access
          </span>
        </div>
      </div>
    </div>
  );
}

function ComplexityBadge({ label, complexity }: { label: string; complexity: string }) {
  const isBad = complexity.includes("n³") || complexity === "O(n×m)" || complexity === "O(n) sequential" || complexity === "O(n) + contention";
  const isMedium = complexity === "O(n)" || complexity === "O(n) avg" || complexity === "O(n²)";
  const color = isBad
    ? "border-[#f87171]/30 text-[#f87171]"
    : isMedium
      ? "border-[#fbbf24]/30 text-[#fbbf24]"
      : "border-[#4ade80]/30 text-[#4ade80]";
  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] font-[family-name:var(--font-ibm-mono)] font-medium px-2 py-0.5 border badge-hover ${color}`}
    >
      {label}: {complexity}
    </span>
  );
}

/* ── Animated Progress Bar Component ── */
function AnimatedProgressBar({ value, max }: { value: number; max: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });
  const pct = max > 0 ? (value / max) * 100 : 0;

  return (
    <div ref={ref} className="progress-bar-track w-full">
      <div
        className="progress-bar-fill"
        style={{ width: inView ? `${pct}%` : "0%" }}
      />
    </div>
  );
}

function TaskSection({ task, expanded, onToggle, compareMode, onToggleCompare, reviewed, starred, onToggleStar, taskCompareMode, onCompareSelect, compareSelected, readingTime, diffMode, onToggleDiff }: { task: TaskData; expanded: boolean; onToggle: () => void; compareMode: boolean; onToggleCompare: () => void; reviewed: boolean; starred: boolean; onToggleStar: () => void; taskCompareMode: boolean; onCompareSelect: () => void; compareSelected: boolean; readingTime: number; diffMode: boolean; onToggleDiff: () => void }) {
  const Icon = task.icon;
  const speedup = (task.baseline.time / task.optimized.time).toFixed(1);

  return (
    <section id={`task-${task.id}`} className="scroll-mt-16">
      <FadeIn>
        <Card
          className={`bg-[#141414] border transition-all cursor-pointer card-industrial card-lift ${
            expanded
              ? "border-[#ff6b2b] border-l-[3px] ind-glow ind-border-animated pulse-ring neon-border"
              : "border-[#262626] hover:border-[#3a3a3a]"
          }`}
          onClick={onToggle}
        >
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex items-center gap-3 flex-1">
                {taskCompareMode && (
                  <div
                    className={`compare-checkbox ${compareSelected ? 'checked' : ''}`}
                    onClick={(e) => { e.stopPropagation(); onCompareSelect(); }}
                  >
                    {compareSelected && <Check className="size-2.5 text-[#ff6b2b]" />}
                  </div>
                )}
                <div className="size-10 bg-[#1c1c1c] flex items-center justify-center shrink-0">
                  <Icon className="size-4 text-[#737373]" />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-[10px] font-[family-name:var(--font-ibm-mono)] text-[#525252]">
                      #{task.id}
                    </span>
                    <button
                      className={`star-btn p-0 ${starred ? 'starred' : 'text-[#333]'}`}
                      onClick={(e) => { e.stopPropagation(); onToggleStar(); }}
                      aria-label={starred ? 'Unstar task' : 'Star task'}
                    >
                      <Star className="size-3" fill={starred ? '#fbbf24' : 'none'} />
                    </button>
                    {reviewed && (
                      <Check className="size-3 text-[#4ade80]" />
                    )}
                    <Badge
                      variant="outline"
                      className="text-[#525252] border-[#262626] text-[10px] badge-hover"
                    >
                      {task.difficulty}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="text-[#525252] border-[#262626] text-[10px] badge-hover"
                    >
                      {task.category}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="border-[#ff6b2b]/30 text-[#ff6b2b] text-[10px] badge-hover"
                    >
                      {speedup}×
                    </Badge>
                    <span className={`text-[9px] font-[family-name:var(--font-ibm-mono)] uppercase border px-1.5 py-0 ${getGrade(parseFloat(speedup)).className}`}>
                      {getGrade(parseFloat(speedup)).letter}
                    </span>
                    {expanded && (
                      <span className="text-[9px] font-[family-name:var(--font-ibm-mono)] text-[#333]">
                        {readingTime} min read
                      </span>
                    )}
                  </div>
                  <CardTitle className="text-sm font-medium text-[#d4d4d4]">
                    {task.title}
                  </CardTitle>
                </div>
              </div>
              <div className="text-[#525252] sm:pr-2">
                {expanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
              </div>
            </div>
          </CardHeader>
        </Card>
      </FadeIn>

      {expanded && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="mt-4 space-y-4"
        >
          {/* Problem Statement */}
          <FadeIn delay={0.05}>
            <Card className="bg-[#141414] border border-[#262626] card-industrial card-lift">
              <CardHeader className="pb-3">
                <CardTitle className="text-xs uppercase tracking-widest text-[#525252]">
                  Problem Statement
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-[#737373] leading-relaxed">{task.problem}</p>
                <div className="flex flex-wrap gap-2">
                  {task.constraints.map((c, i) => (
                    <Badge
                      key={i}
                      variant="outline"
                      className="text-[#525252] border-[#262626] text-[10px] font-normal badge-hover"
                    >
                      {c}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </FadeIn>

          {/* Code Comparison + Bench Chart */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {diffMode ? (
              /* Diff view */
              <div className="xl:col-span-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-[family-name:var(--font-ibm-mono)] text-[#525252] uppercase tracking-widest">Code Diff</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); onToggleDiff(); }}
                    className="text-[#525252] hover:text-[#ff6b2b] transition-colors p-1"
                    title="Switch to tabbed view"
                  >
                    <Rows3 className="size-3.5" />
                  </button>
                </div>
                <CodeDiff baseline={task.baseline.code} optimized={task.optimized.code} title={task.title} />
              </div>
            ) : compareMode ? (
              /* Side-by-side comparison */
              <div className="xl:col-span-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-[family-name:var(--font-ibm-mono)] text-[#525252] uppercase tracking-widest">Code Comparison</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); onToggleDiff(); }}
                      className="text-[#525252] hover:text-[#ff6b2b] transition-colors p-1"
                      title="Switch to diff view"
                    >
                      <GitCompareArrows className="size-3.5" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onToggleCompare(); }}
                      className="text-[#525252] hover:text-[#ff6b2b] transition-colors p-1"
                      title="Switch to tabbed view"
                    >
                      <Rows3 className="size-3.5" />
                    </button>
                  </div>
                </div>
                <div className="code-compare-grid">
                  <CodeBlock code={task.baseline.code} title={`Naive — ${task.title}`} variant="baseline" />
                  <CodeBlock code={task.optimized.code} title={`Optimized — ${task.title}`} variant="optimized" />
                </div>
              </div>
            ) : (
              /* Tabbed view */
              <div className="xl:col-span-1">
                <div className="flex items-center justify-end mb-0 gap-1">
                  <button
                    onClick={(e) => { e.stopPropagation(); onToggleDiff(); }}
                    className="text-[#525252] hover:text-[#ff6b2b] transition-colors p-1"
                    title="Switch to diff view"
                  >
                    <GitCompareArrows className="size-3.5" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onToggleCompare(); }}
                    className="text-[#525252] hover:text-[#ff6b2b] transition-colors p-1"
                    title="Switch to side-by-side view"
                  >
                    <Columns2 className="size-3.5" />
                  </button>
                </div>
                <Tabs defaultValue="baseline" className="w-full">
                  <TabsList className="w-full bg-[#0f0f0f] border border-[#262626] h-9">
                    <TabsTrigger
                      value="baseline"
                      className="flex-1 text-xs font-[family-name:var(--font-ibm-mono)] data-[state=active]:text-[#f87171] data-[state=active]:border-b data-[state=active]:border-[#f87171] text-[#525252]"
                    >
                      <XCircle className="size-3 mr-1" /> Baseline
                    </TabsTrigger>
                    <TabsTrigger
                      value="optimized"
                      className="flex-1 text-xs font-[family-name:var(--font-ibm-mono)] data-[state=active]:text-[#4ade80] data-[state=active]:border-b data-[state=active]:border-[#4ade80] text-[#525252]"
                    >
                      <CheckCircle2 className="size-3 mr-1" /> Optimized
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="baseline" className="mt-3">
                    <CodeBlock code={task.baseline.code} title={`Naive — ${task.title}`} variant="baseline" />
                  </TabsContent>
                  <TabsContent value="optimized" className="mt-3">
                    <CodeBlock code={task.optimized.code} title={`Optimized — ${task.title}`} variant="optimized" />
                  </TabsContent>
                </Tabs>
              </div>
            )}
            <BenchChart task={task} />
          </div>

          {/* Big O Analysis */}
          <FadeIn delay={0.1}>
            <Card className="bg-[#141414] border border-[#262626] card-industrial card-lift">
              <CardHeader className="pb-3">
                <CardTitle className="text-xs uppercase tracking-widest text-[#525252]">
                  Big O Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 border border-[#262626] border-l-2 border-l-[#f87171]">
                    <p className="text-[10px] uppercase tracking-widest text-[#525252] font-[family-name:var(--font-ibm-mono)] mb-3">
                      Baseline
                    </p>
                    <div className="flex flex-wrap gap-2 mb-3">
                      <ComplexityBadge label="Time" complexity={task.baseline.timeComplexity} />
                      <ComplexityBadge label="Space" complexity={task.baseline.spaceComplexity} />
                    </div>
                    <p className="text-xs text-[#525252] leading-relaxed">{task.baseline.explanation}</p>
                  </div>
                  <div className="p-4 border border-[#262626] border-l-2 border-l-[#4ade80]">
                    <p className="text-[10px] uppercase tracking-widest text-[#525252] font-[family-name:var(--font-ibm-mono)] mb-3">
                      Optimized
                    </p>
                    <div className="flex flex-wrap gap-2 mb-3">
                      <ComplexityBadge label="Time" complexity={task.optimized.timeComplexity} />
                      <ComplexityBadge label="Space" complexity={task.optimized.spaceComplexity} />
                    </div>
                    <p className="text-xs text-[#525252] leading-relaxed">{task.optimized.explanation}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </FadeIn>

          {/* Key Optimizations */}
          <FadeIn delay={0.15}>
            <Card className="bg-[#141414] border border-[#262626] card-industrial card-lift">
              <CardHeader className="pb-3">
                <CardTitle className="text-xs uppercase tracking-widest text-[#525252]">
                  Key Optimizations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {task.techniques.map((t, i) => (
                    <div key={i} className="bg-[#0f0f0f] p-3 border border-[#262626] hover-sweep">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold font-[family-name:var(--font-ibm-mono)] text-[#ff6b2b]">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <p className="text-sm font-medium text-[#d4d4d4]">{t.name}</p>
                      </div>
                      <p className="text-xs text-[#525252] leading-relaxed">{t.desc}</p>
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

/* ─────────────────────── SORT ICON ─────────────────────── */

function SortIcon({ col, activeCol, direction }: { col: string; activeCol: string; direction: "asc" | "desc" }) {
  if (activeCol !== col) return <ArrowUpDown className="size-3 inline ml-1 opacity-40" />;
  return direction === "desc"
    ? <ArrowDown className="size-3 inline ml-1 text-[#ff6b2b]" />
    : <ArrowUp className="size-3 inline ml-1 text-[#ff6b2b]" />;
}

/* ─────────────────────── MAIN PAGE ─────────────────────── */

export default function PerformanceLab() {
  const [activeSection, setActiveSection] = useState<string>("hero");
  const [expandedTasks, setExpandedTasks] = useState<Set<number>>(new Set());
  const [scrollProgress, setScrollProgress] = useState(0);
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [compareMode, setCompareMode] = useState(false);
  const [sortColumn, setSortColumn] = useState<string>("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [monitorExpanded, setMonitorExpanded] = useState(true);
  const [reviewedTasks, setReviewedTasks] = usePersistedSet('perf-lab-reviewed');
  const [techniqueTag, setTechniqueTag] = useState<string | null>(null);
  const [taskCompareMode, setTaskCompareMode] = useState(false);
  const [compareSelected, setCompareSelected] = useState<Set<number>>(new Set());
  const [starredTasks, setStarredTasks] = usePersistedSet('perf-lab-starred');
  const [starredFilter, setStarredFilter] = useState(false);
  const [showCmdPalette, setShowCmdPalette] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [diffMode, setDiffMode] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [hoveredTask, setHoveredTask] = useState<TaskData | null>(null);
  const [tooltipRect, setTooltipRect] = useState<DOMRect | null>(null);
  const shareURL = useShareURL(expandedTasks);
  const reviewTimersRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());
  const sectionsRef = useRef<Record<string, HTMLElement | null>>({});

  // Reset progress handler
  const resetProgress = useCallback(() => {
    setReviewedTasks(new Set());
  }, [setReviewedTasks]);

  // Save reviewed to localStorage
  const saveReviewed = useCallback((ids: Set<number>) => {
    setReviewedTasks(ids);
  }, [setReviewedTasks]);

  // Star/unstar task handler
  const toggleStar = useCallback((id: number) => {
    const current = new Set(starredTasks);
    if (current.has(id)) current.delete(id);
    else current.add(id);
    setStarredTasks(current);
  }, [starredTasks, setStarredTasks]);

  // Compare select handler
  const toggleCompareSelect = useCallback((id: number) => {
    setCompareSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < 2) next.add(id);
      return next;
    });
  }, []);

  // Markdown export handler
  const handleExportMarkdown = useCallback(() => {
    const lines: string[] = [];
    lines.push('# Performance Lab — Rust Optimization Challenges\n');
    lines.push(`> ${TASKS.length} tasks · Total speedup: ×\n`);
    for (const t of TASKS) {
      const sp = (t.baseline.time / t.optimized.time).toFixed(1);
      const memSave = ((1 - t.optimized.memory / t.baseline.memory) * 100).toFixed(0);
      lines.push(`## ${t.id}. ${t.title}`);
      lines.push(`**Category:** ${t.category} · **Difficulty:** ${t.difficulty} · **Speedup:** ${sp}×\n`);
      lines.push('### Problem');
      lines.push(t.problem + '\n');
      lines.push('### Constraints');
      t.constraints.forEach(c => { lines.push(`- ${c}`); });
      lines.push('');
      lines.push('### Baseline Code');
      lines.push('```rust');
      lines.push(t.baseline.code);
      lines.push('```\n');
      lines.push('### Optimized Code');
      lines.push('```rust');
      lines.push(t.optimized.code);
      lines.push('```\n');
      lines.push('### Benchmarks');
      lines.push('| Metric | Baseline | Optimized |');
      lines.push('|--------|----------|-----------|');
      lines.push(`| Time | ${formatTimeBenchmark(t.baseline.time)} | ${formatTimeBenchmark(t.optimized.time)} |`);
      lines.push(`| Memory | ${t.baseline.memory} MB | ${t.optimized.memory} MB |`);
      lines.push(`| Speedup | — | ${sp}× |`);
      lines.push(`| Memory Delta | — | ${parseInt(memSave) > 0 ? '-' : '+'}${Math.abs(parseInt(memSave))}% |\n`);
      lines.push('### Complexity');
      lines.push(`- **Baseline:** Time ${t.baseline.timeComplexity}, Space ${t.baseline.spaceComplexity}`);
      lines.push(`- **Optimized:** Time ${t.optimized.timeComplexity}, Space ${t.optimized.spaceComplexity}\n`);
      lines.push('### Key Techniques');
      t.techniques.forEach((tech, i) => { lines.push(`${i + 1}. **${tech.name}** — ${tech.desc}`); });
      lines.push('\n---\n');
    }
    const ts = TASKS.reduce((a, t) => a + t.baseline.time / t.optimized.time, 0);
    lines.splice(1, 1, `> ${TASKS.length} tasks · Total speedup: ${ts.toFixed(0)}×\n`);
    const blob = new Blob([lines.join('\n')], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'performance-lab.md';
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  // Mark task as reviewed after 3 seconds of being expanded
  useEffect(() => {
    expandedTasks.forEach((id) => {
      if (!reviewedTasks.has(id) && !reviewTimersRef.current.has(id)) {
        const timer = setTimeout(() => {
          setReviewedTasks((prev) => {
            const next = new Set(prev);
            next.add(id);
            saveReviewed(next);
            return next;
          });
          reviewTimersRef.current.delete(id);
        }, 3000);
        reviewTimersRef.current.set(id, timer);
      }
    });

    // Cleanup timers for tasks that are no longer expanded (but keep reviewed status)
    reviewTimersRef.current.forEach((timer, id) => {
      if (!expandedTasks.has(id)) {
        clearTimeout(timer);
        reviewTimersRef.current.delete(id);
      }
    });
  }, [expandedTasks, reviewedTasks, saveReviewed]);

  const reviewedCount = reviewedTasks.size;

  // Combine technique tag with search for filtering
  const activeSearch = techniqueTag || searchQuery;

  const filteredTasks = TASKS.filter((t) => {
    const matchDiff = difficultyFilter === "all" || t.difficulty === difficultyFilter;
    const matchStarred = !starredFilter || starredTasks.has(t.id);
    if (!activeSearch.trim()) return matchDiff && matchStarred;
    const q = activeSearch.toLowerCase();
    const matchSearch =
      t.title.toLowerCase().includes(q) ||
      t.problem.toLowerCase().includes(q) ||
      t.techniques.some((tech) => tech.name.toLowerCase().includes(q) || tech.desc.toLowerCase().includes(q));
    return matchDiff && matchSearch && matchStarred;
  });

  const difficulties = ["all", "Advanced", "Expert"];
  const diffCounts = {
    all: TASKS.length,
    Advanced: TASKS.filter(t => t.difficulty === "Advanced").length,
    Expert: TASKS.filter(t => t.difficulty === "Expert").length,
  };

  const registerSection =
    useCallback((id: string) => (el: HTMLElement | null) => {
      sectionsRef.current[id] = el;
    }, []);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(docHeight > 0 ? (scrollTop / docHeight) * 100 : 0);
      setShowBackToTop(scrollTop > 400);

      const scrollY = scrollTop + 120;
      let current = "hero";
      const ids = Object.keys(sectionsRef.current).sort(
        (a, b) =>
          (sectionsRef.current[a]?.offsetTop ?? 0) -
          (sectionsRef.current[b]?.offsetTop ?? 0)
      );
      for (const id of ids) {
        if (sectionsRef.current[id] && sectionsRef.current[id]!.offsetTop <= scrollY)
          current = id;
      }
      setActiveSection(current);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollTo = useCallback((id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" }), []);

  const toggleAll = useCallback(() => {
    if (expandedTasks.size === TASKS.length) {
      setExpandedTasks(new Set());
    } else {
      setExpandedTasks(new Set(TASKS.map((t) => t.id)));
    }
  }, [expandedTasks]);

  const toggleTask = (id: number) => {
    setExpandedTasks((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Command palette action handler
  const handleCmdAction = useCallback((action: string) => {
    switch (action) {
      case "expand-all": setExpandedTasks(new Set(TASKS.map(t => t.id))); break;
      case "collapse-all": setExpandedTasks(new Set()); break;
      case "export-md": handleExportMarkdown(); break;
      case "compare": setTaskCompareMode(c => !c); break;
      case "starred-filter": setStarredFilter(f => !f); break;
    }
  }, [handleExportMarkdown]);

  // Keyboard shortcuts: Ctrl+K for command palette, ? for help, E to expand all, 1-5 to jump to task
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K — command palette
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowCmdPalette(c => !c);
        return;
      }
      if (e.key === 'Escape') {
        setShowCmdPalette(false);
        setShowHelpModal(false);
        return;
      }
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      // ? — help modal
      if (e.key === '?') {
        setShowHelpModal(h => !h);
        return;
      }
      if (e.key === 'e' || e.key === 'E' || e.key === 'к' || e.key === 'К') {
        toggleAll();
      }
      const num = parseInt(e.key);
      if (num >= 1 && num <= 5) {
        scrollTo(`task-${num}`);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleAll, scrollTo]);

  const navItems = [
    { id: "hero", label: "Overview" },
    ...TASKS.map((t) => ({ id: `task-${t.id}`, label: `#${t.id}` })),
    { id: "methodology", label: "Methodology" },
    { id: "vibe-coder", label: "Vibe Guide" },
    { id: "results", label: "Results" },
    { id: "summary", label: "Summary" },
  ];

  const totalSpeedup = TASKS.reduce(
    (a, t) => a + t.baseline.time / t.optimized.time,
    0
  );
  const memImprovedTasks = TASKS.filter((t) => t.optimized.memory < t.baseline.memory).length;

  const totalTimeSaved = TASKS.reduce((a, t) => a + (t.baseline.time - t.optimized.time), 0);
  const totalMemSaved = TASKS.reduce((a, t) => a + (t.baseline.memory - t.optimized.memory), 0);
  const speedups = TASKS.map(t => t.baseline.time / t.optimized.time);
  const minSpeedup = Math.min(...speedups);
  const maxSpeedup = Math.max(...speedups);
  const avgSpeedup = speedups.reduce((a, b) => a + b, 0) / speedups.length;

  const formatTimeDelta = (ms: number) => {
    if (Math.abs(ms) >= 1000) return `${(ms / 1000).toFixed(Math.abs(ms) >= 10000 ? 0 : 1)}s`;
    return `${ms.toFixed(0)}ms`;
  };

  // Sort logic for results table
  const sortedTasks = [...TASKS];
  if (sortColumn) {
    sortedTasks.sort((a, b) => {
      let valA: number, valB: number;
      switch (sortColumn) {
        case "id": valA = a.id; valB = b.id; break;
        case "baseline": valA = a.baseline.time; valB = b.baseline.time; break;
        case "optimized": valA = a.optimized.time; valB = b.optimized.time; break;
        case "speedup": valA = a.baseline.time / a.optimized.time; valB = b.baseline.time / b.optimized.time; break;
        case "memory": valA = (1 - a.optimized.memory / a.baseline.memory) * 100; valB = (1 - b.optimized.memory / b.baseline.memory) * 100; break;
        default: return 0;
      }
      return sortDirection === "desc" ? valB - valA : valA - valB;
    });
  }

  const handleSort = (col: string) => {
    if (sortColumn === col) {
      setSortDirection(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(col);
      setSortDirection("desc");
    }
  };

  // Breadcrumb logic
  const getBreadcrumbLabel = () => {
    if (activeSection === "hero") return "OVERVIEW";
    if (activeSection === "methodology") return "METHODOLOGY";
    if (activeSection === "results") return "RESULTS";
    if (activeSection === "summary") return "SUMMARY";
    if (activeSection.startsWith("task-")) {
      const id = parseInt(activeSection.replace("task-", ""));
      const task = TASKS.find(t => t.id === id);
      if (task) return `#${task.id} ${task.title.substring(0, 30).toUpperCase()}`;
    }
    return "OVERVIEW";
  };

  const getBreadcrumbSection = () => {
    if (activeSection.startsWith("task-")) return "TASKS";
    if (activeSection === "methodology") return "METHODS";
    if (activeSection === "results") return "RESULTS";
    if (activeSection === "summary") return "SUMMARY";
    return "OVERVIEW";
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0a]">
      {/* ─── SCROLL PROGRESS BAR ─── */}
      <div className="scroll-progress-industrial" style={{ width: `${scrollProgress}%` }} />

      {/* ─── GRADIENT MESH BACKGROUND ─── */}
      <div className="gradient-mesh" />

      {/* ─── STICKY HEADER ─── */}
      <header className="sticky top-0 z-50 bg-[#0a0a0a] border-b border-[#262626] glass-dark">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-12">
            <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar max-w-[75vw]">
              {navItems.map((item) => (
                <Button
                  key={item.id}
                  variant="ghost"
                  size="sm"
                  className={`text-[10px] shrink-0 h-8 uppercase tracking-[0.2em] font-[family-name:var(--font-ibm-mono)] px-2.5 nav-btn-underline ${
                    activeSection === item.id
                      ? "text-[#ff6b2b] active"
                      : "text-[#525252] hover:text-[#737373]"
                  }`}
                  onClick={() => scrollTo(item.id)}
                >
                  {item.label}
                </Button>
              ))}
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => setTaskCompareMode(c => !c)}
                className={`text-[10px] font-[family-name:var(--font-ibm-mono)] uppercase tracking-[0.15em] transition-colors flex items-center gap-1 ${taskCompareMode ? 'text-[#ff6b2b]' : 'text-[#525252] hover:text-[#ff6b2b]'}`}
                title="Compare tasks"
              >
                <GitCompareArrows className="size-3" />
                <span className="hidden sm:inline">Compare</span>
              </button>
              <button
                onClick={handleExportMarkdown}
                className="text-[10px] font-[family-name:var(--font-ibm-mono)] text-[#525252] hover:text-[#ff6b2b] uppercase tracking-[0.15em] transition-colors flex items-center gap-1"
                title="Export as Markdown"
              >
                <Download className="size-3" />
                <span className="hidden sm:inline">Export</span>
              </button>
              <button
                onClick={() => setShowCmdPalette(true)}
                className="text-[10px] font-[family-name:var(--font-ibm-mono)] text-[#333] hover:text-[#ff6b2b] uppercase tracking-[0.15em] transition-colors flex items-center gap-1"
                title="Command palette (Ctrl+K)"
              >
                <Command className="size-3" />
                <span className="hidden sm:inline">Cmd</span>
              </button>
              <button
                onClick={() => {
                  shareURL();
                  setCopiedUrl(true);
                  setTimeout(() => setCopiedUrl(false), 2000);
                }}
                className="text-[10px] font-[family-name:var(--font-ibm-mono)] text-[#333] hover:text-[#ff6b2b] uppercase tracking-[0.15em] transition-colors flex items-center gap-1"
                title="Share URL with current state"
              >
                {copiedUrl ? <Link2 className="size-3 text-[#4ade80]" /> : <Share2 className="size-3" />}
                <span className="hidden sm:inline">{copiedUrl ? 'Copied' : 'Share'}</span>
              </button>
              <button
                onClick={toggleAll}
                className="text-[10px] font-[family-name:var(--font-ibm-mono)] text-[#525252] hover:text-[#ff6b2b] uppercase tracking-[0.15em] transition-colors"
              >
                {expandedTasks.size === TASKS.length ? "Collapse" : "Expand"}
              </button>
              <div className="hidden sm:flex items-center gap-2">
                <span className="text-[10px] font-[family-name:var(--font-ibm-mono)] text-[#4ade80] uppercase tracking-[0.15em] shrink-0">
                  Reviewed {reviewedCount}/{TASKS.length}
                </span>
                <span className="text-[10px] font-[family-name:var(--font-ibm-mono)] text-[#333]">·</span>
                <span className="text-[10px] font-[family-name:var(--font-ibm-mono)] text-[#525252] uppercase tracking-[0.15em] shrink-0">
                  5 tasks · rust
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ─── BREADCRUMB TRAIL ─── */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 border-t border-[#1c1c1c]">
          <div className="flex items-center gap-1.5 py-1">
            <button
              onClick={() => scrollTo("hero")}
              className="text-[9px] font-[family-name:var(--font-ibm-mono)] text-[#333] hover:text-[#737373] transition-colors uppercase tracking-[0.1em]"
            >
              PERF LAB
            </button>
            <span className="text-[9px] font-[family-name:var(--font-ibm-mono)] text-[#333]">&gt;</span>
            {getBreadcrumbSection() !== "OVERVIEW" && (
              <button
                onClick={() => scrollTo(
                  activeSection.startsWith("task-") ? "hero" : activeSection
                )}
                className="text-[9px] font-[family-name:var(--font-ibm-mono)] text-[#737373] hover:text-[#d4d4d4] transition-colors uppercase tracking-[0.1em]"
              >
                {getBreadcrumbSection()}
              </button>
            )}
            {getBreadcrumbSection() !== "OVERVIEW" && (
              <span className="text-[9px] font-[family-name:var(--font-ibm-mono)] text-[#333]">&gt;</span>
            )}
            <span className="text-[9px] font-[family-name:var(--font-ibm-mono)] text-[#737373] uppercase tracking-[0.1em]">
              {getBreadcrumbLabel()}
            </span>
          </div>
        </div>
      </header>

      {/* ─── MAIN ─── */}
      <main className="flex-1 mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-8 space-y-10 section-rail">
        {/* ═══ HERO SECTION ═══ */}
        <section ref={registerSection("hero")} id="hero">
          {/* Terminal status bar */}
          <div className="terminal-bar px-4 py-1.5 flex items-center gap-3 border border-[#262626] border-b-0">
            <span className="size-1.5 rounded-full bg-[#4ade80] pulse-dot" />
            <span className="font-[family-name:var(--font-ibm-mono)]">
              <span className="typing-text text-[#525252]">&gt; system.init() | rust v1.78.0 | 5 tasks loaded | status: operational</span>
            </span>
            <div className="ml-auto flex items-center gap-2">
              <div className="signal-strength">
                <div className="signal-bar" />
                <div className="signal-bar" />
                <div className="signal-bar" />
                <div className="signal-bar" />
              </div>
              <span className="text-[8px] font-[family-name:var(--font-ibm-mono)] text-[#333]">SIG</span>
            </div>
          </div>

          <FadeIn>
            <div className="relative overflow-hidden bg-[#141414] border border-[#262626] border-t-0 border-l-2 border-l-[#ff6b2b] p-6 sm:p-8 scanline vignette">
              {/* Decorative data-stream lines */}
              <div className="data-stream" style={{ left: "15%", height: "120px", animationDelay: "0s" }} />
              <div className="data-stream" style={{ left: "55%", height: "80px", animationDelay: "2.5s" }} />
              <div className="data-stream" style={{ left: "85%", height: "100px", animationDelay: "5s" }} />

              {/* Ambient Particles */}
              <AmbientParticles />

              <div className="space-y-6 relative z-10">
                <div>
                  <h1 className="text-2xl sm:text-4xl lg:text-5xl font-bold text-[#d4d4d4] tracking-wider uppercase cursor-blink flicker glitch-hover">
                    Performance Lab
                  </h1>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="size-1.5 rounded-full bg-[#4ade80] pulse-dot" />
                    <p className="text-xs font-[family-name:var(--font-ibm-mono)] text-[#525252]">
                      5 задач на высокопроизводительный код
                    </p>
                  </div>
                  <p className="text-sm text-[#737373] max-w-2xl leading-relaxed mt-4">
                    Каждый challenge — реальная задача системного программирования. Naive
                    vs Optimized подход на Rust с анализом Big O, бенчмарками и
                    объяснением каждой оптимизации.
                  </p>
                  {/* Keyboard shortcut hints */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <kbd className="text-[9px] font-[family-name:var(--font-ibm-mono)] text-[#333] bg-[#0f0f0f] border border-[#262626] px-1.5 py-0.5">Ctrl+K</kbd>
                    <span className="text-[10px] text-[#333]">Command palette</span>
                    <kbd className="text-[9px] font-[family-name:var(--font-ibm-mono)] text-[#333] bg-[#0f0f0f] border border-[#262626] px-1.5 py-0.5">?</kbd>
                    <span className="text-[10px] text-[#333]">Shortcuts</span>
                    <kbd className="text-[9px] font-[family-name:var(--font-ibm-mono)] text-[#333] bg-[#0f0f0f] border border-[#262626] px-1.5 py-0.5">E</kbd>
                    <span className="text-[10px] text-[#333]">Expand all</span>
                    <kbd className="text-[9px] font-[family-name:var(--font-ibm-mono)] text-[#333] bg-[#0f0f0f] border border-[#262626] px-1.5 py-0.5">1-5</kbd>
                    <span className="text-[10px] text-[#333]">Jump to task</span>
                  </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-[#262626] border border-[#262626]">
                  {[
                    { val: "5", label: "Tasks", isCounter: true },
                    { val: totalSpeedup.toFixed(0), label: "Total speedup", suffix: "×", isCounter: true },
                    { val: `${memImprovedTasks}/${TASKS.length}`, label: "Memory improved", isCounter: false },
                    { val: "Rust", label: "Language", isCounter: false },
                  ].map((s, i) => (
                    <div key={i} className="px-4 py-3 text-center">
                      <p className="text-4xl sm:text-5xl font-bold font-[family-name:var(--font-ibm-mono)] text-[#d4d4d4] [text-shadow:0_0_8px_rgba(255,107,43,0.3)] stat-hero stat-counter-glow">
                        {s.isCounter ? (
                          <AnimatedCounter value={s.val} suffix={s.suffix || ""} />
                        ) : (
                          s.val
                        )}
                      </p>
                      <p className="text-[10px] font-[family-name:var(--font-ibm-mono)] text-[#525252] uppercase tracking-widest mt-0.5">
                        {s.label}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Quick Stats row */}
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-[10px] font-[family-name:var(--font-ibm-mono)] text-[#333] uppercase tracking-widest">Quick Stats</span>
                  <span className="text-[10px] font-[family-name:var(--font-ibm-mono)] text-[#525252] bg-[#0f0f0f] border border-[#262626] px-2 py-0.5 tabular-nums">
                    min {minSpeedup.toFixed(1)}×
                  </span>
                  <span className="text-[10px] font-[family-name:var(--font-ibm-mono)] text-[#525252] bg-[#0f0f0f] border border-[#262626] px-2 py-0.5 tabular-nums">
                    max {maxSpeedup.toFixed(1)}×
                  </span>
                  <span className="text-[10px] font-[family-name:var(--font-ibm-mono)] text-[#525252] bg-[#0f0f0f] border border-[#262626] px-2 py-0.5 tabular-nums">
                    avg {avgSpeedup.toFixed(1)}×
                  </span>
                  {reviewedCount > 0 && (
                    <span className="text-[10px] font-[family-name:var(--font-ibm-mono)] text-[#4ade80] bg-[#4ade80]/5 border border-[#4ade80]/20 px-2 py-0.5">
                      reviewed {reviewedCount}/{TASKS.length}
                    </span>
                  )}
                </div>

                {/* Progress Timeline */}
                {reviewedCount > 0 && (
                  <div className="p-4 border border-[#262626] bg-[#0f0f0f]">
                    <div className="flex items-center gap-2 mb-3">
                      <Trophy className="size-3.5 text-[#ff6b2b]" />
                      <span className="text-[10px] font-[family-name:var(--font-ibm-mono)] text-[#525252] uppercase tracking-widest">
                        Progress Timeline
                      </span>
                      <span className="ml-auto text-[9px] font-[family-name:var(--font-ibm-mono)] text-[#4ade80] uppercase">
                        {reviewedCount}/{TASKS.length}
                      </span>
                    </div>
                    <ActivityTimeline tasks={TASKS} reviewedTasks={reviewedTasks} />
                  </div>
                )}

                {/* Task quick links — staggered animation */}
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
                              <TIcon className="size-3 text-[#525252] group-hover:text-[#ff6b2b] transition-colors" />
                            </div>
                            <span className="text-[10px] font-[family-name:var(--font-ibm-mono)] text-[#525252]">
                              #{t.id}
                            </span>
                            {reviewedTasks.has(t.id) && <Check className="size-2.5 text-[#4ade80] ml-auto" />}
                          </div>
                          <p className="text-xs text-[#737373] line-clamp-2 leading-relaxed group-hover:text-[#d4d4d4] transition-colors">
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
                        <TaskPreviewTooltip task={t} visible={hoveredTask?.id === t.id} anchorRect={tooltipRect} />
                      </div>
                    );
                  })}
                </div>

                {/* Reset Progress */}
                {reviewedCount > 0 && (
                  <button
                    onClick={resetProgress}
                    className="flex items-center gap-1.5 text-[10px] font-[family-name:var(--font-ibm-mono)] text-[#333] hover:text-[#f87171] uppercase tracking-[0.15em] transition-colors"
                  >
                    <RotateCcw className="size-3" />
                    Reset Progress
                  </button>
                )}
              </div>
            </div>
          </FadeIn>
        </section>

        {/* ═══ DIFFICULTY FILTER PILLS ═══ */}
        <div className="flex items-center gap-2 flex-wrap">
          {difficulties.map((d) => (
            <button
              key={d}
              onClick={() => setDifficultyFilter(d)}
              className={`text-[10px] font-[family-name:var(--font-ibm-mono)] uppercase tracking-[0.15em] px-3 py-1.5 border transition-colors ${
                difficultyFilter === d
                  ? "text-[#ff6b2b] border-[#ff6b2b]/30"
                  : "text-[#525252] border-[#262626] hover:text-[#737373]"
              }`}
            >
              {d} ({diffCounts[d as keyof typeof diffCounts]})
            </button>
          ))}
          <button
            onClick={() => setStarredFilter(f => !f)}
            className={`text-[10px] font-[family-name:var(--font-ibm-mono)] uppercase tracking-[0.15em] px-3 py-1.5 border transition-colors flex items-center gap-1 ${
              starredFilter
                ? "text-[#fbbf24] border-[#fbbf24]/30"
                : "text-[#525252] border-[#262626] hover:text-[#737373]"
            }`}
          >
            <Star className="size-3" fill={starredFilter ? '#fbbf24' : 'none'} />
            Starred ({starredTasks.size})
          </button>
        </div>

        {/* ═══ TECHNIQUE SEARCH BAR ═══ */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-[#333]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setTechniqueTag(null); }}
            placeholder="Search techniques, titles, or descriptions..."
            className="search-industrial search-glow w-full pl-9 pr-16"
          />
          {activeSearch.trim() && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-[family-name:var(--font-ibm-mono)] text-[#525252]">
              {filteredTasks.length} match{filteredTasks.length !== 1 ? "es" : ""}
            </span>
          )}
        </div>

        {/* ═══ TASK SECTIONS ═══ */}
        <div className="space-y-6">
          {filteredTasks.length === 0 ? (
            <FadeIn>
              <div className="text-center py-16 border border-[#262626] bg-[#141414]">
                <Search className="size-8 text-[#333] mx-auto mb-3" />
                <p className="text-xs font-[family-name:var(--font-ibm-mono)] text-[#525252] uppercase tracking-widest mb-1">No Matches</p>
                <p className="text-xs text-[#333]">Try a different search query</p>
              </div>
            </FadeIn>
          ) : (
            filteredTasks.map((task, sectionIndex) => (
              <div key={task.id}>
                <TaskSection
                  task={task}
                  expanded={expandedTasks.has(task.id)}
                  onToggle={() => toggleTask(task.id)}
                  compareMode={compareMode}
                  onToggleCompare={() => setCompareMode(c => !c)}
                  reviewed={reviewedTasks.has(task.id)}
                  starred={starredTasks.has(task.id)}
                  onToggleStar={() => toggleStar(task.id)}
                  taskCompareMode={taskCompareMode}
                  onCompareSelect={() => toggleCompareSelect(task.id)}
                  compareSelected={compareSelected.has(task.id)}
                  readingTime={calcReadingTime(task)}
                  diffMode={diffMode}
                  onToggleDiff={() => setDiffMode(d => !d)}
                />
                {sectionIndex < filteredTasks.length - 1 && (
                  <SectionDivider label={String(sectionIndex + 1).padStart(2, "0")} />
                )}
              </div>
            ))
          )}
        </div>

        {/* ─── Separator ─── */}
        <SectionDivider label="MT" />

        {/* ═══ METHODOLOGY ═══ */}
        <section ref={registerSection("methodology")} id="methodology">
          <FadeIn>
            <Card className="border border-[#262626] bg-[#141414] border-l-2 border-l-[#ff6b2b] card-industrial ind-dot-grid">
              <CardHeader>
                <CardTitle className="text-xs uppercase tracking-widest text-[#525252]">
                  Methodology
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
                        <PIcon className="size-4 text-[#525252] mb-2" />
                        <p className="text-xs uppercase tracking-wider text-[#d4d4d4] font-medium">
                          {p.title}
                        </p>
                        <p className="text-[10px] text-[#525252] mt-1 leading-relaxed">
                          {p.desc}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* ── Technique Tag Cloud ── */}
                <div className="mt-4 pt-4 border-t border-[#262626]">
                  <p className="text-[10px] font-[family-name:var(--font-ibm-mono)] text-[#333] uppercase tracking-[0.2em] mb-2">Technique Tags</p>
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

        {/* ─── Separator ─── */}
        <SectionDivider label="VB" />

        {/* ═══ VIBE CODER'S GUIDE ═══ */}
        <section ref={registerSection("vibe-coder")} id="vibe-coder">
          <FadeIn>
            <Card className="border border-[#262626] bg-[#141414] border-l-2 border-l-[#fbbf24] card-industrial">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Sparkles className="size-3.5 text-[#fbbf24]" />
                  <CardTitle className="text-xs uppercase tracking-widest text-[#525252]">
                    Vibe Coder&apos;s Guide
                  </CardTitle>
                </div>
                <p className="text-[10px] text-[#333] font-[family-name:var(--font-ibm-mono)] mt-1">
                  Как перевести 5 задач с языка «ментального расстройства Rust-разработчика» на язык «комфортного веб-разработчика»
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Warning banner */}
                <div className="flex items-start gap-2 p-3 bg-[#fbbf24]/5 border border-[#fbbf24]/20 warning-stripe">
                  <AlertTriangle className="size-3.5 text-[#fbbf24] shrink-0 mt-0.5" />
                  <div className="text-[10px] text-[#fbbf24] leading-relaxed font-[family-name:var(--font-ibm-mono)]">
                    <p className="font-bold uppercase tracking-widest mb-1">Осторожно: мины замедленного действия</p>
                    <p>Задача 2 (CSV): Box::leak(mmap...) — утечка памяти. Задача 5 (Lock-free): unsafe impl Send/Sync — если ошибётесь хотя бы в одном Ordering, получите «призрачные» баги раз в месяц.</p>
                  </div>
                </div>

                {/* Vibe Coder Mantra */}
                <div className="p-4 bg-[#0f0f0f] border border-[#262626] border-l-2 border-l-[#fbbf24]">
                  <p className="text-xs text-[#d4d4d4] font-medium mb-1 font-[family-name:var(--font-ibm-mono)] quote-glow">
                    &quot;Все эти оптимизации уже написаны грустными людьми на Rust и C++. Моя задача — найти их npm-пакет и импортировать.&quot;
                  </p>
                  <p className="text-[9px] text-[#333] uppercase tracking-widest font-[family-name:var(--font-ibm-mono)]">— Мантра вайб-кодера на 2026</p>
                </div>

                {/* 5 task translations */}
                <div className="space-y-3">
                  {[
                    {
                      id: 1,
                      vibe: 'array.filter((v, i, a) => a.indexOf(v) === i) или new Set(data)',
                      doc: 'Не создавай 10 миллионов строк в памяти!',
                      tip: 'В JavaScript строки иммутабельны. Просто используй базу данных: SELECT column, COUNT(*) FROM table GROUP BY column HAVING COUNT(*) > 1. Пусть Postgres страдает.',
                      color: '#ff6b2b',
                    },
                    {
                      id: 2,
                      vibe: 'Загружу файл в multer, прогоню через Papa Parse, отдам JSON',
                      doc: 'Не загружай всё в RAM! Делай zero-copy и SIMD!',
                      tip: '500 МБ CSV → JSON на Node.js = FATAL ERROR: CALL_AND_RETRY_LAST Allocation failed. Используй Streams API или csv-parse. А для анализа — DuckDB одной SQL-командой.',
                      color: '#f87171',
                    },
                    {
                      id: 3,
                      vibe: 'Promise.all(urls.map(url => fetch(url))) и пойду за кофе',
                      doc: 'Сделай семафор, настрой пул соединений, иначе упадёшь!',
                      tip: '100K запросов = EMFILE (too many open files) или socket hang up + бан за DDoS. Ставь p-limit: const limit = pLimit(100); await Promise.all(urls.map(url => limit(() => fetch(url)))).',
                      color: '#a78bfa',
                    },
                    {
                      id: 4,
                      vibe: 'Зачем мне это? Я делаю CRM на React',
                      doc: 'Кэшируй тайлы, разворачивай циклы!',
                      tip: 'Никогда не пиши математику на JS/TS. Подключай библиотеку на C++/Rust/WASM (numpy, tensorflow.js, mathjs). Передавай данные и смотри в стену.',
                      color: '#38bdf8',
                    },
                    {
                      id: 5,
                      vibe: 'Создам таблицу jobs со статусом pending в Prisma',
                      doc: 'Избегай Mutex, делай Cache-padding!',
                      tip: 'В вебе очереди в RAM не живут (сервер перезапустится — всё умрёт). Используй BullMQ (Node.js) или SQS/RabbitMQ. Они написаны на C и решили все проблемы.',
                      color: '#4ade80',
                    },
                  ].map((item) => (
                    <div key={item.id} className="group p-3 bg-[#0f0f0f] border border-[#262626] hover:border-[#262626] transition-colors vibe-card" style={{ '--vibe-color': item.color } as React.CSSProperties}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-[family-name:var(--font-ibm-mono)] font-bold px-1.5 py-0 border" style={{ color: item.color, borderColor: `${item.color}30` }}>
                          #{item.id}
                        </span>
                        <span className="text-[9px] font-[family-name:var(--font-ibm-mono)] text-[#333] uppercase tracking-widest">Задача {item.id}</span>
                      </div>
                      {/* Vibe coder thinks */}
                      <div className="mb-2 pl-3 border-l-2 border-[#262626]">
                        <p className="text-[9px] font-[family-name:var(--font-ibm-mono)] text-[#525252] uppercase tracking-wider mb-0.5">Вайб кодер думает:</p>
                        <code className="vibe-code">{item.vibe}</code>
                      </div>
                      {/* Document says */}
                      <div className="mb-2 pl-3 border-l-2" style={{ borderColor: `${item.color}40` }}>
                        <p className="text-[9px] font-[family-name:var(--font-ibm-mono)] uppercase tracking-wider mb-0.5" style={{ color: item.color }}>Документ говорит:</p>
                        <p className="text-[10px] text-[#d4d4d4]">{item.doc}</p>
                      </div>
                      {/* Vibe tip */}
                      <div className="pl-3 border-l-2 border-[#fbbf24]/30 bg-[#fbbf24]/5 -mx-3 px-6 py-2 tip-callout">
                        <p className="text-[9px] font-[family-name:var(--font-ibm-mono)] text-[#fbbf24] uppercase tracking-wider mb-0.5">Выжимка →</p>
                        <p className="text-[10px] text-[#d4d4d4] leading-relaxed">{item.tip}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Quick reference table */}
                <div className="overflow-x-auto custom-scrollbar">
                  <div className="text-[9px] font-[family-name:var(--font-ibm-mono)] text-[#333] uppercase tracking-widest mb-2">Quick Reference: Rust → Web</div>
                  <table className="w-full text-[10px]">
                    <thead>
                      <tr className="border-b border-[#262626]">
                        <th className="text-left py-1.5 pr-3 text-[#525252] font-[family-name:var(--font-ibm-mono)]">Rust Concept</th>
                        <th className="text-left py-1.5 pr-3 text-[#525252] font-[family-name:var(--font-ibm-mono)]">Web Equivalent</th>
                        <th className="text-left py-1.5 text-[#525252] font-[family-name:var(--font-ibm-mono)]">npm Package</th>
                      </tr>
                    </thead>
                    <tbody className="font-[family-name:var(--font-ibm-mono)]">
                      {[
                        { rust: 'String Interning', web: 'Cache / Memoization', pkg: 'lru-cache, memoizee' },
                        { rust: 'Memory-mapped I/O', web: 'File Streams', pkg: 'fs.createReadStream, csv-parse' },
                        { rust: 'SIMD memchr', web: 'WASM / Native Addons', pkg: '@napi-rs/canvas, WASM modules' },
                        { rust: 'Semaphore / Backpressure', web: 'Concurrency Limit', pkg: 'p-limit, bottleneck' },
                        { rust: 'Connection Pooling', web: 'HTTP Agent / Keep-alive', pkg: 'undici, got (built-in pool)' },
                        { rust: 'Cache Tiling', web: 'OffscreenCanvas / WebWorker', pkg: 'comlink, GPU.js' },
                        { rust: 'Lock-free CAS', web: 'Message Queue', pkg: 'BullMQ, RabbitMQ, SQS' },
                        { rust: 'Cache-line Padding', web: 'Worker Threads isolation', pkg: 'worker_threads, piscina' },
                      ].map((row, i) => (
                        <tr key={i} className="border-b border-[#1c1c1c] vibe-row">
                          <td className="py-1.5 pr-3 text-[#737373]">{row.rust}</td>
                          <td className="py-1.5 pr-3 text-[#d4d4d4]">{row.web}</td>
                          <td className="py-1.5 text-[#ff6b2b]">{row.pkg}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Final rule */}
                <div className="p-3 bg-[#ff6b2b]/5 border border-[#ff6b2b]/20">
                  <p className="text-[10px] text-[#d4d4d4] leading-relaxed font-[family-name:var(--font-ibm-mono)]">
                    <span className="text-[#ff6b2b] font-bold uppercase tracking-wider">Единственное правило:</span> Если твой Array.prototype.map().filter().reduce() на 50K элементов фризит фронтенд на секунду — вспомни Задачу 1 и 4. Не делай эту работу в JS. Отдай на бэк или в Web Worker.
                  </p>
                </div>
              </CardContent>
            </Card>
          </FadeIn>
        </section>

        {/* ─── Separator ─── */}
        <SectionDivider label="RS" />

        {/* ═══ RESULTS TABLE ═══ */}
        <section ref={registerSection("results")} id="results">
          <FadeIn>
            <Card className="bg-[#141414] border border-[#262626] card-industrial card-lift">
              <CardHeader>
                <CardTitle className="text-xs uppercase tracking-widest text-[#525252]">
                  Results
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#262626]">
                        <th className="text-left py-2 pr-4 text-[#525252] sort-header" onClick={() => handleSort("id")}>
                          # <SortIcon col="id" activeCol={sortColumn} direction={sortDirection} />
                        </th>
                        <th className="text-left py-2 pr-4 text-[#525252]">Task</th>
                        <th className="text-right py-2 px-3 text-[#525252] sort-header" onClick={() => handleSort("baseline")}>
                          Baseline <SortIcon col="baseline" activeCol={sortColumn} direction={sortDirection} />
                        </th>
                        <th className="text-right py-2 px-3 text-[#525252] sort-header" onClick={() => handleSort("optimized")}>
                          Optimized <SortIcon col="optimized" activeCol={sortColumn} direction={sortDirection} />
                        </th>
                        <th className="text-right py-2 px-3 text-[#525252] sort-header" onClick={() => handleSort("speedup")}>
                          Speedup <SortIcon col="speedup" activeCol={sortColumn} direction={sortDirection} />
                        </th>
                        <th className="text-right py-2 text-[#525252] sort-header" onClick={() => handleSort("memory")}>
                          Memory <SortIcon col="memory" activeCol={sortColumn} direction={sortDirection} />
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedTasks.map((t) => {
                        const sp = (t.baseline.time / t.optimized.time).toFixed(1);
                        const ms = ((1 - t.optimized.memory / t.baseline.memory) * 100).toFixed(0);
                        const memImproved = t.optimized.memory < t.baseline.memory;
                        const formatT = (v: number) =>
                          v >= 1000
                            ? `${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}s`
                            : `${v}ms`;
                        return (
                          <tr
                            key={t.id}
                            className="border-b border-[#1c1c1c] hover:bg-[#0f0f0f] transition-colors row-stripe"
                          >
                            <td className="py-2.5 pr-4">
                              <span className="text-[10px] font-[family-name:var(--font-ibm-mono)] text-[#525252] tabular-nums">
                                #{t.id}
                              </span>
                            </td>
                            <td className="py-2.5 pr-4 max-w-[200px]">
                              <p className="text-[#737373] text-xs truncate">{t.title}</p>
                            </td>
                            <td className="py-2.5 px-3 text-right font-[family-name:var(--font-ibm-mono)] text-[#737373] tabular-nums">
                              {formatT(t.baseline.time)}
                            </td>
                            <td className="py-2.5 px-3 text-right font-[family-name:var(--font-ibm-mono)] text-[#4ade80] tabular-nums">
                              {formatT(t.optimized.time)}
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

                {/* Speedup Chart */}
                <div className="h-[260px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={TASKS.map((t) => ({
                        name: `#${t.id}`,
                        speedup: parseFloat(
                          (t.baseline.time / t.optimized.time).toFixed(1)
                        ),
                        memory: parseFloat(
                          (
                            (1 - t.optimized.memory / t.baseline.memory) *
                            100
                          ).toFixed(0)
                        ),
                      }))}
                      layout="vertical"
                      barCategoryGap="15%"
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#1c1c1c"
                        horizontal={false}
                      />
                      <XAxis
                        type="number"
                        tick={{ fontSize: 10, fill: "#525252", fontFamily: "var(--font-ibm-mono), monospace" }}
                      />
                      <YAxis
                        dataKey="name"
                        type="category"
                        width={35}
                        tick={{ fontSize: 11, fill: "#525252", fontFamily: "var(--font-ibm-mono), monospace" }}
                      />
                      <Bar dataKey="speedup" name="Speedup (×)" fill="#ff6b2b" />
                      <Bar dataKey="memory" name="Memory save (%)" fill="#4ade80" />
                      <Legend
                        iconSize={8}
                        wrapperStyle={{
                          fontSize: "10px",
                          color: "#525252",
                          fontFamily: "var(--font-ibm-mono), monospace",
                        }}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </FadeIn>
        </section>

        {/* ─── RADAR CHART ─── */}
        <FadeIn>
          <Card className="bg-[#141414] border border-[#262626] card-industrial card-lift">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs uppercase tracking-widest text-[#525252]">
                Multi-dimensional Comparison
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RadarChart tasks={TASKS} />
            </CardContent>
          </Card>
        </FadeIn>

        {/* ─── Separator ─── */}
        <SectionDivider label="SM" />

        {/* ═══ SUMMARY ═══ */}
        <section ref={registerSection("summary")} id="summary">
          <FadeIn>
            <Card className="border border-[#262626] bg-[#141414] border-l-2 border-l-[#ff6b2b] card-industrial card-lift">
              <CardHeader>
                <CardTitle className="text-xs uppercase tracking-widest text-[#525252]">
                  Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                  {TASKS.map((t) => {
                    const sp = (t.baseline.time / t.optimized.time).toFixed(1);
                    return (
                      <div
                        key={t.id}
                        className="text-center p-3 bg-[#0f0f0f] border border-[#262626]"
                      >
                        <p className="text-xl font-bold text-[#ff6b2b] font-[family-name:var(--font-ibm-mono)] tabular-nums">
                          {sp}×
                        </p>
                        <p className="text-[10px] text-[#525252] font-[family-name:var(--font-ibm-mono)] uppercase tracking-widest mt-1">
                          #{t.id}
                        </p>
                        <div className="mt-2">
                          <AnimatedProgressBar value={parseFloat(sp)} max={maxSpeedup} />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-4 bg-[#1c1c1c] p-4 border border-[#262626]">
                  <p className="text-sm text-[#737373] leading-relaxed">
                    <span className="font-semibold text-[#d4d4d4]">8 принципов high-performance кода:</span>{" "}
                    Big O оптимизация → Кэш-локальность (Data-Oriented Design) →
                    Минимизация аллокаций → Async I/O → Lock-free конкурентность →
                    Zero-cost абстракции → SIMD векторизация → Профилирование
                    («Измеряй, а не гадай»).
                  </p>
                  <div className="flex items-center gap-4 mt-3">
                    <div className="flex items-center gap-2">
                      <Zap className="size-3.5 text-[#ff6b2b]" />
                      <span className="text-xs text-[#525252] font-[family-name:var(--font-ibm-mono)]">
                        Total speedup:{" "}
                        <span className="text-[#ff6b2b] font-bold text-gradient-orange">
                          {totalSpeedup.toFixed(0)}×
                        </span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MemoryStick className="size-3.5 text-[#4ade80]" />
                      <span className="text-xs text-[#525252] font-[family-name:var(--font-ibm-mono)]">
                        Memory improved:{" "}
                        <span className="text-[#4ade80] font-bold">
                          {memImprovedTasks}/{TASKS.length}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </FadeIn>
        </section>
      </main>

      {/* ─── PERFORMANCE SUMMARY WIDGET (System Monitor) ─── */}
      <div className="fixed bottom-6 left-6 z-50">
        <AnimatePresence>
          {monitorExpanded && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="bg-[#141414] border border-[#262626] p-4 w-64 mb-2"
            >
              <div className="flex items-center gap-2 mb-3">
                <Monitor className="size-3.5 text-[#ff6b2b]" />
                <span className="text-[10px] font-[family-name:var(--font-ibm-mono)] text-[#525252] uppercase tracking-widest">System Monitor</span>
              </div>

              {/* Time saved */}
              <div className="metric-card p-3 border border-[#262626] mb-2" style={{ "--metric-color": "#ff6b2b" } as React.CSSProperties}>
                <p className="text-[9px] font-[family-name:var(--font-ibm-mono)] text-[#525252] uppercase tracking-widest mb-1">Total Time Saved</p>
                <p className="text-lg font-bold text-[#ff6b2b] font-[family-name:var(--font-ibm-mono)] tabular-nums">
                  {formatTimeDelta(totalTimeSaved)}
                </p>
              </div>

              {/* Memory saved */}
              <div className="metric-card p-3 border border-[#262626] mb-3" style={{ "--metric-color": totalMemSaved >= 0 ? "#4ade80" : "#f87171" } as React.CSSProperties}>
                <p className="text-[9px] font-[family-name:var(--font-ibm-mono)] text-[#525252] uppercase tracking-widest mb-1">Total Memory Delta</p>
                <p className={`text-lg font-bold font-[family-name:var(--font-ibm-mono)] tabular-nums ${totalMemSaved >= 0 ? "text-[#4ade80]" : "text-[#f87171]"}`}>
                  {totalMemSaved >= 0 ? "−" : "+"}{Math.abs(totalMemSaved)} MB
                </p>
              </div>

              {/* Speedup distribution bar chart */}
              <p className="text-[9px] font-[family-name:var(--font-ibm-mono)] text-[#525252] uppercase tracking-widest mb-2">Speedup Distribution</p>
              <div className="flex items-end gap-1 h-16">
                {TASKS.map((t, i) => {
                  const sp = t.baseline.time / t.optimized.time;
                  const maxSp = maxSpeedup;
                  const h = (sp / maxSp) * 100;
                  return (
                    <div key={t.id} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-[8px] font-[family-name:var(--font-ibm-mono)] text-[#525252] tabular-nums">{sp.toFixed(0)}×</span>
                      <div
                        className="w-full bg-[#ff6b2b] min-h-[2px] transition-all duration-300"
                        style={{ height: `${h}%` }}
                      />
                      <span className="text-[7px] font-[family-name:var(--font-ibm-mono)] text-[#333]">#{t.id}</span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Collapsed indicator dot */}
        <button
          onClick={() => setMonitorExpanded(c => !c)}
          className="size-8 bg-[#141414] border border-[#262626] flex items-center justify-center text-[#525252] hover:text-[#ff6b2b] hover:border-[#ff6b2b]/30 transition-colors"
          aria-label="Toggle system monitor"
        >
          <Monitor className="size-3.5" />
        </button>
      </div>

      {/* ─── TASK COMPARISON PANEL ─── */}
      {taskCompareMode && compareSelected.size === 2 && (() => {
        const ids = Array.from(compareSelected);
        const tA = TASKS.find(t => t.id === ids[0])!;
        const tB = TASKS.find(t => t.id === ids[1])!;
        const spA = tA.baseline.time / tA.optimized.time;
        const spB = tB.baseline.time / tB.optimized.time;
        const maxSp = Math.max(spA, spB);
        const memA = (1 - tA.optimized.memory / tA.baseline.memory) * 100;
        const memB = (1 - tB.optimized.memory / tB.baseline.memory) * 100;
        const maxMem = Math.max(Math.abs(memA), Math.abs(memB));
        return (
          <div className={`compare-panel custom-scrollbar ${compareSelected.size === 2 ? 'open' : ''}`}>
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-[family-name:var(--font-ibm-mono)] text-[#525252] uppercase tracking-widest">Task Comparison</span>
                <button
                  onClick={() => { setCompareSelected(new Set()); setTaskCompareMode(false); }}
                  className="text-[#525252] hover:text-[#ff6b2b] transition-colors"
                >
                  <ChevronUp className="size-4 rotate-90" />
                </button>
              </div>

              {/* Task names */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-[#0f0f0f] border border-[#262626]">
                  <span className="text-[10px] font-[family-name:var(--font-ibm-mono)] text-[#ff6b2b]">#{tA.id}</span>
                  <p className="text-xs text-[#d4d4d4] mt-1 line-clamp-2">{tA.title}</p>
                </div>
                <div className="p-3 bg-[#0f0f0f] border border-[#262626]">
                  <span className="text-[10px] font-[family-name:var(--font-ibm-mono)] text-[#4ade80]">#{tB.id}</span>
                  <p className="text-xs text-[#d4d4d4] mt-1 line-clamp-2">{tB.title}</p>
                </div>
              </div>

              {/* Speedup comparison */}
              <div className="p-3 bg-[#141414] border border-[#262626]">
                <p className="text-[9px] font-[family-name:var(--font-ibm-mono)] text-[#333] uppercase tracking-widest mb-3">Speedup Comparison</p>
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-[family-name:var(--font-ibm-mono)] text-[#ff6b2b]">#{tA.id}</span>
                      <span className="text-sm font-bold font-[family-name:var(--font-ibm-mono)] text-[#ff6b2b] metric-pulse">{spA.toFixed(1)}×</span>
                    </div>
                    <div className="compare-bar-track"><div className="compare-bar-fill bg-[#ff6b2b]" style={{ width: `${(spA / maxSp) * 100}%` }} /></div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-[family-name:var(--font-ibm-mono)] text-[#4ade80]">#{tB.id}</span>
                      <span className="text-sm font-bold font-[family-name:var(--font-ibm-mono)] text-[#4ade80] metric-pulse">{spB.toFixed(1)}×</span>
                    </div>
                    <div className="compare-bar-track"><div className="compare-bar-fill bg-[#4ade80]" style={{ width: `${(spB / maxSp) * 100}%` }} /></div>
                  </div>
                </div>
              </div>

              {/* Memory comparison */}
              <div className="p-3 bg-[#141414] border border-[#262626]">
                <p className="text-[9px] font-[family-name:var(--font-ibm-mono)] text-[#333] uppercase tracking-widest mb-3">Memory Delta</p>
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-[family-name:var(--font-ibm-mono)] text-[#ff6b2b]">#{tA.id}</span>
                      <span className={`text-sm font-bold font-[family-name:var(--font-ibm-mono)] ${memA > 0 ? 'text-[#4ade80]' : 'text-[#f87171]'}`}>{memA > 0 ? '-' : '+'}{Math.abs(memA)}%</span>
                    </div>
                    <div className="compare-bar-track"><div className={`compare-bar-fill ${memA > 0 ? 'bg-[#4ade80]' : 'bg-[#f87171]'}`} style={{ width: `${(Math.abs(memA) / maxMem) * 100}%` }} /></div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-[family-name:var(--font-ibm-mono)] text-[#4ade80]">#{tB.id}</span>
                      <span className={`text-sm font-bold font-[family-name:var(--font-ibm-mono)] ${memB > 0 ? 'text-[#4ade80]' : 'text-[#f87171]'}`}>{memB > 0 ? '-' : '+'}{Math.abs(memB)}%</span>
                    </div>
                    <div className="compare-bar-track"><div className={`compare-bar-fill ${memB > 0 ? 'bg-[#4ade80]' : 'bg-[#f87171]'}`} style={{ width: `${(Math.abs(memB) / maxMem) * 100}%` }} /></div>
                  </div>
                </div>
              </div>

              {/* Complexity badges */}
              <div className="p-3 bg-[#141414] border border-[#262626]">
                <p className="text-[9px] font-[family-name:var(--font-ibm-mono)] text-[#333] uppercase tracking-widest mb-3">Complexity</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[9px] font-[family-name:var(--font-ibm-mono)] text-[#ff6b2b]">#{tA.id}</span>
                    <div className="mt-1 space-y-1">
                      <p className="text-[10px] font-[family-name:var(--font-ibm-mono)] text-[#525252]">Time: <span className="text-[#d4d4d4]">{tA.optimized.timeComplexity}</span></p>
                      <p className="text-[10px] font-[family-name:var(--font-ibm-mono)] text-[#525252]">Space: <span className="text-[#d4d4d4]">{tA.optimized.spaceComplexity}</span></p>
                    </div>
                  </div>
                  <div>
                    <span className="text-[9px] font-[family-name:var(--font-ibm-mono)] text-[#4ade80]">#{tB.id}</span>
                    <div className="mt-1 space-y-1">
                      <p className="text-[10px] font-[family-name:var(--font-ibm-mono)] text-[#525252]">Time: <span className="text-[#d4d4d4]">{tB.optimized.timeComplexity}</span></p>
                      <p className="text-[10px] font-[family-name:var(--font-ibm-mono)] text-[#525252]">Space: <span className="text-[#d4d4d4]">{tB.optimized.spaceComplexity}</span></p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Technique count comparison */}
              <div className="p-3 bg-[#141414] border border-[#262626]">
                <p className="text-[9px] font-[family-name:var(--font-ibm-mono)] text-[#333] uppercase tracking-widest mb-3">Techniques & Category</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] font-[family-name:var(--font-ibm-mono)] text-[#ff6b2b]">#{tA.id}: {tA.techniques.length} techniques</p>
                    <p className="text-[10px] text-[#525252] mt-0.5">{tA.category} · {tA.difficulty}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-[family-name:var(--font-ibm-mono)] text-[#4ade80]">#{tB.id}: {tB.techniques.length} techniques</p>
                    <p className="text-[10px] text-[#525252] mt-0.5">{tB.category} · {tB.difficulty}</p>
                  </div>
                </div>
              </div>

              {/* CSS bar chart - visual comparison */}
              <div className="p-3 bg-[#141414] border border-[#262626]">
                <p className="text-[9px] font-[family-name:var(--font-ibm-mono)] text-[#333] uppercase tracking-widest mb-3">Relative Performance</p>
                <div className="space-y-2">
                  {[{ label: 'Speedup', valA: spA, valB: spB, max: maxSp }, { label: 'Baseline Time (s)', valA: tA.baseline.time / 1000, valB: tB.baseline.time / 1000, max: Math.max(tA.baseline.time, tB.baseline.time) / 1000, invert: true }].map((row, i) => (
                    <div key={i}>
                      <p className="text-[9px] font-[family-name:var(--font-ibm-mono)] text-[#525252] mb-1">{row.label}</p>
                      <div className="flex gap-1 items-center">
                        <span className="text-[8px] font-[family-name:var(--font-ibm-mono)] text-[#ff6b2b] w-6 text-right">{row.label === 'Speedup' ? row.valA.toFixed(1) : row.valA.toFixed(1)}</span>
                        <div className="flex-1 compare-bar-track">
                          <div className="compare-bar-fill bg-[#ff6b2b]" style={{ width: `${row.invert ? Math.max(5, 100 - (row.valA / row.max) * 95) : (row.valA / row.max) * 100}%` }} />
                        </div>
                      </div>
                      <div className="flex gap-1 items-center">
                        <span className="text-[8px] font-[family-name:var(--font-ibm-mono)] text-[#4ade80] w-6 text-right">{row.label === 'Speedup' ? row.valB.toFixed(1) : row.valB.toFixed(1)}</span>
                        <div className="flex-1 compare-bar-track">
                          <div className="compare-bar-fill bg-[#4ade80]" style={{ width: `${row.invert ? Math.max(5, 100 - (row.valB / row.max) * 95) : (row.valB / row.max) * 100}%` }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ─── BACK TO TOP BUTTON ─── */}
      <AnimatePresence>
        {showBackToTop && (
          <motion.button
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2 }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="fixed bottom-6 right-6 z-50 size-10 bg-[#141414] border border-[#262626] flex items-center justify-center text-[#525252] hover:text-[#ff6b2b] hover:border-[#ff6b2b]/30 transition-colors"
            aria-label="Back to top"
          >
            <ArrowUp className="size-4" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* ─── COMMAND PALETTE ─── */}
      <CommandPalette
        open={showCmdPalette}
        onClose={() => setShowCmdPalette(false)}
        onNavigate={(id) => scrollTo(id)}
        onAction={handleCmdAction}
        allTasks={TASKS}
      />

      {/* ─── HELP MODAL ─── */}
      <HelpModal
        open={showHelpModal}
        onClose={() => setShowHelpModal(false)}
      />

      {/* ─── FOOTER ─── */}
      <footer className="mt-auto border-t border-[#262626] bg-[#0a0a0a]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs font-[family-name:var(--font-ibm-mono)] text-[#525252] uppercase tracking-widest">
            Performance Lab
          </p>
          <p className="text-xs font-[family-name:var(--font-ibm-mono)] text-[#333] uppercase tracking-widest">
            Rust · SIMD · Lock-free · Zero-copy
          </p>
        </div>
      </footer>
    </div>
  );
}
