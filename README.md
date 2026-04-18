# Performance Lab

SPA с 5 задачами оптимизации на Rust. Каждая задача содержит наивный и оптимизированный код с анализом Big O, бенчмарками и объяснением техник. Industrial Minimalism дизайн.

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=flat-square&logo=tailwindcss)

## Features

- 5 задач оптимизации Rust (Naive vs Optimized) с Big O анализом
- Сравнение кода (вкладки / side-by-side / diff)
- Сортировка, фильтрация и поиск по техникам
- Сравнение задач (до 2 одновременно)
- Системный монитор производительности
- Тепловая карта оптимизаций
- Достижения и трекинг прогресса
- Экспорт отчёта в Markdown
- Горячие клавиши и палитра команд (Ctrl+K)
- Guided Tour для нового пользователя

## Tech Stack

- **Framework** - Next.js 16 (App Router, React 19)
- **Language** - TypeScript 5 (strict)
- **Styling** - Tailwind CSS 4 + shadcn/ui (New York)
- **Database** - Prisma ORM (SQLite)
- **Icons** - Lucide React
- **Animation** - Framer Motion
- **State** - React hooks + localStorage persistence

## Getting Started

### Prerequisites

- Node.js 18+ or Bun
- Git

### Installation

```bash
# Install dependencies
bun install

# Configure environment
cp .env.example .env

# Setup database
bun run db:push

# Run development server
bun run dev
```

## Scripts

| Script | Description |
|---|---|
| `bun run dev` | Development server (port 3000) |
| `bun run build` | Production build |
| `bun run lint` | ESLint check |
| `bun run db:push` | Push Prisma schema to SQLite |
| `bun run db:generate` | Generate Prisma Client |
| `bun run db:reset` | Reset database |

## Project Structure

- `src/app/` - Application routes (page.tsx - main SPA)
- `src/components/perf/` - Performance Lab components
- `src/components/ui/` - shadcn/ui library
- `src/lib/` - Utilities, data, hooks
- `prisma/` - Database schema
- `instructions/` - Agent instructions
- `upload/` - Standard documents

## Configuration

### Environment Variables

See `.env.example`:

```env
DATABASE_URL="file:./db/dev.db"
```

## Development Rules

### Required Technologies

- Next.js 16 with App Router
- TypeScript 5 strict
- Tailwind CSS 4 with shadcn/ui
- Prisma ORM (SQLite)
- Lucide React for icons

### Code Style

- Industrial Minimalism design system
- No-Unicode Policy v2.1 [C] - zero emoji/unicode in UI code
- MARKDOWN_STANDARD v2.1 [W] - for all .md files
- REPRODUCIBILITY-STANDARD - relative paths, .env.example required
- Monospace-dominant typography (IBM Plex Mono)
- Dark theme mandatory (bg-[#0a0a0a], accent-[#ff6b2b])

### Color Palette

- Background: #0a0a0a (near-black)
- Surface: #141414
- Border: #262626
- Text: #d4d4d4 / #8a8a8a / #525252
- Accent: #ff6b2b (industrial orange)
- Success: #4ade80 (green)
- Error: #f87171 (red)

## Agent Rules (Mandatory)

Any AI agent working on this project MUST read and follow `AGENT_RULES.md`
before performing any operations.

See `AGENT_RULES.md` for full details.
See `instructions/` for complete rule descriptions.

---
Built with: Next.js 16 + TypeScript + Tailwind CSS
