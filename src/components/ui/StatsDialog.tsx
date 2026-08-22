import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, BarChart3, Clock, Globe2 } from "lucide-react";
import { useGlobeSelection } from "@/hooks/useGlobeSelection";
import { getThemeColor } from "@/data/load";
import { THEMES, type ThemeKey } from "../../../data/themes";
import type { Person } from "@/data/schema";

function getThemeZh(key: string): string {
  const t = THEMES[key as ThemeKey];
  return t ? t.zh : key;
}

/* ============================================================
   地域映射：把 region_zh/region_en 归一化到大洲标签
   ============================================================ */
const REGION_RULES: Array<{ key: string; label: string; hint: string[] }> = [
  {
    key: "asia",
    label: "亚洲",
    hint: ["中国", "日本", "韩国", "印度", "伊朗", "越南", "泰国", "印尼", "菲律宾", "中亚", "西亚", "Asia", "India", "China", "Japan", "Korea", "Iran"],
  },
  {
    key: "europe",
    label: "欧洲",
    hint: ["英国", "法国", "德国", "意大利", "西班牙", "葡萄牙", "波兰", "俄国", "瑞典", "挪威", "希腊", "欧洲", "Europe", "UK", "England", "France", "Germany", "Italy", "Spain", "Russia"],
  },
  {
    key: "africa",
    label: "非洲",
    hint: ["埃及", "南非", "尼日利亚", "肯尼亚", "埃塞俄比亚", "非洲", "Africa", "Egypt", "Alexandria"],
  },
  {
    key: "americas",
    label: "美洲",
    hint: ["美国", "加拿大", "墨西哥", "巴西", "阿根廷", "智利", "美洲", "America", "USA", "Brazil", "Canada", "Mexico"],
  },
  {
    key: "oceania",
    label: "大洋洲",
    hint: ["澳大利亚", "新西兰", "大洋洲", "Australia", "New Zealand", "Oceania"],
  },
];

function normalizeRegion(person: Person): string {
  const haystack = `${person.region_zh} ${person.region_en}`;
  for (const rule of REGION_RULES) {
    if (rule.hint.some((h) => haystack.includes(h))) return rule.key;
  }
  return "other";
}

const REGION_LABEL: Record<string, string> = {
  asia: "亚洲",
  europe: "欧洲",
  africa: "非洲",
  americas: "美洲",
  oceania: "大洋洲",
  other: "其他",
};

const REGION_COLOR: Record<string, string> = {
  asia: "#F2C14E",
  europe: "#B79CFF",
  africa: "#FD79A8",
  americas: "#4ECDC4",
  oceania: "#A8E6CF",
  other: "#9AA3B2",
};

/* ============================================================
   年代分箱（用于时间轴着色）
   ============================================================ */
function eraOf(birthYear: number | undefined): { label: string; color: string } {
  if (!birthYear) return { label: "未记载", color: "#9AA3B2" };
  if (birthYear < 500) return { label: "古典", color: "#F2C14E" };
  if (birthYear < 1000) return { label: "中世纪早期", color: "#B79CFF" };
  if (birthYear < 1500) return { label: "中世纪晚期", color: "#FD79A8" };
  if (birthYear < 1800) return { label: "近代", color: "#4ECDC4" };
  if (birthYear < 1900) return { label: "近现代", color: "#A8E6CF" };
  return { label: "20 世纪后", color: "#F7B32B" };
}

/* ============================================================
   主组件
   ============================================================ */
export default function StatsDialog() {
  const [open, setOpen] = useState(false);
  const { allPeople } = useGlobeSelection();
  const total = allPeople.length;

  /* ------- (1) 议题分布统计 ------- */
  const themeStats = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of allPeople) {
      for (const t of p.themes) counts.set(t, (counts.get(t) ?? 0) + 1);
    }
    const rows = Object.keys(THEMES)
      .map((k) => ({ key: k, count: counts.get(k) ?? 0 }))
      .sort((a, b) => b.count - a.count);
    const max = Math.max(1, ...rows.map((r) => r.count));
    return { rows, max };
  }, [allPeople]);

  /* ------- (2) 时代跨度统计 ------- */
  const timeline = useMemo(() => {
    const samples = allPeople
      .filter((p) => typeof p.birth_year === "number")
      .map((p) => ({
        id: p.id,
        name_zh: p.name_zh,
        birth: p.birth_year as number,
        death: typeof p.death_year === "number" ? (p.death_year as number) : (p.birth_year as number) + 40,
      }));
    const births = samples.map((s) => s.birth);
    const deaths = samples.map((s) => s.death);
    const dataMin = Math.min(...births, ...deaths);
    const dataMax = Math.max(...births, ...deaths);
    // 让 min/max 有留白，覆盖用户要求从公元 0 ~ 2000 的视觉意图；
    // 若样本超出则延展。
    const min = Math.min(0, Math.floor(dataMin / 100) * 100 - 100);
    const max = Math.max(2000, Math.ceil(dataMax / 100) * 100 + 100);
    return { samples, min, max };
  }, [allPeople]);

  /* ------- (3) 地域覆盖统计 ------- */
  const regionStats = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of allPeople) {
      const k = normalizeRegion(p);
      counts.set(k, (counts.get(k) ?? 0) + 1);
    }
    const rows = [...counts.entries()]
      .map(([key, count]) => ({ key, count, label: REGION_LABEL[key] ?? key, color: REGION_COLOR[key] ?? "#9AA3B2" }))
      .sort((a, b) => b.count - a.count);
    const max = Math.max(1, ...rows.map((r) => r.count));
    return { rows, max };
  }, [allPeople]);

  const xTickPositions = useMemo(() => {
    const step = 500;
    const ticks: number[] = [];
    for (let v = timeline.min; v <= timeline.max; v += step) ticks.push(v);
    // 保证末端刻度
    if (ticks[ticks.length - 1] !== timeline.max) ticks.push(timeline.max);
    return ticks;
  }, [timeline]);

  return (
    <>
      {/* ============================================================
          左下角触发按钮（极简「数据入口」）
          ============================================================ */}
      <button
        type="button"
        aria-label="数据统计"
        onClick={() => setOpen(true)}
        className="
          group fixed bottom-6 left-6 z-40 cursor-pointer select-none
          text-white/60 hover:text-white/90 transition-colors
          text-sm font-light tracking-wider
        "
      >
        <span className="relative inline-block">
          <span
            className="
              inline-block px-3 py-2 rounded-lg
              bg-black/20 backdrop-blur-sm
              border border-white/5 hover:border-white/20
              transition-all duration-200
              group-hover:bg-black/40
              group-hover:shadow-[0_0_24px_rgba(242,193,78,0.12)]
            "
          >
            ✦ 已收录 {total} 位星辰
          </span>

          {/* Tooltip：悬停显示 */}
          <span
            className="
              pointer-events-none absolute left-1/2 -translate-x-1/2
              bottom-full mb-2 whitespace-nowrap
              rounded-md bg-black/80 backdrop-blur
              border border-white/10
              px-2.5 py-1 text-xs text-white/80 tracking-normal
              opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0
              transition-all duration-200
            "
          >
            点击查看数据统计
            <span
              className="
                absolute left-1/2 -translate-x-1/2 -bottom-1
                w-2 h-2 rotate-45
                bg-black/80 border-r border-b border-white/10
              "
            />
          </span>
        </span>
      </button>

      {/* ============================================================
          毛玻璃 Dialog（居中弹窗）
          ============================================================ */}
      <AnimatePresence>
        {open && (
          <>
            {/* 遮罩：点击外部关闭 */}
            <motion.div
              key="stats-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-50 bg-black/70 backdrop-blur-[2px]"
            />
            {/* 内容 */}
            <motion.div
              key="stats-panel"
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 260, damping: 28 }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="stats-title"
              onClick={(e) => e.stopPropagation()}
              className="
                fixed left-1/2 top-1/2 z-[51]
                -translate-x-1/2 -translate-y-1/2
                w-[min(92vw,540px)] max-h-[86vh] overflow-y-auto
                rounded-2xl
                border border-white/10
                bg-black/60 backdrop-blur-xl
                shadow-[0_30px_80px_rgba(0,0,0,0.6),0_0_80px_rgba(183,156,255,0.08)]
                text-foreground
              "
            >
              {/* 装饰：顶部星座微光 */}
              <div
                aria-hidden
                className="
                  pointer-events-none absolute -top-px left-0 right-0 h-24
                  rounded-t-2xl
                  bg-[radial-gradient(ellipse_at_top,rgba(242,193,78,0.18),transparent_55%),radial-gradient(ellipse_at_top_right,rgba(183,156,255,0.18),transparent_55%)]
                "
              />
              <ConstellationDecor />

              {/* 头部 */}
              <div className="relative px-7 pt-6 pb-3 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-primary/80">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Constellation Data</span>
                  </div>
                  <h2
                    id="stats-title"
                    className="mt-1 font-serif text-[22px] leading-tight text-foreground/95"
                  >
                    星群全景 · 数据统计
                  </h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    基于当前已收录的 <span className="text-primary">{total}</span> 位女性故事
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="
                    rounded-md p-1.5
                    text-muted-foreground hover:text-foreground
                    hover:bg-white/5 transition-colors
                  "
                  aria-label="关闭"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="relative px-7 pb-7 space-y-6">
                {/* =============================================================
                    模块一：议题分布（水平堆叠条）
                    ============================================================= */}
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <span
                      className="
                        inline-flex items-center justify-center
                        w-6 h-6 rounded-md
                        bg-primary/10 text-primary
                      "
                    >
                      <BarChart3 className="w-3.5 h-3.5" />
                    </span>
                    <h3 className="font-serif text-base text-foreground/95">
                      议题分布
                    </h3>
                    <span className="ml-auto text-[11px] text-muted-foreground">
                      按出现次数排序
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {themeStats.rows.map((row) => {
                      const pct = (row.count / themeStats.max) * 100;
                      return (
                        <div key={row.key} className="group">
                          <div className="flex items-center gap-3">
                            {/* 彩色堆叠条 */}
                            <div className="relative flex-1 h-3 rounded-full bg-white/5 overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ duration: 0.7, ease: "easeOut" }}
                                className="absolute inset-y-0 left-0 rounded-full"
                                style={{
                                  background: `linear-gradient(90deg, ${getThemeColor(row.key)}AA, ${getThemeColor(row.key)}DD)`,
                                  boxShadow: `0 0 12px ${getThemeColor(row.key)}55`,
                                }}
                              />
                            </div>
                            {/* 名称 + 数量 */}
                            <div className="w-[130px] flex items-center justify-between text-xs">
                              <span
                                className="font-medium truncate"
                                style={{ color: getThemeColor(row.key) }}
                                title={getThemeZh(row.key)}
                              >
                                {getThemeZh(row.key)}
                              </span>
                              <span className="text-muted-foreground tabular-nums">
                                {row.count}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>

                {/* =============================================================
                    模块二：时代跨度（时间轴散点）
                    ============================================================= */}
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <span
                      className="
                        inline-flex items-center justify-center
                        w-6 h-6 rounded-md
                        bg-[#B79CFF22] text-[#D6C7FF]
                      "
                    >
                      <Clock className="w-3.5 h-3.5" />
                    </span>
                    <h3 className="font-serif text-base text-foreground/95">
                      时代跨度
                    </h3>
                    <span className="ml-auto text-[11px] text-muted-foreground">
                      每个人物对应一段生命区间
                    </span>
                  </div>

                  <div className="rounded-xl bg-white/[0.03] border border-white/5 px-4 pt-5 pb-3">
                    {/* 时间轴绘图区 */}
                    <div className="relative h-[130px]">
                      {/* 年份刻度线（竖） */}
                      <svg
                        viewBox="0 0 100 100"
                        preserveAspectRatio="none"
                        className="absolute inset-0 w-full h-full"
                      >
                        {xTickPositions.map((t, i) => {
                          const x = ((t - timeline.min) / (timeline.max - timeline.min)) * 100;
                          const isMajor = t % 1000 === 0;
                          return (
                            <line
                              key={`tick-${i}`}
                              x1={x}
                              x2={x}
                              y1={isMajor ? 5 : 25}
                              y2={85}
                              stroke={isMajor ? "rgba(242,193,78,0.22)" : "rgba(255,255,255,0.06)"}
                              strokeDasharray={isMajor ? "0" : "2 3"}
                              strokeWidth={0.3}
                            />
                          );
                        })}
                        {/* 主轴线 */}
                        <line
                          x1={0}
                          x2={100}
                          y1={85}
                          y2={85}
                          stroke="url(#statsAxisGrad)"
                          strokeWidth={0.6}
                        />
                        <defs>
                          <linearGradient id="statsAxisGrad" x1="0" x2="1">
                            <stop offset="0%" stopColor="#F2C14E" stopOpacity="0.1" />
                            <stop offset="50%" stopColor="#B79CFF" stopOpacity="0.8" />
                            <stop offset="100%" stopColor="#F2C14E" stopOpacity="0.1" />
                          </linearGradient>
                        </defs>
                      </svg>

                      {/* 人物线 + 点 */}
                      <div className="absolute inset-0 w-full h-full pointer-events-none">
                        {timeline.samples.map((s, i) => {
                          const left = ((s.birth - timeline.min) / (timeline.max - timeline.min)) * 100;
                          const right = ((s.death - timeline.min) / (timeline.max - timeline.min)) * 100;
                          // 分层排布避免重叠（按 birth mod 3）
                          const lane = i % 3;
                          const top = 18 + lane * 20; // px
                          const era = eraOf(s.birth);
                          return (
                            <div
                              key={s.id}
                              className="absolute pointer-events-auto group"
                              style={{
                                left: `${left}%`,
                                top: `${top}px`,
                                width: `${Math.max(2, right - left)}%`,
                              }}
                            >
                              {/* 线段（活跃区间） */}
                              <motion.div
                                initial={{ scaleX: 0, opacity: 0 }}
                                animate={{ scaleX: 1, opacity: 1 }}
                                transition={{ duration: 0.8, delay: 0.1 + i * 0.06, ease: "easeOut" }}
                                className="h-[2px] w-full rounded-full origin-left"
                                style={{
                                  background: `linear-gradient(90deg, ${era.color}22, ${era.color}BB, ${era.color}22)`,
                                  boxShadow: `0 0 6px ${era.color}66`,
                                }}
                              />
                              {/* 出生点圆点 */}
                              <motion.span
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{
                                  type: "spring",
                                  stiffness: 260,
                                  damping: 22,
                                  delay: 0.2 + i * 0.07,
                                }}
                                className="
                                  absolute -left-[5px] -top-[5px]
                                  w-3 h-3 rounded-full
                                  flex items-center justify-center
                                "
                                style={{
                                  background: `radial-gradient(circle at 30% 30%, #FFF6D6, ${era.color} 65%)`,
                                  boxShadow: `0 0 10px ${era.color}CC, 0 0 22px ${era.color}66`,
                                }}
                                title={`${s.name_zh} · ${s.birth}–${s.death}`}
                              />
                              {/* 人物名标签 */}
                              <div
                                className="
                                  absolute left-1/2 -translate-x-1/2 -top-[18px]
                                  text-[10px] whitespace-nowrap
                                  text-muted-foreground/0 group-hover:text-foreground/90
                                  transition-colors duration-200
                                "
                                style={{ color: era.color }}
                              >
                                {s.name_zh}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* 底部刻度文字 */}
                    <div className="relative mt-1 h-5">
                      {xTickPositions.map((t, i) => {
                        const left = ((t - timeline.min) / (timeline.max - timeline.min)) * 100;
                        return (
                          <span
                            key={`label-${i}`}
                            className="
                              absolute -translate-x-1/2
                              text-[10px] tabular-nums
                              text-muted-foreground/70
                            "
                            style={{ left: `${left}%` }}
                          >
                            {t < 0 ? `前${-t}` : t}
                          </span>
                        );
                      })}
                    </div>

                    {/* 年代图例 */}
                    <div className="mt-3 pt-3 border-t border-white/5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-muted-foreground">
                      {[
                        ["#F2C14E", "古典 (0–500)"],
                        ["#B79CFF", "中世纪 (500–1500)"],
                        ["#FD79A8", "近代 (1500–1800)"],
                        ["#A8E6CF", "近现代 (1800–1900)"],
                        ["#F7B32B", "20 世纪后"],
                      ].map(([c, l]) => (
                        <span key={l} className="inline-flex items-center gap-1.5">
                          <span
                            className="inline-block w-2 h-2 rounded-full"
                            style={{ background: c, boxShadow: `0 0 6px ${c}99` }}
                          />
                          {l}
                        </span>
                      ))}
                    </div>
                  </div>
                </section>

                {/* =============================================================
                    模块三：地域覆盖（分类计数 + 标签云）
                    ============================================================= */}
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <span
                      className="
                        inline-flex items-center justify-center
                        w-6 h-6 rounded-md
                        bg-[#4ECDC422] text-[#A8E6CF]
                      "
                    >
                      <Globe2 className="w-3.5 h-3.5" />
                    </span>
                    <h3 className="font-serif text-base text-foreground/95">
                      地域覆盖
                    </h3>
                    <span className="ml-auto text-[11px] text-muted-foreground">
                      归一化至大洲级别
                    </span>
                  </div>

                  <div className="rounded-xl bg-white/[0.03] border border-white/5 p-4">
                    {/* 条形汇总 */}
                    <div className="space-y-2.5">
                      {regionStats.rows.map((row) => {
                        const pct = (row.count / regionStats.max) * 100;
                        return (
                          <div key={row.key} className="flex items-center gap-3">
                            <div className="relative flex-1 h-3 rounded-full bg-white/5 overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ duration: 0.7, ease: "easeOut" }}
                                className="absolute inset-y-0 left-0 rounded-full"
                                style={{
                                  background: `linear-gradient(90deg, ${row.color}88, ${row.color}EE)`,
                                  boxShadow: `0 0 10px ${row.color}55`,
                                }}
                              />
                            </div>
                            <div className="w-[100px] flex items-center justify-between text-xs">
                              <span
                                className="font-medium"
                                style={{ color: row.color }}
                              >
                                {row.label}
                              </span>
                              <span className="text-muted-foreground tabular-nums">
                                {row.count} 位
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* 标签云 */}
                    <div className="mt-4 flex flex-wrap gap-2">
                      {regionStats.rows.map((row) => {
                        const scale = 0.85 + (row.count / regionStats.max) * 0.5;
                        return (
                          <span
                            key={`tag-${row.key}`}
                            className="
                              inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full
                              border text-xs transition-all
                              hover:scale-[1.03]
                            "
                            style={{
                              borderColor: `${row.color}55`,
                              background: `${row.color}12`,
                              color: row.color,
                              fontSize: `${scale}rem`,
                              boxShadow: `0 0 14px ${row.color}22`,
                            }}
                          >
                            <span
                              className="inline-block w-1.5 h-1.5 rounded-full"
                              style={{ background: row.color }}
                            />
                            {row.label}
                            <span
                              className="
                                ml-0.5 px-1.5 py-[1px] rounded-full
                                text-[10px] tabular-nums
                              "
                              style={{ background: `${row.color}22`, color: row.color }}
                            >
                              {row.count}
                            </span>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </section>

                {/* 底部脚注 */}
                <div
                  className="
                    pt-1 flex items-center justify-between
                    text-[11px] text-muted-foreground/80
                  "
                >
                  <span>数据来源：stories.json · {Object.keys(THEMES).length} 个议题</span>
                  <span className="tracking-widest">✦ ✦ ✦</span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

/* ============================================================
   装饰：角落的星座连线（纯 SVG，不影响交互）
   ============================================================ */
function ConstellationDecor() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 540 80"
      preserveAspectRatio="none"
      className="pointer-events-none absolute top-0 left-0 w-full h-20 opacity-70"
    >
      <defs>
        <linearGradient id="statsConstellationGrad" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="#F2C14E" stopOpacity="0.0" />
          <stop offset="30%" stopColor="#F2C14E" stopOpacity="0.45" />
          <stop offset="60%" stopColor="#B79CFF" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#B79CFF" stopOpacity="0.0" />
        </linearGradient>
      </defs>
      <g fill="none" stroke="url(#statsConstellationGrad)" strokeWidth="1">
        <path d="M20 36 L110 18 L180 46 L260 22 L330 52 L420 20 L510 42" />
      </g>
      <g fill="#F2C14E">
        <circle cx="20" cy="36" r="1.5" opacity="0.9" />
        <circle cx="110" cy="18" r="2.2" opacity="1" />
        <circle cx="180" cy="46" r="1.8" opacity="0.85" />
        <circle cx="260" cy="22" r="2.4" opacity="1" />
        <circle cx="330" cy="52" r="1.6" opacity="0.9" />
        <circle cx="420" cy="20" r="2.1" opacity="1" />
        <circle cx="510" cy="42" r="1.5" opacity="0.9" />
      </g>
    </svg>
  );
}
