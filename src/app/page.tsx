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
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Sun,
  Moon,
  Target,
  Users,
  TrendingUp,
  Brain,
  Shield,
  Zap,
  Award,
  Star,
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
  Briefcase,
  BarChart3,
  Globe,
  Layers,
  Lightbulb,
  Rocket,
  Handshake,
  Building2,
  GraduationCap,
  MapPin,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Eye,
  Navigation,
  Cpu,
  Scale,
  Crown,
} from "lucide-react";

/* ───────────────────────── DATA ───────────────────────── */

const CANDIDATE = {
  name: "Граур Станислав Сергеевич",
  initials: "ГСС",
  experience: "20+ лет",
  targetRole: "Коммерческий директор / Руководитель отдела продаж",
  location: "Одинцово (МО)",
  education: "МЭА, Экономика и управление",
};

const MBTI = {
  type: "ENTJ",
  title: "Командир",
  dimensions: [
    { left: "E (Экстраверсия)", leftPct: 75, right: "I (Интроверсия)", rightPct: 25, desc: "Лидерство в командах, клиентские взаимодействия" },
    { left: "N (Интуиция)", leftPct: 70, right: "S (Сенсорика)", rightPct: 30, desc: "Стратегическое видение, запуск продуктов" },
    { left: "T (Мышление)", leftPct: 65, right: "F (Чувства)", rightPct: 35, desc: "Аналитический подход, KPI, data-driven" },
    { left: "J (Суждение)", leftPct: 80, right: "P (Восприятие)", rightPct: 20, desc: "Системность, процессный подход" },
  ],
  leadershipStyle: "Трансформационный + Стратегический",
  motivators: ["Достижение", "Улучшение систем", "Трансформация", "Лидерство"],
};

const COMPETENCIES = [
  { title: "Системное управление продажами", icon: Layers, color: "text-emerald-600 dark:text-emerald-400" },
  { title: "Трансформация кризисных подразделений", icon: Zap, color: "text-amber-600 dark:text-amber-400" },
  { title: "Запуск продуктов и вывод на рынок", icon: Rocket, color: "text-emerald-600 dark:text-emerald-400" },
  { title: "Построение и масштабирование команд", icon: Users, color: "text-amber-600 dark:text-amber-400" },
  { title: "Стратегическое планирование и аналитика", icon: Brain, color: "text-emerald-600 dark:text-emerald-400" },
];

const UVP =
  "Специалист по созданию и оптимизации коммерческих систем, способный трансформировать кризисные подразделения и выводить новые продукты на рынок с измеримыми результатами в кратчайшие сроки";

const EFFECTIVE_ROLES = [
  { role: "Коммерческий директор (CCO)", icon: Crown },
  { role: "Руководитель отдела продаж", icon: Users },
  { role: "Бизнес-трансформатор", icon: Zap },
  { role: "Руководитель проектов", icon: Target },
  { role: "Стратег по развитию продаж", icon: Navigation },
];

const GROWTH_ROLES = [
  { role: "CEO / Генеральный директор", icon: Crown },
  { role: "Руководитель бизнес-направления", icon: Building2 },
  { role: "Консультант по трансформации продаж", icon: Lightbulb },
  { role: "Руководитель по развитию бизнеса", icon: TrendingUp },
  { role: "Предприниматель", icon: Rocket },
];

const AVOID_ROLES = [
  { role: "HR-директор", reason: "Не профильный опыт в управлении персоналом" },
  { role: "Финансовый директор", reason: "Финансы не являются ключевой компетенцией" },
  { role: "Руководитель IT-направления", reason: "Нет технической экспертизы" },
  { role: "Руководитель административного блока", reason: "Не соответствует лидерскому стилю ENTJ" },
  { role: "Специалист узкого профиля", reason: "Профиль — системное управление, а не узкая специализация" },
];

const INDUSTRIES = [
  { name: "Финтех / Финансовые услуги", match: 95, icon: Scale, color: "bg-emerald-500" },
  { name: "IT / SaaS", match: 90, icon: Cpu, color: "bg-emerald-600" },
  { name: "Ритейл / Еда (FMCG)", match: 85, icon: Building2, color: "bg-amber-500" },
  { name: "Образовательные услуги", match: 80, icon: GraduationCap, color: "bg-emerald-400" },
  { name: "Консалтинг / Бизнес-услуги", match: 78, icon: Handshake, color: "bg-amber-600" },
];

const SCORES = [
  { name: "Стратегическое мышление", value: 9 },
  { name: "Операционное управление", value: 10 },
  { name: "Перезапуск / трансформация", value: 9 },
  { name: "Аналитические навыки", value: 8 },
  { name: "Лидерство и работа с командой", value: 9 },
  { name: "Коммуникация и переговоры", value: 8 },
  { name: "Адаптивность", value: 10 },
  { name: "Предпринимательское мышление", value: 9 },
  { name: "Digital / технологическая грамотность", value: 8 },
  { name: "Масштабируемость", value: 9 },
];

const ACHIEVEMENTS = [
  { value: "5,2 млрд руб.", label: "Годовой оборот", company: "Мясницкий ряд", icon: BarChart3 },
  { value: "1835", label: "Активных клиентов, 95% охвата рынка", company: "Мясницкий ряд", icon: Globe },
  { value: "40 чел.", label: "Команда выросла с 5 до 40 человек", company: "Мясницкий ряд", icon: Users },
  { value: "-60%", label: "Снижение текучести кадров (грейды)", company: "Мясницкий ряд", icon: TrendingUp },
  { value: "4,2 млн руб.", label: "Рост выручки отдела", company: "ЭкспертБаланс", icon: BarChart3 },
  { value: "+35%", label: "Продуктивность менеджеров", company: "ЭкспертБаланс", icon: TrendingUp },
  { value: "-25%", label: "Снижение операционных затрат", company: "ЭкспертБаланс", icon: Target },
  { value: "1,4 → 3,8 млн", label: "Рост выручки за 7 месяцев", company: "ИП Петров М.В.", icon: ArrowUpRight },
  { value: "27% → 62%", label: "Рост конверсии продаж", company: "ИП Петров М.В.", icon: Target },
  { value: "20", label: "Крупных B2B-клиентов привлечено", company: "Флумли", icon: Handshake },
  { value: "+30%", label: "Рост выручки у клиентов сервиса", company: "Флумли", icon: TrendingUp },
  { value: "+40%", label: "Прирост выручки за 1-й год", company: "Мастерфуд", icon: ArrowUpRight },
  { value: "35 партнёров", label: "Дилерская сеть создана с нуля", company: "LOBI-M", icon: Globe },
  { value: "+750%", label: "Рост товарооборота", company: "LOBI-M", icon: Rocket },
];

const RECOMMENDATIONS = {
  positioning: "Трансформационный коммерческий лидер",
  targetCompanies: [
    "Компании, проходящие трансформацию",
    "Кризисные отделы продаж",
    "Запуск новых продуктов",
    "Средний бизнес (500 млн — 5 млрд руб.)",
  ],
  redFlags: [
    { flag: "Частая смена работы", mitigation: "Объяснить завершением проектов" },
    { flag: "Параллельная работа", mitigation: "Разные масштабы и области" },
    { flag: "Нет корпоративного опыта", mitigation: "Подчеркнуть универсальность" },
  ],
};

/* ─────────────────────── SMALL COMPONENTS ─────────────────────── */

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    requestAnimationFrame(() => setMounted(true));
  }, []);
  if (!mounted) return <Button variant="ghost" size="icon" className="size-9"><Sun className="size-4" /></Button>;
  return (
    <Button
      variant="ghost"
      size="icon"
      className="size-9"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      aria-label="Переключить тему"
    >
      {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  );
}

function AnimatedCounter({ target, duration = 1200 }: { target: number; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const startTime = performance.now();
    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      start = Math.round(eased * target);
      setCount(start);
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [inView, target, duration]);

  return <span ref={ref}>{count}</span>;
}

function SectionTitle({ children, id }: { children: React.ReactNode; id?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      id={id}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.5 }}
      className="mb-6"
    >
      <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{children}</h2>
      <Separator className="mt-3 h-0.5 bg-emerald-200 dark:bg-emerald-800 w-24" />
    </motion.div>
  );
}

function FadeInCard({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
      transition={{ duration: 0.5, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─────────────────────── RADAR CHART (SVG) ─────────────────────── */

function RadarChart({ scores }: { scores: { name: string; value: number }[] }) {
  const ref = useRef<SVGSVGElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const size = 340;
  const center = size / 2;
  const maxRadius = 130;
  const levels = 5;
  const n = scores.length;
  const angleStep = (2 * Math.PI) / n;
  const startAngle = -Math.PI / 2;

  const getPoint = (index: number, value: number) => {
    const angle = startAngle + index * angleStep;
    const r = (value / 10) * maxRadius;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  };

  const gridPaths = Array.from({ length: levels }, (_, i) => {
    const r = ((i + 1) / levels) * maxRadius;
    const points = Array.from({ length: n }, (_, j) => {
      const angle = startAngle + j * angleStep;
      return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
    }).join(" ");
    return points;
  });

  const dataPoints = scores.map((s, i) => getPoint(i, s.value));
  const dataPath = dataPoints.map((p) => `${p.x},${p.y}`).join(" ");

  const labelPositions = scores.map((_, i) => {
    const angle = startAngle + i * angleStep;
    const labelR = maxRadius + 40;
    return {
      x: center + labelR * Math.cos(angle),
      y: center + labelR * Math.sin(angle),
    };
  });

  return (
    <div className="flex justify-center">
      <svg
        ref={ref}
        viewBox={`0 0 ${size} ${size}`}
        className="w-full max-w-[340px] animate-radar-draw"
        style={{ opacity: inView ? 1 : 0 }}
      >
        {/* Grid */}
        {gridPaths.map((points, i) => (
          <polygon
            key={i}
            points={points}
            fill="none"
            stroke="currentColor"
            strokeWidth="0.5"
            className="text-emerald-200 dark:text-emerald-800"
          />
        ))}
        {/* Axis lines */}
        {scores.map((_, i) => {
          const angle = startAngle + i * angleStep;
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={center + maxRadius * Math.cos(angle)}
              y2={center + maxRadius * Math.sin(angle)}
              stroke="currentColor"
              strokeWidth="0.5"
              className="text-emerald-200 dark:text-emerald-800"
            />
          );
        })}
        {/* Data polygon */}
        <motion.polygon
          points={dataPath}
          fill="rgba(6,95,70,0.15)"
          stroke="#065f46"
          strokeWidth="2"
          className="dark:fill-emerald-900/30 dark:stroke-emerald-400"
          initial={{ opacity: 0, scale: 0.7 }}
          animate={inView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.7 }}
          transition={{ duration: 1, ease: "easeOut" }}
          style={{ transformOrigin: `${center}px ${center}px` }}
        />
        {/* Data points */}
        {dataPoints.map((p, i) => (
          <motion.circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="4"
            fill="#065f46"
            className="dark:fill-emerald-400"
            initial={{ opacity: 0, scale: 0 }}
            animate={inView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0 }}
            transition={{ duration: 0.4, delay: 0.3 + i * 0.05 }}
          />
        ))}
        {/* Labels */}
        {scores.map((s, i) => (
          <text
            key={i}
            x={labelPositions[i].x}
            y={labelPositions[i].y}
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-foreground text-[9px] font-medium"
          >
            {s.value}
          </text>
        ))}
        {/* Label names (outside the chart) */}
        {scores.map((s, i) => {
          const angle = startAngle + i * angleStep;
          const nameR = maxRadius + 56;
          const x = center + nameR * Math.cos(angle);
          const y = center + nameR * Math.sin(angle);
          return (
            <text
              key={`label-${i}`}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-muted-foreground text-[7.5px]"
            >
              {s.name.length > 20 ? s.name.slice(0, 20) + "…" : s.name}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

/* ─────────────────────── MAIN PAGE ─────────────────────── */

export default function CareerDashboard() {
  const [activeSection, setActiveSection] = useState<string>("hero");
  const sectionsRef = useRef<Record<string, HTMLElement | null>>({});

  const registerSection = useCallback((id: string) => (el: HTMLElement | null) => {
    sectionsRef.current[id] = el;
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY + 120;
      let current = "hero";
      const sectionIds = Object.keys(sectionsRef.current).sort(
        (a, b) => (sectionsRef.current[a]?.offsetTop ?? 0) - (sectionsRef.current[b]?.offsetTop ?? 0)
      );
      for (const id of sectionIds) {
        const el = sectionsRef.current[id];
        if (el && el.offsetTop <= scrollY) {
          current = id;
        }
      }
      setActiveSection(current);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const navItems = [
    { id: "hero", label: "Обзор" },
    { id: "psychotype", label: "Психотип" },
    { id: "scores", label: "Оценки" },
    { id: "competencies", label: "Компетенции" },
    { id: "roles", label: "Роли" },
    { id: "industries", label: "Отрасли" },
    { id: "achievements", label: "Достижения" },
    { id: "recommendations", label: "Рекомендации" },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* ─── STICKY TOP NAV ─── */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="hidden lg:flex items-center gap-1 overflow-x-auto custom-scrollbar">
              {navItems.map((item) => (
                <Button
                  key={item.id}
                  variant={activeSection === item.id ? "default" : "ghost"}
                  size="sm"
                  className="text-xs shrink-0"
                  onClick={() => scrollTo(item.id)}
                >
                  {item.label}
                </Button>
              ))}
            </div>
            <div className="flex lg:hidden items-center gap-1 overflow-x-auto custom-scrollbar max-w-[60vw]">
              {navItems.map((item) => (
                <Button
                  key={item.id}
                  variant={activeSection === item.id ? "default" : "ghost"}
                  size="sm"
                  className="text-xs shrink-0"
                  onClick={() => scrollTo(item.id)}
                >
                  {item.label}
                </Button>
              ))}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Badge variant="outline" className="hidden sm:inline-flex text-emerald-700 border-emerald-300 dark:text-emerald-400 dark:border-emerald-700">
                ENTJ
              </Badge>
              <ThemeToggle />
            </div>
          </div>
        </nav>
      </header>

      {/* ─── MAIN CONTENT ─── */}
      <main className="flex-1 mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-8 space-y-16">

        {/* ═══════ HERO SECTION ═══════ */}
        <section ref={registerSection("hero")} id="hero">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-900 dark:from-emerald-900 dark:via-emerald-950 dark:to-emerald-900 p-6 sm:p-10">
            {/* Decorative circles */}
            <div className="absolute top-0 right-0 w-72 h-72 bg-emerald-500/20 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-500/10 rounded-full translate-y-1/2 -translate-x-1/2" />

            <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-10">
              {/* Avatar */}
              <div className="shrink-0">
                <Avatar className="size-24 sm:size-32 ring-4 ring-white/20">
                  <AvatarFallback className="text-2xl sm:text-3xl font-bold bg-white/20 text-white">
                    {CANDIDATE.initials}
                  </AvatarFallback>
                </Avatar>
              </div>

              {/* Info */}
              <div className="flex-1 text-center md:text-left space-y-4">
                <div>
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight">
                    {CANDIDATE.name}
                  </h1>
                  <p className="mt-2 text-emerald-100 text-lg sm:text-xl">
                    {CANDIDATE.targetRole}
                  </p>
                </div>

                {/* Quick badges */}
                <div className="flex flex-wrap justify-center md:justify-start gap-2">
                  <Badge className="bg-white/15 text-white border-white/20 hover:bg-white/25 backdrop-blur-sm">
                    <Clock className="size-3 mr-1" />
                    {CANDIDATE.experience}
                  </Badge>
                  <Badge className="bg-white/15 text-white border-white/20 hover:bg-white/25 backdrop-blur-sm">
                    <MapPin className="size-3 mr-1" />
                    {CANDIDATE.location}
                  </Badge>
                  <Badge className="bg-white/15 text-white border-white/20 hover:bg-white/25 backdrop-blur-sm">
                    <GraduationCap className="size-3 mr-1" />
                    {CANDIDATE.education}
                  </Badge>
                </div>

                {/* UVP Quote */}
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                  <p className="text-white/90 text-sm sm:text-base italic leading-relaxed">
                    &ldquo;{UVP}&rdquo;
                  </p>
                </div>
              </div>

              {/* Stats sidebar */}
              <div className="shrink-0 grid grid-cols-2 gap-3 text-center">
                {[
                  { val: 10, label: "из 10" },
                  { val: 89, label: "средняя оценка" },
                  { val: 5, label: "ключевых отраслей" },
                  { val: 20, label: "лет опыта" },
                ].map((stat, i) => (
                  <div
                    key={i}
                    className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/10 min-w-[80px] stat-pulse"
                    style={{ animationDelay: `${i * 0.3}s` }}
                  >
                    <div className="text-2xl sm:text-3xl font-bold text-white">
                      {i === 1 ? (
                        <AnimatedCounter target={stat.val} />
                      ) : (
                        stat.val
                      )}
                    </div>
                    <div className="text-xs text-emerald-200 mt-0.5">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ═══════ PSYCHOTYPE SECTION ═══════ */}
        <section ref={registerSection("psychotype")} id="psychotype">
          <SectionTitle>Психотип — MBTI</SectionTitle>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* MBTI Type Card */}
            <FadeInCard>
              <Card className="h-full border-2 border-emerald-100 dark:border-emerald-900">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="size-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center">
                      <Brain className="size-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl gradient-text">
                        {MBTI.type} — {MBTI.title}
                      </CardTitle>
                      <CardDescription>Тип личности по Майерс-Бриггс</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-5">
                  {/* MBTI Dimension Bars */}
                  {MBTI.dimensions.map((dim, i) => (
                    <div key={i} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                          {dim.left}
                        </span>
                        <span className="text-muted-foreground text-xs">{dim.right}</span>
                      </div>
                      <div className="relative h-3 rounded-full bg-muted overflow-hidden">
                        <div
                          className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 dark:from-emerald-600 dark:to-emerald-400 score-bar-fill"
                          style={{ "--score-width": `${dim.leftPct}%` } as React.CSSProperties}
                        />
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium">{dim.leftPct}%</span>
                        <Tooltip>
                          <TooltipTrigger>
                            <span className="text-muted-foreground cursor-help">
                              <Eye className="size-3 inline" /> Описание
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>{dim.desc}</TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                  ))}

                  <Separator className="my-4" />

                  {/* Leadership & Motivators */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">Стиль лидерства</p>
                      <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 text-sm px-3 py-1">
                        <Shield className="size-3.5 mr-1" />
                        {MBTI.leadershipStyle}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">Мотиваторы</p>
                      <div className="flex flex-wrap gap-1.5">
                        {MBTI.motivators.map((m, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            <Star className="size-3 mr-0.5 text-amber-500" />
                            {m}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </FadeInCard>

            {/* MBTI Detailed Description Card */}
            <FadeInCard delay={0.15}>
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="size-5 text-amber-500" />
                    Развёрнутая характеристика
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm leading-relaxed">
                  <p>
                    <span className="font-semibold text-emerald-700 dark:text-emerald-400">E — Экстраверсия (75%):</span>{" "}
                    Проявляет ярко выраженные лидерские качества в командной работе. Энергозаряженный в клиентских
                    взаимодействиях и презентациях. Получает мотивацию от активного общения и управления людьми.
                  </p>
                  <p>
                    <span className="font-semibold text-emerald-700 dark:text-emerald-400">N — Интуиция (70%):</span>{" "}
                    Обладает сильным стратегическим видением, способность видеть картину целиком и предвидеть
                    рыночные тренды. Идеален для запуска новых продуктов и концептуального планирования.
                  </p>
                  <p>
                    <span className="font-semibold text-emerald-700 dark:text-emerald-400">T — Мышление (65%):</span>{" "}
                    Принимает решения на основе данных и аналитики. KPI-ориентированный подход. Способен
                    объективно оценивать ситуацию без эмоционального вовлечения.
                  </p>
                  <p>
                    <span className="font-semibold text-emerald-700 dark:text-emerald-400">J — Суждение (80%):</span>{" "}
                    Высокий уровень системности и процессного мышления. Предпочитает чёткие планы,
                    структурированные подходы и измеримые результаты.
                  </p>
                  <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                    <p className="text-amber-800 dark:text-amber-200 font-medium">
                      <Lightbulb className="size-4 inline mr-1" />
                      ENTJ — один из лучших типов для позиций коммерческого директора.
                      Сочетание стратегического видения, операционной жёсткости и лидерского драйва
                      делает его естественным трансформатором бизнеса.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </FadeInCard>
          </div>
        </section>

        {/* ═══════ SCORES SECTION ═══════ */}
        <section ref={registerSection("scores")} id="scores">
          <SectionTitle>Количественные оценки</SectionTitle>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Radar Chart */}
            <FadeInCard>
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="size-5 text-emerald-600" />
                    Радар компетенций
                  </CardTitle>
                  <CardDescription>10 ключевых показателей из 10 возможных</CardDescription>
                </CardHeader>
                <CardContent>
                  <RadarChart scores={SCORES} />
                </CardContent>
              </Card>
            </FadeInCard>

            {/* Score Bars */}
            <FadeInCard delay={0.15}>
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="size-5 text-amber-500" />
                    Детальная оценка
                  </CardTitle>
                  <CardDescription>Средний балл: {(SCORES.reduce((a, s) => a + s.value, 0) / SCORES.length).toFixed(1)} / 10</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {SCORES.map((score, i) => (
                    <div key={i} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium truncate max-w-[70%]">{score.name}</span>
                        <span className="font-bold text-emerald-700 dark:text-emerald-400 shrink-0">
                          {score.value}/10
                        </span>
                      </div>
                      <div className="relative h-2.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className={`absolute left-0 top-0 h-full rounded-full score-bar-fill ${
                            score.value === 10
                              ? "bg-gradient-to-r from-amber-400 to-amber-500 dark:from-amber-500 dark:to-amber-400"
                              : score.value >= 9
                              ? "bg-gradient-to-r from-emerald-400 to-emerald-600 dark:from-emerald-500 dark:to-emerald-400"
                              : "bg-gradient-to-r from-emerald-300 to-emerald-500 dark:from-emerald-600 dark:to-emerald-500"
                          }`}
                          style={
                            { "--score-width": `${score.value * 10}%` } as React.CSSProperties
                          }
                        />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </FadeInCard>
          </div>
        </section>

        {/* ═══════ COMPETENCIES SECTION ═══════ */}
        <section ref={registerSection("competencies")} id="competencies">
          <SectionTitle>Ключевые компетенции</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {COMPETENCIES.map((comp, i) => (
              <FadeInCard key={i} delay={i * 0.08}>
                <Card className="h-full hover:shadow-lg hover:border-emerald-200 dark:hover:border-emerald-800 transition-all duration-300 hover:-translate-y-1 cursor-default">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="shrink-0 size-12 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900 flex items-center justify-center">
                        <comp.icon className={`size-6 ${comp.color}`} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm">{comp.title}</h3>
                        <Badge variant="secondary" className="mt-2 text-[10px]">
                          <Zap className="size-2.5 mr-0.5 text-amber-500" />
                          Суперспособность
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </FadeInCard>
            ))}
            {/* Summary card */}
            <FadeInCard delay={0.4}>
              <Card className="h-full bg-gradient-to-br from-emerald-50 to-amber-50 dark:from-emerald-950/50 dark:to-amber-950/30 border-emerald-200 dark:border-emerald-800">
                <CardContent className="pt-6 flex flex-col items-center justify-center text-center h-full">
                  <Award className="size-10 text-emerald-600 dark:text-emerald-400 mb-3" />
                  <p className="text-sm font-medium leading-relaxed text-muted-foreground">
                    Комбинация <span className="text-emerald-700 dark:text-emerald-400 font-semibold">5 суперспособностей</span> создаёт уникальный профиль
                    для позиций коммерческого лидера
                  </p>
                </CardContent>
              </Card>
            </FadeInCard>
          </div>
        </section>

        {/* ═══════ ROLES SECTION ═══════ */}
        <section ref={registerSection("roles")} id="roles">
          <SectionTitle>Рекомендуемые роли</SectionTitle>
          <Tabs defaultValue="effective" className="w-full">
            <TabsList className="w-full sm:w-auto grid grid-cols-3">
              <TabsTrigger value="effective" className="text-xs sm:text-sm">
                <CheckCircle2 className="size-3.5 mr-1" />
                Эффективные
              </TabsTrigger>
              <TabsTrigger value="growth" className="text-xs sm:text-sm">
                <TrendingUp className="size-3.5 mr-1" />
                Потенциал роста
              </TabsTrigger>
              <TabsTrigger value="avoid" className="text-xs sm:text-sm">
                <XCircle className="size-3.5 mr-1" />
                Избегать
              </TabsTrigger>
            </TabsList>

            <TabsContent value="effective" className="mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {EFFECTIVE_ROLES.map((role, i) => (
                  <FadeInCard key={i} delay={i * 0.06}>
                    <Card className="h-full hover:shadow-lg hover:border-emerald-300 dark:hover:border-emerald-700 transition-all duration-300 hover:-translate-y-1 cursor-default">
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                          <div className="shrink-0 size-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                            <role.icon className="size-5 text-emerald-600 dark:text-emerald-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <Badge className="bg-emerald-500 text-white text-[10px]">#{i + 1}</Badge>
                              <h3 className="font-semibold text-sm truncate">{role.role}</h3>
                            </div>
                          </div>
                        </div>
                        <div className="mt-3 flex items-center gap-1">
                          {[...Array(5)].map((_, s) => (
                            <Star
                              key={s}
                              className={`size-3 ${
                                s < 5 - i * 0.4
                                  ? "text-amber-400 fill-amber-400"
                                  : "text-muted"
                              }`}
                            />
                          ))}
                          <span className="text-xs text-muted-foreground ml-1">Рекомендовано</span>
                        </div>
                      </CardContent>
                    </Card>
                  </FadeInCard>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="growth" className="mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {GROWTH_ROLES.map((role, i) => (
                  <FadeInCard key={i} delay={i * 0.06}>
                    <Card className="h-full hover:shadow-lg hover:border-amber-300 dark:hover:border-amber-700 transition-all duration-300 hover:-translate-y-1 cursor-default">
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                          <div className="shrink-0 size-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                            <role.icon className="size-5 text-amber-600 dark:text-amber-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <Badge className="bg-amber-500 text-white text-[10px]">#{i + 1}</Badge>
                              <h3 className="font-semibold text-sm truncate">{role.role}</h3>
                            </div>
                          </div>
                        </div>
                        <div className="mt-3">
                          <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-300 dark:text-amber-400 dark:border-amber-700">
                            <TrendingUp className="size-2.5 mr-0.5" />
                            Потенциал развития
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </FadeInCard>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="avoid" className="mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {AVOID_ROLES.map((role, i) => (
                  <FadeInCard key={i} delay={i * 0.06}>
                    <Card className="h-full hover:shadow-lg transition-all duration-300 cursor-default">
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-3">
                          <div className="shrink-0 size-10 rounded-lg bg-red-50 dark:bg-red-950/30 flex items-center justify-center">
                            <XCircle className="size-5 text-red-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <Badge className="bg-red-500 text-white text-[10px]">#{i + 1}</Badge>
                              <h3 className="font-semibold text-sm">{role.role}</h3>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                              {role.reason}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </FadeInCard>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </section>

        {/* ═══════ INDUSTRIES SECTION ═══════ */}
        <section ref={registerSection("industries")} id="industries">
          <SectionTitle>Наиболее перспективные отрасли</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {INDUSTRIES.map((ind, i) => (
              <FadeInCard key={i} delay={i * 0.08}>
                <Card className="h-full hover:shadow-lg hover:border-emerald-300 dark:hover:border-emerald-700 transition-all duration-300 hover:-translate-y-1 cursor-default">
                  <CardContent className="pt-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`size-10 rounded-lg ${ind.color} flex items-center justify-center`}>
                          <ind.icon className="size-5 text-white" />
                        </div>
                        <h3 className="font-semibold text-sm">{ind.name}</h3>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground text-xs">Совпадение</span>
                        <span className="font-bold text-emerald-700 dark:text-emerald-400">{ind.match}%</span>
                      </div>
                      <Progress
                        value={ind.match}
                        className="h-2.5 [&>div]:bg-gradient-to-r [&>div]:from-emerald-400 [&>div]:to-emerald-600 dark:[&>div]:from-emerald-600 dark:[&>div]:to-emerald-400"
                      />
                    </div>
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, s) => (
                        <div
                          key={s}
                          className={`h-1.5 flex-1 rounded-full ${
                            s < Math.round(ind.match / 20)
                              ? ind.color
                              : "bg-muted"
                          }`}
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </FadeInCard>
            ))}
          </div>
        </section>

        {/* ═══════ ACHIEVEMENTS SECTION ═══════ */}
        <section ref={registerSection("achievements")} id="achievements">
          <SectionTitle>Ключевые достижения по компаниям</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {ACHIEVEMENTS.map((ach, i) => (
              <FadeInCard key={i} delay={i * 0.04}>
                <Card className="h-full hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-default">
                  <CardContent className="pt-6 text-center space-y-3">
                    <div className="mx-auto size-12 rounded-full bg-gradient-to-br from-emerald-100 to-amber-100 dark:from-emerald-900/50 dark:to-amber-900/30 flex items-center justify-center">
                      <ach.icon className="size-6 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold gradient-text">{ach.value}</p>
                      <p className="text-sm text-muted-foreground mt-1 leading-snug">{ach.label}</p>
                    </div>
                    <Badge variant="outline" className="text-[10px]">
                      <Briefcase className="size-2.5 mr-0.5" />
                      {ach.company}
                    </Badge>
                  </CardContent>
                </Card>
              </FadeInCard>
            ))}
          </div>
        </section>

        {/* ═══════ RECOMMENDATIONS SECTION ═══════ */}
        <section ref={registerSection("recommendations")} id="recommendations">
          <SectionTitle>Рекомендации по позиционированию</SectionTitle>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Positioning */}
            <FadeInCard>
              <Card className="h-full border-2 border-emerald-200 dark:border-emerald-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Target className="size-5 text-emerald-600" />
                    Позиционирование
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-lg p-4 border border-emerald-200 dark:border-emerald-800">
                    <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400 text-center">
                      &ldquo;{RECOMMENDATIONS.positioning}&rdquo;
                    </p>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium mb-2">Целевые компании:</p>
                    <ul className="space-y-2">
                      {RECOMMENDATIONS.targetCompanies.map((t, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <CheckCircle2 className="size-4 text-emerald-500 shrink-0 mt-0.5" />
                          {t}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </FadeInCard>

            {/* Red Flags */}
            <FadeInCard delay={0.1}>
              <Card className="h-full border-2 border-amber-200 dark:border-amber-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <AlertTriangle className="size-5 text-amber-500" />
                    Потенциальные риски
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {RECOMMENDATIONS.redFlags.map((rf, i) => (
                    <div key={i} className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <XCircle className="size-4 text-red-500 shrink-0" />
                        <span className="text-sm font-medium text-red-700 dark:text-red-400">
                          {rf.flag}
                        </span>
                      </div>
                      <div className="flex items-start gap-2 ml-6">
                        <Lightbulb className="size-3.5 text-amber-500 shrink-0 mt-0.5" />
                        <span className="text-xs text-muted-foreground leading-relaxed">
                          {rf.mitigation}
                        </span>
                      </div>
                      {i < RECOMMENDATIONS.redFlags.length - 1 && <Separator />}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </FadeInCard>

            {/* Action Items */}
            <FadeInCard delay={0.2}>
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Rocket className="size-5 text-emerald-600" />
                    План действий
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    "Сформировать резюме вокруг ключевых достижений с цифрами",
                    "Подготовить 3 кейса трансформации для собеседований",
                    "Создать портфолио результатов (каждый проект — measurable impact)",
                    "Активно нетворкингить в финтех и IT сообществах",
                    "Получить дополнительные сертификаты в области digital-продаж",
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-sm">
                      <div className="shrink-0 size-5 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center mt-0.5">
                        <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400">{i + 1}</span>
                      </div>
                      <span className="text-muted-foreground leading-relaxed">{item}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </FadeInCard>
          </div>
        </section>

      </main>

      {/* ─── FOOTER ─── */}
      <footer className="mt-auto border-t border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Briefcase className="size-4" />
              <span>Карьерный анализ — {CANDIDATE.name}</span>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <Badge variant="outline" className="text-[10px]">
                <Brain className="size-3 mr-0.5" />
                MBTI {MBTI.type}
              </Badge>
              <span>Powered by AI Analysis</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
