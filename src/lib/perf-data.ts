import {
  Search,
  FileText,
  Network,
  Grid3x3,
  ArrowRightLeft,
} from "lucide-react";

/* ───────────────────────── TASK DATA ───────────────────────── */

export interface TaskData {
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

export const TASKS: TaskData[] = [
  {
    id: 1,
    title: "Поиск дубликатов в массиве 10M строк",
    subtitle: "Алгоритмы + Память",
    icon: Search,
    category: "Алгоритмы",
    categoryColor: "bg-[#4589ff]/10 text-[#4589ff]",
    difficulty: "Продвинутый",
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
    subtitle: "I/O + Аллокации",
    icon: FileText,
    category: "I/O",
    categoryColor: "bg-[#a56eff]/10 text-[#a56eff]",
    difficulty: "Экспертный",
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
    subtitle: "Конкурентность",
    icon: Network,
    category: "Конкурентность",
    categoryColor: "bg-[#a56eff]/10 text-[#a56eff]",
    difficulty: "Продвинутый",
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
    subtitle: "SIMD + Кэш",
    icon: Grid3x3,
    category: "Вычисления",
    categoryColor: "bg-[#08bdba]/10 text-[#08bdba]",
    difficulty: "Экспертный",
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
    subtitle: "Параллелизм",
    icon: ArrowRightLeft,
    category: "Параллелизм",
    categoryColor: "bg-[#08bdba]/10 text-[#08bdba]",
    difficulty: "Экспертный",
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

/* ─────────────────────── PRECOMPUTED CONSTANTS ─────────────────────── */

export const TOTAL_SPEEDUP = TASKS.reduce((a, t) => a + t.baseline.time / t.optimized.time, 0);
export const MEM_IMPROVED_COUNT = TASKS.filter((t) => t.optimized.memory < t.baseline.memory).length;
export const TOTAL_TIME_SAVED = TASKS.reduce((a, t) => a + (t.baseline.time - t.optimized.time), 0);
export const TOTAL_MEM_SAVED = TASKS.reduce((a, t) => a + (t.baseline.memory - t.optimized.memory), 0);
export const SPEEDUPS = TASKS.map(t => t.baseline.time / t.optimized.time);
export const MIN_SPEEDUP = Math.min(...SPEEDUPS);
export const MAX_SPEEDUP = Math.max(...SPEEDUPS);
export const AVG_SPEEDUP = SPEEDUPS.reduce((a, b) => a + b, 0) / SPEEDUPS.length;
export const DIFF_COUNTS = {
  "Все": TASKS.length,
  "Продвинутый": TASKS.filter(t => t.difficulty === "Продвинутый").length,
  "Экспертный": TASKS.filter(t => t.difficulty === "Экспертный").length,
};

/* ─────────────────────── TECHNIQUE TAG CLOUD DATA ─────────────────────── */

export const ALL_TECHNIQUES = (() => {
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

export function calcReadingTime(task: TaskData): number {
  const codeLines = task.baseline.code.split('\n').length + task.optimized.code.split('\n').length;
  const textChars = task.problem.length + task.techniques.reduce((a, t) => a + t.desc.length + t.name.length, 0);
  return Math.max(1, Math.ceil(codeLines / 30 + textChars / 250));
}

export function formatMs(ms: number): string {
  if (ms >= 1000) return `${(ms / 1000).toFixed(ms >= 10000 ? 0 : 1)}s`;
  return `${ms.toFixed(0)}ms`;
}

/* ─────────────────────── GRADE HELPER ─────────────────────── */

export function getGrade(speedup: number): { letter: string; className: string } {
  if (speedup >= 30) return { letter: "S", className: "grade-s" };
  if (speedup >= 10) return { letter: "A", className: "grade-a" };
  if (speedup >= 3) return { letter: "B", className: "grade-b" };
  return { letter: "C", className: "grade-c" };
}

/* ─────────────────────── HEATMAP DATA ─────────────────────── */

export const HEATMAP_DATA = [
  // [task, speed, memory, cache, parallelism, complexity]
  { task: 1, speed: 0.7, memory: 0.6, cache: 0.8, parallelism: 0.1, complexity: 0.5 },
  { task: 2, speed: 0.95, memory: 0.85, cache: 0.6, parallelism: 0.1, complexity: 0.7 },
  { task: 3, speed: 0.9, memory: 0.3, cache: 0.2, parallelism: 0.95, complexity: 0.6 },
  { task: 4, speed: 0.8, memory: 0.2, cache: 0.95, parallelism: 0.3, complexity: 0.9 },
  { task: 5, speed: 0.85, memory: 0.5, cache: 0.7, parallelism: 0.9, complexity: 0.95 },
];

/* ─────────────────────── ACHIEVEMENTS ─────────────────────── */

export interface AchievementCtx {
  totalExpanded: number;
  reviewed: number;
  viewedTask3: boolean;
  earned: Set<string>;
}

export const ACHIEVEMENTS = [
  { id: "first-look", name: "Первый взгляд", desc: "Раскройте первую задачу", icon: "EYE", check: (ctx: AchievementCtx) => ctx.totalExpanded >= 1 },
  { id: "code-reviewer", name: "Ревьюер кода", desc: "Просмотрите 3 задачи", icon: "MAG", check: (ctx: AchievementCtx) => ctx.reviewed >= 3 },
  { id: "speed-demon", name: "Мастер скорости", desc: "Посмотрите самую быструю задачу (#3)", icon: "ZAP", check: (ctx: AchievementCtx) => ctx.viewedTask3 },
  { id: "completionist", name: "Компletionist", desc: "Просмотрите все 5 задач", icon: "TRO", check: (ctx: AchievementCtx) => ctx.reviewed >= 5 },
  { id: "bookworm", name: "Книжный червь", desc: "Раскройте все задачи одновременно", icon: "BOK", check: (ctx: AchievementCtx) => ctx.totalExpanded >= 5 },
];

/* ─────────────────────── ACCENT COLORS ─────────────────────── */

export const ACCENT_COLORS = [
  { name: "Оранжевый", value: "#ff6b2b" },
  { name: "Голубой", value: "#22d3ee" },
  { name: "Розовый", value: "#f43f5e" },
  { name: "Лаймовый", value: "#84cc16" },
  { name: "Фиолетовый", value: "#a78bfa" },
];
