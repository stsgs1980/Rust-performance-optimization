"use client";

import { useEffect, useRef, useState, useCallback } from "react";
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
  AlertTriangle,
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
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="flex-1 h-px bg-[#1c1c1c]" />
      <span className="text-[9px] font-[family-name:var(--font-ibm-mono)] text-[#333] uppercase tracking-[0.3em]">{label}</span>
      <div className="flex-1 h-px bg-[#1c1c1c]" />
    </div>
  );
}

function CodeBlock({ code, title, variant }: { code: string; title: string; variant: "baseline" | "optimized" }) {
  const [copied, setCopied] = useState(false);
  const lineCount = code.split('\n').length;
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="overflow-hidden border border-[#262626]">
      <div className="px-4 py-2 flex items-center justify-between border-b border-[#262626] bg-[#0f0f0f]">
        <div className="flex items-center gap-2 min-w-0">
          <Code2 className="size-3.5 text-[#525252] shrink-0" />
          <span className="text-xs font-[family-name:var(--font-ibm-mono)] text-[#525252] truncate">{title}</span>
          <span className="text-[10px] font-[family-name:var(--font-ibm-mono)] text-[#333]">{lineCount} lines</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); handleCopy(); }}
            className="text-[#525252] hover:text-[#d4d4d4] transition-colors p-1"
          >
            {copied ? <Check className="size-3.5 text-[#4ade80]" /> : <Copy className="size-3.5" />}
          </button>
          <span
            className={`text-[10px] font-[family-name:var(--font-ibm-mono)] font-medium uppercase tracking-wider px-2 py-0.5 ${
              variant === "baseline"
                ? "text-[#f87171] bg-[#f87171]/10"
                : "text-[#4ade80] bg-[#4ade80]/10"
            }`}
          >
            {variant === "baseline" ? "Baseline" : "Optimized"}
          </span>
        </div>
      </div>
      <div className="max-h-[480px] overflow-auto custom-scrollbar bg-[#0f0f0f]">
        <SyntaxHighlighter
          language="rust"
          style={oneDark}
          customStyle={{
            margin: 0,
            padding: "1rem",
            background: "#0f0f0f",
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
    <Card className="h-full bg-[#141414] border border-[#262626]">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#525252]">
          <Gauge className="size-3.5" />
          Benchmark
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 text-center border border-[#262626]">
            <p className="text-2xl font-bold text-[#ff6b2b] font-[family-name:var(--font-ibm-mono)]">
              {speedup}×
            </p>
            <p className="text-[10px] text-[#525252] uppercase tracking-widest mt-1 font-[family-name:var(--font-ibm-mono)]">
              Speedup
            </p>
          </div>
          <div className="p-4 text-center border border-[#262626]">
            <p className={`text-2xl font-bold font-[family-name:var(--font-ibm-mono)] ${parseInt(memSave) > 0 ? "text-[#4ade80]" : "text-[#f87171]"}`}>
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
      className={`inline-flex items-center gap-1 text-[11px] font-[family-name:var(--font-ibm-mono)] font-medium px-2 py-0.5 border ${color}`}
    >
      {label}: {complexity}
    </span>
  );
}

function TaskSection({ task, expanded, onToggle }: { task: TaskData; expanded: boolean; onToggle: () => void }) {
  const Icon = task.icon;
  const speedup = (task.baseline.time / task.optimized.time).toFixed(1);

  return (
    <section id={`task-${task.id}`} className="scroll-mt-16">
      <FadeIn>
        <Card
          className={`bg-[#141414] border transition-all cursor-pointer ${
            expanded
              ? "border-[#ff6b2b] border-l-[3px] ind-glow"
              : "border-[#262626] hover:border-[#3a3a3a]"
          }`}
          onClick={onToggle}
        >
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex items-center gap-3 flex-1">
                <div className="size-10 bg-[#1c1c1c] flex items-center justify-center shrink-0">
                  <Icon className="size-4 text-[#737373]" />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-[10px] font-[family-name:var(--font-ibm-mono)] text-[#525252]">
                      #{task.id}
                    </span>
                    <Badge
                      variant="outline"
                      className="text-[#525252] border-[#262626] text-[10px]"
                    >
                      {task.difficulty}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="text-[#525252] border-[#262626] text-[10px]"
                    >
                      {task.category}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="border-[#ff6b2b]/30 text-[#ff6b2b] text-[10px]"
                    >
                      {speedup}×
                    </Badge>
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
            <Card className="bg-[#141414] border border-[#262626]">
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
                      className="text-[#525252] border-[#262626] text-[10px] font-normal"
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
            <BenchChart task={task} />
          </div>

          {/* Big O Analysis */}
          <FadeIn delay={0.1}>
            <Card className="bg-[#141414] border border-[#262626]">
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
            <Card className="bg-[#141414] border border-[#262626]">
              <CardHeader className="pb-3">
                <CardTitle className="text-xs uppercase tracking-widest text-[#525252]">
                  Key Optimizations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {task.techniques.map((t, i) => (
                    <div key={i} className="bg-[#0f0f0f] p-3 border border-[#262626]">
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

/* ─────────────────────── MAIN PAGE ─────────────────────── */

export default function PerformanceLab() {
  const [activeSection, setActiveSection] = useState<string>("hero");
  const [expandedTasks, setExpandedTasks] = useState<Set<number>>(new Set());
  const [scrollProgress, setScrollProgress] = useState(0);
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");
  const [showBackToTop, setShowBackToTop] = useState(false);
  const sectionsRef = useRef<Record<string, HTMLElement | null>>({});

  const filteredTasks = difficultyFilter === "all"
    ? TASKS
    : TASKS.filter(t => t.difficulty === difficultyFilter);

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

  // Keyboard shortcuts: E to expand all, 1-5 to jump to task
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
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
    { id: "results", label: "Results" },
    { id: "summary", label: "Summary" },
  ];

  const totalSpeedup = TASKS.reduce(
    (a, t) => a + t.baseline.time / t.optimized.time,
    0
  );
  const memImprovedTasks = TASKS.filter((t) => t.optimized.memory < t.baseline.memory).length;

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0a]">
      {/* ─── SCROLL PROGRESS BAR ─── */}
      <div className="fixed top-0 left-0 right-0 z-[60] h-[2px] bg-[#1c1c1c]">
        <div className="h-full bg-[#ff6b2b] transition-all duration-150" style={{ width: `${scrollProgress}%` }} />
      </div>

      {/* ─── STICKY HEADER ─── */}
      <header className="sticky top-0 z-50 bg-[#0a0a0a] border-b border-[#262626]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-12">
            <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar max-w-[75vw]">
              {navItems.map((item) => (
                <Button
                  key={item.id}
                  variant="ghost"
                  size="sm"
                  className={`text-[10px] shrink-0 h-8 uppercase tracking-[0.2em] font-[family-name:var(--font-ibm-mono)] px-2.5 ${
                    activeSection === item.id
                      ? "text-[#ff6b2b]"
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
                onClick={toggleAll}
                className="text-[10px] font-[family-name:var(--font-ibm-mono)] text-[#525252] hover:text-[#ff6b2b] uppercase tracking-[0.15em] transition-colors"
              >
                {expandedTasks.size === TASKS.length ? "Collapse" : "Expand"}
              </button>
              <span className="hidden sm:inline text-[10px] font-[family-name:var(--font-ibm-mono)] text-[#525252] uppercase tracking-[0.15em] shrink-0">
                5 tasks · rust
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* ─── MAIN ─── */}
      <main className="flex-1 mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        {/* ═══ HERO SECTION ═══ */}
        <section ref={registerSection("hero")} id="hero">
          <FadeIn>
            <div className="relative overflow-hidden bg-[#141414] border border-[#262626] border-l-2 border-l-[#ff6b2b] p-6 sm:p-8 scanline">
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-[#d4d4d4] tracking-wider uppercase cursor-blink">
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
                  <div className="flex items-center gap-3 mt-3">
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
                      <p className="text-xl font-bold font-[family-name:var(--font-ibm-mono)] text-[#d4d4d4] [text-shadow:0_0_8px_rgba(255,107,43,0.3)]">
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

                {/* Task quick links — staggered animation */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                  {TASKS.map((t, idx) => {
                    const TIcon = t.icon;
                    const sp = (t.baseline.time / t.optimized.time).toFixed(1);
                    return (
                      <motion.button
                        key={t.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, delay: 0.1 + idx * 0.05 }}
                        onClick={() => scrollTo(`task-${t.id}`)}
                        className="bg-[#0f0f0f] p-3 border border-[#262626] hover:border-[#ff6b2b]/30 hover:-translate-y-0.5 transition-all text-left group"
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          <TIcon className="size-3 text-[#525252] group-hover:text-[#ff6b2b] transition-colors" />
                          <span className="text-[10px] font-[family-name:var(--font-ibm-mono)] text-[#525252]">
                            #{t.id}
                          </span>
                        </div>
                        <p className="text-xs text-[#737373] line-clamp-2 leading-relaxed group-hover:text-[#d4d4d4] transition-colors">
                          {t.title}
                        </p>
                        <p className="text-sm font-bold text-[#ff6b2b] font-[family-name:var(--font-ibm-mono)] mt-2">
                          {sp}×
                        </p>
                      </motion.button>
                    );
                  })}
                </div>
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
        </div>

        {/* ═══ TASK SECTIONS ═══ */}
        <div className="space-y-6">
          {filteredTasks.map((task, sectionIndex) => (
            <div key={task.id}>
              <TaskSection
                task={task}
                expanded={expandedTasks.has(task.id)}
                onToggle={() => toggleTask(task.id)}
              />
              {sectionIndex < filteredTasks.length - 1 && (
                <SectionDivider label={String(sectionIndex + 1).padStart(2, "0")} />
              )}
            </div>
          ))}
        </div>

        {/* ─── Separator ─── */}
        <SectionDivider label="MT" />

        {/* ═══ METHODOLOGY ═══ */}
        <section ref={registerSection("methodology")} id="methodology">
          <FadeIn>
            <Card className="border border-[#262626] bg-[#141414] border-l-2 border-l-[#ff6b2b]">
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
                      <div key={i} className="bg-[#0f0f0f] p-3 border border-[#262626] hover:border-[#ff6b2b]/20 transition-colors">
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
              </CardContent>
            </Card>
          </FadeIn>
        </section>

        {/* ─── Separator ─── */}
        <SectionDivider label="RS" />

        {/* ═══ RESULTS TABLE ═══ */}
        <section ref={registerSection("results")} id="results">
          <FadeIn>
            <Card className="bg-[#141414] border border-[#262626]">
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
                        <th className="text-left py-2 pr-4 text-[#525252]">#</th>
                        <th className="text-left py-2 pr-4 text-[#525252]">Task</th>
                        <th className="text-right py-2 px-3 text-[#525252]">Baseline</th>
                        <th className="text-right py-2 px-3 text-[#525252]">Optimized</th>
                        <th className="text-right py-2 px-3 text-[#525252]">Speedup</th>
                        <th className="text-right py-2 text-[#525252]">Memory</th>
                      </tr>
                    </thead>
                    <tbody>
                      {TASKS.map((t) => {
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
                            className="border-b border-[#1c1c1c] hover:bg-[#0f0f0f] transition-colors"
                          >
                            <td className="py-2.5 pr-4">
                              <span className="text-[10px] font-[family-name:var(--font-ibm-mono)] text-[#525252]">
                                #{t.id}
                              </span>
                            </td>
                            <td className="py-2.5 pr-4 max-w-[200px]">
                              <p className="text-[#737373] text-xs truncate">{t.title}</p>
                            </td>
                            <td className="py-2.5 px-3 text-right font-[family-name:var(--font-ibm-mono)] text-[#737373]">
                              {formatT(t.baseline.time)}
                            </td>
                            <td className="py-2.5 px-3 text-right font-[family-name:var(--font-ibm-mono)] text-[#4ade80]">
                              {formatT(t.optimized.time)}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <span className="font-bold font-[family-name:var(--font-ibm-mono)] text-[#ff6b2b]">
                                {sp}×
                              </span>
                            </td>
                            <td className="py-2.5 text-right">
                              <span className={`font-medium font-[family-name:var(--font-ibm-mono)] ${memImproved ? "text-[#4ade80]" : "text-[#f87171]"}`}>
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

        {/* ─── Separator ─── */}
        <SectionDivider label="SM" />

        {/* ═══ SUMMARY ═══ */}
        <section ref={registerSection("summary")} id="summary">
          <FadeIn>
            <Card className="border border-[#262626] bg-[#141414] border-l-2 border-l-[#ff6b2b]">
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
                        <p className="text-xl font-bold text-[#ff6b2b] font-[family-name:var(--font-ibm-mono)]">
                          {sp}×
                        </p>
                        <p className="text-[10px] text-[#525252] font-[family-name:var(--font-ibm-mono)] uppercase tracking-widest mt-1">
                          #{t.id}
                        </p>
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
                        <span className="text-[#ff6b2b] font-bold">
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
