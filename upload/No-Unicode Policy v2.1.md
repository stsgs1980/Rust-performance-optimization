### Файл 1: No-Unicode Policy v2.1.md
*(Что изменилось: обновлены ссылки на Markdown Standard, исправлена регулярка для уровня [I], добавлено пояснение про типографику для уровня [W], подпись стека ограничена корневыми файлами).*

```markdown
# Стандарт: No-Unicode Policy v2.1

> Стандарт использования символов, иконок и графики. Уровень Design System / Engineering Governance.
>
> **Связанный документ:** MARKDOWN_STANDARD v2.1 (уровень [W]) — для README и документации

---

## 1. Назначение

Данный стандарт устанавливает правила использования Unicode-графических символов во всех слоях продукта: интерфейс, контент, код, коммуникации системы.

### Цели:

- обеспечить визуальную консистентность
- сохранить профессиональный уровень продукта
- гарантировать управляемость через дизайн-систему
- исключить неконтролируемые визуальные артефакты

---

## 2. Разделение ответственности

| Документ | Уровень | Область применения |
|----------|---------|-------------------|
| **No-Unicode Policy v2.1** (этот документ) | [C] Critical, [I] Info | UI, продакшн-код, прототипы |
| **MARKDOWN_STANDARD v2.1** | [W] Warning | README.md, документация проекта |

---

## 3. Уровни строгости

Стандарт применяет **уровневый подход** вместо абсолютного запрета:

| Уровень | Обозначение | Контекст | Действие |
|---------|-------------|----------|----------|
| Critical | [C] | UI, продакшн-код | Блокирует merge |
| Warning | [W] | Документация, README | Предупреждение в review (см. MARKDOWN_STANDARD) |
| Info | [I] | Внутренние заметки, прототипы | Рекомендация |

### Применение уровней:

| Контекст | Уровень | Обоснование |
|----------|---------|-------------|
| UI компоненты | [C] Critical | Прямое влияние на пользователя |
| API ответы, ошибки | [C] Critical | Отображается в интерфейсе |
| Продакшн-код | [C] Critical | Может попасть в UI |
| Документация проекта | [W] Warning | См. MARKDOWN_STANDARD |
| README файлы | [W] Warning | См. MARKDOWN_STANDARD |
| Внутренние заметки | [I] Info | Только разработчики |
| Прототипы / MVP | [I] Info | Временный код |
| Логи, debug | [I] Info | Не видны пользователю |

---

## 4. Что запрещено

### 4.1. Категории запрещённых символов

| Категория | Примеры | Уровень |
|-----------|---------|---------|
| Эмодзи | любые пиктограммы: эмоции, объекты, UI-символы | [C] |
| Unicode-иконки | символы статусов, действий, уведомлений | [C] |
| Декоративные символы | псевдографика, маркеры, выделения | [W] |

### 4.2. Область действия по слоям

| Слой | Critical [C] | Info [I] |
|------|--------------|----------|
| Интерфейс (UI) | кнопки, меню, таблицы, уведомления | - |
| API | ответы, ошибки, статусы | - |
| Контент | тексты в продукте | черновики |
| Код | UI-строки, сообщения | debug-код |
| Логирование | - | console.log, trace |

---

## 5. Причины ограничений

| Проблема | Описание |
|----------|----------|
| Неконсистентность рендера | Unicode отображается по-разному на разных ОС, браузерах, устройствах |
| Отсутствие контроля | Невозможно централизованно менять стиль, управлять темами |
| Отсутствие масштабируемости | Нет управления размером, нет адаптивности |
| Нарушение профессионального стандарта | Снижает доверие, ломает визуальную иерархию |

---

## 6. Разрешённые символы

### 6.1. Базовый набор

| Категория | Диапазон | Примеры |
|-----------|----------|---------|
| ASCII буквы | a-z, A-Z | text, TEXT |
| Кириллица | а-я, А-Я | текст, ТЕКСТ |
| Цифры | 0-9 | 123 |
| Пунктуация | . , ; : ! ? - _ | стандартная |
| Пробелы | space, tab, newline | форматирование |

### 6.2. Whitelist для диаграмм (только в коде [I])

Для технических диаграмм в коде разрешены:

| Символ | Применение |
|--------|------------|
| -> | стрелка вправо |
| <- | стрелка влево |
| => | импликация |
| <= | обратная импликация |
| \| | вертикальная линия |
| + | соединение линий |
| - | горизонтальная линия |
| v | стрелка вниз |
| ^ | стрелка вверх |
| > | указатель |
| < | обратный указатель |

### 6.3. Оформление кода в комментариях и документации

При оформлении кода в комментариях и встроенной документации:

| Элемент | Оформление |
|---------|------------|
| Inline код | `` `код` `` |
| Блок кода | `` ```язык `` |

**Правила:**

- Указывайте язык для блоков кода (подсветка синтаксиса)
- Не используйте HTML-теги для окраски кода
- Цвет — ответственность IDE/рендерера

### 6.4. Пример разрешённой диаграммы (уровень [I])

```
+-------------------+
|    Component A    |
+---------+---------+
          |
          v
+-------------------+
|    Component B    |
+---------+---------+
          |
          +-----> Component C
```

---

## 7. Стандарт иконок

### 7.1. Базовое правило

Любой визуальный символ в UI = **только SVG**

### 7.2. Требования к SVG

- быть частью Design System
- использовать design tokens
- поддерживать theming
- быть оптимизированы (SVGO)
- иметь единый stroke/fill стиль

### 7.3. Библиотеки иконок

| Библиотека | Статус | Применение |
|------------|--------|------------|
| Lucide | Основная | Все иконки проекта |
| Бренд-логотипы | Обязательные | Технологии, интеграции |

### 7.4. Бренд-логотипы

При упоминании технологий использовать официальные SVG:

| Технология | Требование |
|------------|------------|
| Next.js | Официальный SVG логотип |
| TypeScript | Официальный SVG логотип |
| Tailwind CSS | Официальный SVG логотип |
| Prisma ORM | Официальный SVG логотип |

---

## 8. AI-промпты

### 8.1. Корректная формулировка

```
Output must contain only:
- ASCII characters (a-z, A-Z, 0-9, standard punctuation)
- Cyrillic characters (а-я, А-Я)
- Whitelisted diagram symbols (for [I] level): -> <- => <= | + - v ^ > <
```

### 8.2. Очистка документа перед анализом

```javascript
// Удаление эмодзи и Unicode-графики
text.replace(/[\u{1F000}-\u{1FFFF}]|[\u{2600}-\u{27BF}]|[\u{FE00}-\u{FEFF}]|[\u{1F900}-\u{1F9FF}]|[\u{2702}-\u{27B0}]/gu, '')
```

### 8.3. Финальная санитизация

```javascript
// Для [C] уровня (код/UI) - только ASCII + кириллица (типографика строго запрещена)
text.replace(/[^\x20-\x7E\u0400-\u04FF]/g, '')

// Для [I] уровня - с whitelist для диаграмм
// Примечание: 'v' удалена из явного перечисления, так как входит в базовый диапазон ASCII \x20-\x7E
text.replace(/[^\x20-\x7E\u0400-\u04FF\-\>\<\=\|\+\^]/g, '')

// ВНИМАНИЕ: Уровень [W] (документация) регулируется MARKDOWN_STANDARD v2.1.
// Там типографские символы (—, –, °, ©) РАЗРЕШЕНЫ в обычном тексте, поэтому данная жесткая санитизация к .md файлам не применяется.
```

---

## 9. Fallback-стратегия

### 9.1. Когда SVG недоступен

| Ситуация | Решение |
|----------|---------|
| Ошибка загрузки SVG | Текстовая альтернатива (hidden, aria-label) |
| Email-клиенты | Текст + стилизованный span |
| Терминал / CLI | Текст + ANSI-цвета |
| Plain text | Только текст |

### 9.2. Реализация fallback

```html
<!-- SVG с fallback -->
<span class="icon">
  <svg aria-hidden="true"><!-- icon --></svg>
  <span class="icon-fallback">Save</span>
</span>
```

```css
.icon-fallback {
  display: none;
}
.icon svg:not(:loaded) + .icon-fallback {
  display: inline;
}
```

---

## 10. Контроль и enforcement

### 10.1. Linting

Файл: `eslint-rules/no-unicode-policy.js`

```javascript
module.exports = {
  meta: {
    type: 'problem',
    docs: { description: 'Enforce No-Unicode Policy' }
  },
  create(context) {
    const emojiPattern = /[\u{1F000}-\u{1FFFF}]/u;
    const severity = {
      '[C]': 'error',  // UI, production code
      '[I]': 'off'     // Internal, prototypes
    };

    return {
      Literal(node) {
        if (emojiPattern.test(node.value)) {
          context.report({
            node,
            message: 'Unicode graphics prohibited. Use SVG instead.'
          });
        }
      }
    };
  }
};
```

### 10.2. Code Review

| Уровень | Действие |
|---------|----------|
| [C] violation | PR отклоняется |
| [I] violation | Рекомендация (опционально) |

### 10.3. Design Review

- соответствие icon system
- использование бренд-логотипов
- наличие fallback

---

## 11. Исключения

### 11.1. Безусловно разрешены

| Категория | Примеры |
|-----------|---------|
| Буквы | a-z, A-Z, а-я, А-Я |
| Цифры | 0-9 |
| Пунктуация | . , ; : ! ? - _ ( ) [ ] { } |
| Whitelist символы [I] | -> <- => <= \| + - v ^ > < |

### 11.2. Исключения по согласованию

| Ситуация | Требование |
|----------|------------|
| Внешние требования | Email-рассылки с эмодзи - согласование с маркетингом |
| Локализация | Языки с не-ASCII символами (китайский, арабский) |
| Accessibility | Unicode-символы для screen readers |

### 11.3. Процесс согласования

1. Создать issue с обоснованием
2. Получить approval от Tech Lead
3. Документировать исключение в коде
4. Добавить в whitelist при необходимости

---

## 12. Применение по типам проектов

| Тип проекта | Уровень применения |
|-------------|-------------------|
| Enterprise | Полный [C] везде |
| B2B SaaS | [C] в UI, [W] в документации (MARKDOWN_STANDARD) |
| B2C продукт | [C] в UI, [W] в документации (MARKDOWN_STANDARD) |
| MVP / Прототип | [I] везде |
| Внутренний инструмент | [I] в коде, [W] в README (MARKDOWN_STANDARD) |
| Open Source | [C] в UI, [W] в документации (MARKDOWN_STANDARD) |

---

## 13. Чек-лист соответствия

### Перед merge (код [C]):

- [ ] Нет эмодзи в UI-компонентах
- [ ] Нет Unicode-иконок в продакшн-коде
- [ ] Иконки реализованы через SVG
- [ ] Бренд-логотипы - официальные SVG
- [ ] Есть fallback для критичных иконок
- [ ] AI-промпты используют корректную формулировку

### Для документации [W]:

- [ ] См. MARKDOWN_STANDARD v2.1

---

## 14. Формат подписи стека

- Размещение: правый нижний угол (только для корневых `README.md` и `CHANGELOG.md`)
- Формат: `Built with: Next.js 16 + TypeScript + Tailwind CSS`
- Разрешено: латиница, кириллица, цифры, знаки + и :
- Запрещено: эмодзи, Unicode-графика

---

## 15. История версий

| Версия | Дата | Изменения |
|--------|------|-----------|
| 1.0 | 2024-Q4 | Первоначальная версия, абсолютный запрет |
| 2.0 | 2025-01 | Уровневый подход, whitelist, fallback-стратегия, связь с MARKDOWN_STANDARD, правила оформления кода |
| 2.1 | 2025-01 | Синхронизация с MARKDOWN_STANDARD v2.1 (допуск типографики в тексте для [W], исправление regex для диаграмм, уточнение подписи стека) |

---

**Документ соответствует стандарту No-Unicode Policy v2.1**

---
Built with: Next.js 16 + TypeScript + Tailwind CSS
```

---
---

### 📄 Файл 2: README_TEMPLATE.md
*(Что изменилось: в чеклисте и примерах внизу документа длинное тире `—` теперь разрешено в тексте списков, но явно запрещено в заголовках).*

```markdown
# README_TEMPLATE.md

This template defines the mandatory structure for all project README files.

## Mandatory Sections

Every README.md must contain the following sections in order:

| # | Section | Required | Description |
|---|---------|----------|-------------|
| 1 | Title + Description | Yes | Project name and brief description |
| 2 | Badges | Optional | Technology badges (SVG only) |
| 3 | Features | Yes | Key capabilities |
| 4 | Tech Stack | Yes | Technologies used |
| 5 | Getting Started | Yes | Installation and run instructions |
| 6 | Configuration | Optional | Environment variables, settings |
| 7 | Project Structure | Optional | Directory layout |
| 8 | API Reference | Optional | Endpoints, methods |
| 9 | Scripts | Optional | NPM/Bun commands |
| 10 | Development Rules | Optional | Code style, technology constraints |
| 11 | Agent Rules | Conditional | Required if `AGENT_RULES.md` exists in project root |
| 12 | Stack Signature | Yes | Mandatory footer |

## Template

```markdown
# Project Name

Brief description of the project (1-2 sentences).

![Badge](https://img.shields.io/badge/Tech-Version-color?style=flat-square)

## Features

- Feature 1 - description
- Feature 2 - description
- Feature 3 - description

## Tech Stack

- **Framework** - description
- **Language** - description
- **Database** - description
- **Other** - description

## Getting Started

### Prerequisites

- Node.js 18+ or Bun
- Other requirements

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
|--------|-------------|
| `bun run dev` | Development server |
| `bun run build` | Production build |
| `bun run lint` | Lint check |

## Project Structure

- `src/app/` - Application routes
- `src/components/` - UI components
- `src/lib/` - Utilities
- `prisma/` - Database schema

## Configuration

### Environment Variables

See `.env.example`:

```env
DATABASE_URL="file:./db/dev.db"
```

## Development Rules

### Required Technologies
- Technology 1
- Technology 2

### Code Style
- Rule 1
- Rule 2

## Agent Rules (Mandatory)

Any AI agent working on this project MUST read and follow `AGENT_RULES.md`
before performing any operations.

See `AGENT_RULES.md` for full details.
See `instructions/` for complete rule descriptions.
See `skills/` for automated tooling.

---
Built with: Next.js 16 + TypeScript + Tailwind CSS
```

## Checklist

Before submitting, verify:

- [ ] No emoji in title or sections
- [ ] No Unicode arrows (`->`, `=>`)
- [ ] No em dash in headings or code (use hyphen `-`)
- [ ] No pseudo-graphics for tree structures
- [ ] Stack Signature present at end
- [ ] All mandatory sections included
- [ ] Agent Rules section present if AGENT_RULES.md exists
- [ ] Code blocks have language specified

## Example Compliance

### Correct
```markdown
## Features
- Fast build - uses Turbopack
- Type safe — full TypeScript
```

### Incorrect
```markdown
## Features
- Fast build -> uses Turbopack
## Features — Core (em dash in heading is prohibited)
```

---
Built with: Next.js 16 + TypeScript + Tailwind CSS
```