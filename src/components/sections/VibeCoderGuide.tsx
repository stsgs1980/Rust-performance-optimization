"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FadeIn } from "@/components/perf/SmallComponents";
import { Sparkles, AlertTriangle } from "lucide-react";

export function VibeCoderGuide() {
  return (
    <section id="vibe-coder">
      <FadeIn>
        <Card className="border border-[#262626] bg-[#141414] border-l-2 border-l-[#fbbf24] card-industrial">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="size-3.5 text-[#fbbf24]" />
              <CardTitle className="text-xs uppercase tracking-widest text-[#8a8a8a]">
                Вайб-гайд разработчика
              </CardTitle>
            </div>
            <p className="text-[10px] text-[#666666] font-[family-name:var(--font-ibm-mono)] mt-1">
              Как перевести 5 задач с языка "ментального расстройства Rust-разработчика" на язык "комфортного веб-разработчика"
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Warning banner */}
            <div className="flex items-start gap-2 p-3 bg-[#fbbf24]/5 border border-[#fbbf24]/20 warning-stripe">
              <AlertTriangle className="size-3.5 text-[#fbbf24] shrink-0 mt-0.5" />
              <div className="text-[10px] text-[#fbbf24] leading-relaxed font-[family-name:var(--font-ibm-mono)]">
                <p className="font-bold uppercase tracking-widest mb-1">Осторожно: мины замедленного действия</p>
                <p>Задача 2 (CSV): Box::leak(mmap...) — утечка памяти. Задача 5 (Lock-free): unsafe impl Send/Sync — если ошибётесь хотя бы в одном Ordering, получите "призрачные" баги раз в месяц.</p>
              </div>
            </div>

            {/* Vibe Coder Mantra */}
            <div className="p-4 bg-[#0f0f0f] border border-[#262626] border-l-2 border-l-[#fbbf24]">
              <p className="text-xs text-[#d4d4d4] font-medium mb-1 font-[family-name:var(--font-ibm-mono)] quote-glow">
                "Все эти оптимизации уже написаны грустными людьми на Rust и C++. Моя задача — найти их npm-пакет и импортировать."
              </p>
              <p className="text-[9px] text-[#666666] uppercase tracking-widest font-[family-name:var(--font-ibm-mono)]">— Мантра вайб-кодера на 2026</p>
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
                    <span className="text-[9px] font-[family-name:var(--font-ibm-mono)] text-[#666666] uppercase tracking-widest">Задача {item.id}</span>
                  </div>
                  <div className="mb-2 pl-3 border-l-2 border-[#262626]">
                    <p className="text-[9px] font-[family-name:var(--font-ibm-mono)] text-[#8a8a8a] uppercase tracking-wider mb-0.5">Вайб кодер думает:</p>
                    <code className="vibe-code">{item.vibe}</code>
                  </div>
                  <div className="mb-2 pl-3 border-l-2" style={{ borderColor: `${item.color}40` }}>
                    <p className="text-[9px] font-[family-name:var(--font-ibm-mono)] uppercase tracking-wider mb-0.5" style={{ color: item.color }}>Документ говорит:</p>
                    <p className="text-[10px] text-[#d4d4d4]">{item.doc}</p>
                  </div>
                  <div className="pl-3 border-l-2 border-[#fbbf24]/30 bg-[#fbbf24]/5 -mx-3 px-6 py-2 tip-callout">
                    <p className="text-[9px] font-[family-name:var(--font-ibm-mono)] text-[#fbbf24] uppercase tracking-wider mb-0.5">Выжимка →</p>
                    <p className="text-[10px] text-[#d4d4d4] leading-relaxed">{item.tip}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick reference table */}
            <div className="overflow-x-auto custom-scrollbar">
              <div className="text-[9px] font-[family-name:var(--font-ibm-mono)] text-[#666666] uppercase tracking-widest mb-2">Быстрый справочник: Rust → Web</div>
              <table className="w-full text-[10px]">
                <thead>
                  <tr className="border-b border-[#262626]">
                    <th className="text-left py-1.5 pr-3 text-[#8a8a8a] font-[family-name:var(--font-ibm-mono)]">Концепция Rust</th>
                    <th className="text-left py-1.5 pr-3 text-[#8a8a8a] font-[family-name:var(--font-ibm-mono)]">Эквивалент в Web</th>
                    <th className="text-left py-1.5 text-[#8a8a8a] font-[family-name:var(--font-ibm-mono)]">npm-пакет</th>
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
                      <td className="py-1.5 pr-3 text-[#8a8a8a]">{row.rust}</td>
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
  );
}
