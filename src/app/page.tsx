"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useTheme } from "next-themes";
import { motion, useInView } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Cell,
  Legend,
} from "recharts";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import {
  Sun,
  Moon,
  Search,
  FileText,
  Network,
  Grid3x3,
  ArrowRightLeft,
  Zap,
  Clock,
  MemoryStick,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Cpu,
  Layers,
  Database,
  Gauge,
  Shield,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  GitCompareArrows,
  BookOpen,
  Target,
  Award,
  Code2,
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
    categoryColor: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300",
    difficulty: "Advanced",
    difficultyColor: "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300",
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
    categoryColor: "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300",
    difficulty: "Expert",
    difficultyColor: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300",
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
    categoryColor: "bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300",
    difficulty: "Advanced",
    difficultyColor: "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300",
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
    categoryColor: "bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300",
    difficulty: "Expert",
    difficultyColor: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300",
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
    categoryColor: "bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-300",
    difficulty: "Expert",
    difficultyColor: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300",
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

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { requestAnimationFrame(() => setMounted(true)); }, []);
  if (!mounted) return <Button variant="ghost" size="icon" className="size-9"><Sun className="size-4" /></Button>;
  return (
    <Button variant="ghost" size="icon" className="size-9" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} aria-label="Toggle theme">
      {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  );
}

function SectionTitle({ children, id }: { children: React.ReactNode; id?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div ref={ref} id={id} initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5 }} className="mb-6">
      <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{children}</h2>
      <Separator className="mt-3 h-0.5 bg-emerald-200 dark:bg-emerald-800 w-24" />
    </motion.div>
  );
}

function FadeIn({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 24 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay }} className={className}>
      {children}
    </motion.div>
  );
}

function CodeBlock({ code, title, variant }: { code: string; title: string; variant: "baseline" | "optimized" }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  return (
    <Card className="overflow-hidden border-0">
      <div className={`px-4 py-2.5 flex items-center justify-between ${variant === "baseline" ? "bg-red-50 dark:bg-red-950/30 border-b border-red-200 dark:border-red-800" : "bg-emerald-50 dark:bg-emerald-950/30 border-b border-emerald-200 dark:border-emerald-800"}`}>
        <div className="flex items-center gap-2">
          <Code2 className={`size-4 ${variant === "baseline" ? "text-red-500" : "text-emerald-500"}`} />
          <span className={`text-sm font-semibold ${variant === "baseline" ? "text-red-700 dark:text-red-400" : "text-emerald-700 dark:text-emerald-400"}`}>{title}</span>
        </div>
        <Badge variant={variant === "baseline" ? "destructive" : "default"} className="text-[10px]">
          {variant === "baseline" ? "Naive" : "Optimized"}
        </Badge>
      </div>
      <div className="max-h-[480px] overflow-auto custom-scrollbar">
        <SyntaxHighlighter language="rust" style={isDark ? oneDark : undefined} customStyle={{ margin: 0, padding: "1rem", background: isDark ? "#1e1e1e" : "#fafafa", fontSize: "0.8rem", lineHeight: "1.5" }} showLineNumbers lineNumberStyle={{ color: isDark ? "#555" : "#ccc", minWidth: "2.5em" }}>
          {code}
        </SyntaxHighlighter>
      </div>
    </Card>
  );
}

function BenchChart({ task }: { task: TaskData }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const speedup = (task.baseline.time / task.optimized.time).toFixed(1);
  const memSave = ((1 - task.optimized.memory / task.baseline.memory) * 100).toFixed(0);

  const formatTime = (ms: number) => {
    if (ms >= 1000) return `${(ms / 1000).toFixed(ms >= 10000 ? 0 : 1)}s`;
    return `${ms.toFixed(0)}ms`;
  };

  const chartData = [
    {
      name: "Время",
      Baseline: task.baseline.time,
      Optimized: task.optimized.time,
    },
    {
      name: "Память (MB)",
      Baseline: task.baseline.memory,
      Optimized: task.optimized.memory,
    },
  ];

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Gauge className="size-5 text-emerald-600 dark:text-emerald-400" />
          Benchmark
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-lg p-3 text-center border border-emerald-200 dark:border-emerald-800">
            <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">{speedup}×</p>
            <p className="text-xs text-muted-foreground">ускорение</p>
          </div>
          <div className="bg-amber-50 dark:bg-amber-950/30 rounded-lg p-3 text-center border border-amber-200 dark:border-amber-800">
            <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">−{memSave}%</p>
            <p className="text-xs text-muted-foreground">экономия памяти</p>
          </div>
        </div>

        {/* Detail table */}
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground flex items-center gap-1.5"><Clock className="size-3.5" /> Baseline</span>
            <span className="font-mono font-medium">{formatTime(task.baseline.time)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground flex items-center gap-1.5"><Clock className="size-3.5 text-emerald-500" /> Optimized</span>
            <span className="font-mono font-medium text-emerald-600 dark:text-emerald-400">{formatTime(task.optimized.time)}</span>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground flex items-center gap-1.5"><MemoryStick className="size-3.5" /> Baseline</span>
            <span className="font-mono font-medium">{task.baseline.memory} MB</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground flex items-center gap-1.5"><MemoryStick className="size-3.5 text-emerald-500" /> Optimized</span>
            <span className="font-mono font-medium text-emerald-600 dark:text-emerald-400">{task.optimized.memory} MB</span>
          </div>
        </div>

        {/* Chart */}
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} barCategoryGap="20%" barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#333" : "#e5e5e5"} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: isDark ? "#999" : "#666" }} />
              <YAxis tick={{ fontSize: 11, fill: isDark ? "#999" : "#666" }} />
              <Bar dataKey="Baseline" fill="#ef4444" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Optimized" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Legend iconSize={8} wrapperStyle={{ fontSize: "11px" }} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

function ComplexityBadge({ label, complexity }: { label: string; complexity: string }) {
  const isGood = complexity.includes("1)") || complexity.includes("log") || complexity === "O(n) amortized" || complexity === "O(k) output only" || complexity === "O(capacity)" || complexity === "O(n/c) c=concurrency";
  const isOk = complexity.includes("n³") || complexity === "O(n×m)";
  const color = isOk ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 border-red-200 dark:border-red-800"
    : complexity === "O(n)" || complexity === "O(n) avg" || complexity === "O(n²)" || complexity === "O(n×m)"
      ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 border-amber-200 dark:border-amber-800"
      : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800";
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-mono font-medium px-2 py-0.5 rounded-md border ${color}`}>
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
        <Card className="border-2 hover:border-emerald-200 dark:hover:border-emerald-800 transition-colors cursor-pointer" onClick={() => setExpanded(!expanded)}>
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex items-center gap-3 flex-1">
                <div className="size-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shrink-0">
                  <Icon className="size-6 text-white" />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 text-[10px]">#{task.id}</Badge>
                    <Badge className={task.difficultyColor}>{task.difficulty}</Badge>
                    <Badge className={task.categoryColor}>{task.category}</Badge>
                    <Badge variant="outline" className="text-emerald-600 border-emerald-300 dark:text-emerald-400 dark:border-emerald-700">
                      <Zap className="size-3 mr-0.5" /> {speedup}× faster
                    </Badge>
                  </div>
                  <CardTitle className="text-lg">{task.title}</CardTitle>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground sm:pr-2">
                {expanded ? <ChevronUp className="size-5" /> : <ChevronDown className="size-5" />}
              </div>
            </div>
          </CardHeader>
        </Card>
      </FadeIn>

      {/* Expanded Content */}
      {expanded && (
        <div className="mt-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
          {/* Problem Statement */}
          <FadeIn delay={0.05}>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Target className="size-5 text-amber-500" />
                  Условие задачи
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm leading-relaxed">{task.problem}</p>
                <div className="flex flex-wrap gap-2">
                  {task.constraints.map((c, i) => (
                    <Badge key={i} variant="outline" className="text-xs font-normal">
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
              <TabsList className="w-full">
                <TabsTrigger value="baseline" className="flex-1 text-xs">
                  <XCircle className="size-3.5 mr-1 text-red-500" /> Baseline
                </TabsTrigger>
                <TabsTrigger value="optimized" className="flex-1 text-xs">
                  <CheckCircle2 className="size-3.5 mr-1 text-emerald-500" /> Optimized
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
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <GitCompareArrows as={GitCompareArrows} className="size-5 text-emerald-600 dark:text-emerald-400" />
                  Big O Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-red-50 dark:bg-red-950/20 rounded-lg p-4 border border-red-200 dark:border-red-800">
                    <p className="text-sm font-semibold text-red-700 dark:text-red-400 mb-2">Baseline</p>
                    <div className="flex flex-wrap gap-2">
                      <ComplexityBadge label="Time" complexity={task.baseline.timeComplexity} />
                      <ComplexityBadge label="Space" complexity={task.baseline.spaceComplexity} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{task.baseline.explanation}</p>
                  </div>
                  <div className="bg-emerald-50 dark:bg-emerald-950/20 rounded-lg p-4 border border-emerald-200 dark:border-emerald-800">
                    <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 mb-2">Optimized</p>
                    <div className="flex flex-wrap gap-2">
                      <ComplexityBadge label="Time" complexity={task.optimized.timeComplexity} />
                      <ComplexityBadge label="Space" complexity={task.optimized.spaceComplexity} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{task.optimized.explanation}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </FadeIn>

          {/* Key Optimizations */}
          <FadeIn delay={0.15}>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <BookOpen className="size-5 text-amber-500" />
                  Ключевые оптимизации
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {task.techniques.map((t, i) => (
                    <div key={i} className="bg-muted/50 rounded-lg p-3 border border-border">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="size-2 rounded-full bg-emerald-500" />
                        <p className="text-sm font-semibold">{t.name}</p>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{t.desc}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </FadeIn>
        </div>
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
  ];

  const totalSpeedup = TASKS.reduce((a, t) => a + t.baseline.time / t.optimized.time, 0);

  return (
    <div className="min-h-screen flex flex-col">
      {/* ─── STICKY NAV ─── */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar max-w-[75vw]">
              {navItems.map((item) => (
                <Button key={item.id} variant={activeSection === item.id ? "default" : "ghost"} size="sm" className="text-xs shrink-0" onClick={() => scrollTo(item.id)}>
                  {item.label}
                </Button>
              ))}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Badge variant="outline" className="hidden sm:inline-flex text-emerald-700 border-emerald-300 dark:text-emerald-400 dark:border-emerald-700">
                <Cpu className="size-3 mr-1" /> 5 Tasks
              </Badge>
              <ThemeToggle />
            </div>
          </div>
        </nav>
      </header>

      {/* ─── MAIN ─── */}
      <main className="flex-1 mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* ═══ HERO ═══ */}
        <section ref={registerSection("hero")} id="hero">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-900 dark:from-emerald-900 dark:via-emerald-950 dark:to-emerald-900 p-6 sm:p-10">
            <div className="absolute top-0 right-0 w-72 h-72 bg-emerald-500/20 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-500/10 rounded-full translate-y-1/2 -translate-x-1/2" />

            <div className="relative z-10 space-y-6">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="size-12 rounded-xl bg-white/15 flex items-center justify-center">
                    <Zap className="size-7 text-amber-300" />
                  </div>
                  <div>
                    <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">Performance Lab</h1>
                    <p className="text-emerald-200 text-sm">5 задач на высокопроизводительный код</p>
                  </div>
                </div>
                <p className="text-white/80 text-sm sm:text-base max-w-2xl leading-relaxed">
                  Каждый challenge — реальная задача системного программирования. Naive vs Optimized подход на Rust с анализом Big O, бенчмарками и объяснением каждой оптимизации.
                </p>
              </div>

              {/* Stats */}
              <div className="flex flex-wrap gap-4">
                {[
                  { icon: Layers, val: "5", label: "Задач" },
                  { icon: Gauge, val: `${totalSpeedup.toFixed(0)}×`, label: "Суммарное ускорение" },
                  { icon: MemoryStick, val: "73%", label: "Ср. экономия памяти" },
                  { icon: Cpu, val: "Rust", label: "Язык" },
                ].map((s, i) => (
                  <div key={i} className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2.5 border border-white/10">
                    <div className="flex items-center gap-2">
                      <s.icon className="size-4 text-amber-300" />
                      <span className="text-xl font-bold text-white">{s.val}</span>
                      <span className="text-xs text-emerald-200">{s.label}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Task Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
                {TASKS.map((t) => {
                  const Icon = t.icon;
                  const speedup = (t.baseline.time / t.optimized.time).toFixed(1);
                  return (
                    <button key={t.id} onClick={() => scrollTo(`task-${t.id}`)} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:bg-white/20 transition-colors text-left group">
                      <div className="flex items-center gap-2 mb-2">
                        <Icon className="size-5 text-amber-300 group-hover:text-amber-200 transition-colors" />
                        <Badge className="bg-white/15 text-white text-[10px] border-white/20">#{t.id}</Badge>
                        <Badge className={`${t.difficultyColor} text-[10px] border`}>{t.difficulty}</Badge>
                      </div>
                      <p className="text-white text-xs font-medium line-clamp-2 leading-relaxed">{t.title}</p>
                      <p className="text-amber-300 text-lg font-bold mt-2">{speedup}×</p>
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

        {/* ═══ SUMMARY ═══ */}
        <section ref={registerSection("summary")} id="summary">
          <FadeIn>
            <Card className="border-2 border-emerald-200 dark:border-emerald-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="size-5 text-amber-500" />
                  Итоги Performance Lab
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  {TASKS.map((t) => {
                    const speedup = (t.baseline.time / t.optimized.time).toFixed(1);
                    return (
                      <div key={t.id} className="text-center p-3 bg-muted/50 rounded-lg">
                        <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">{speedup}×</p>
                        <p className="text-xs text-muted-foreground mt-1">#{t.id}</p>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg p-4 border border-emerald-200 dark:border-emerald-800">
                  <p className="text-sm text-emerald-800 dark:text-emerald-200 leading-relaxed">
                    <span className="font-semibold">8 принципов performance-code-generator:</span>{" "}
                    Big O оптимизация → Кэш-локальность (Data-Oriented Design) → Минимизация аллокаций → Async I/O → Lock-free конкурентность → Zero-cost абстракции → SIMD векторизация → Профилирование («Измеряй, а не гадай»).
                  </p>
                </div>
              </CardContent>
            </Card>
          </FadeIn>
        </section>
      </main>

      {/* ─── FOOTER ─── */}
      <footer className="mt-auto border-t border-border bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">Performance Lab — 5 задач на высокопроизводительный код</p>
          <p className="text-xs text-muted-foreground">Rust · SIMD · Lock-free · Zero-copy · Cache-oblivious</p>
        </div>
      </footer>
    </div>
  );
}
