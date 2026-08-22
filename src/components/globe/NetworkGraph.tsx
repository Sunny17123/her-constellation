import { useEffect, useRef, useMemo, useState, useCallback, type MouseEvent } from "react";
import ForceGraph2D from "react-force-graph-2d";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, X, RotateCcw } from "lucide-react";
import { useGlobeSelection } from "@/hooks/useGlobeSelection";
import { getThemeColor } from "@/data/load";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Person, Connection } from "@/data/schema";

import StarCard from "./StarCard";
import ConstellationChrome from "./ConstellationChrome";
import {
  LINK_STYLES,
  computeImportance,
  nodeRadius,
  inferLinkType,
  fieldsOf,
  continentOf,
  centuryOf,
  matchesFilters,
  clamp01,
  hexA,
  type FilterTag,
  type LinkVisualType,
  type NodeImportance,
} from "./constellation-utils";

/* ----------------------------- 运行时图节点 / 连线 ----------------------------- */

interface GraphNode {
  id: string;
  person: Person;
  importance: NodeImportance;
  radius: number;
  color: string;
  fields: string[];
  continent: string;
  century: string | null;
  birthYear: number | null;
  /** 按星等排序的浮现序号（加载动画用） */
  appearIndex: number;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

interface GraphLink {
  source: GraphNode;
  target: GraphNode;
  conn: Connection;
  style: LinkVisualType;
  color: string;
}

export default function NetworkGraph() {
  const navigate = useNavigate();
  const { allPeople, allConnections, selectPerson } = useGlobeSelection();

  const wrapRef = useRef<HTMLDivElement>(null);
  const fgRef = useRef<any>(null);

  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [pinnedId, setPinnedId] = useState<string | null>(null);
  const [pinnedPos, setPinnedPos] = useState({ x: 0, y: 0 });
  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  const [filters, setFilters] = useState<FilterTag[]>([]);
  const [query, setQuery] = useState("");
  const [year, setYear] = useState(2000);
  const [showIntro, setShowIntro] = useState(true);
  const [reveal, setReveal] = useState(0);
  const [size, setSize] = useState({ w: 800, h: 600 });

  /* ----------------------------- 节点 / 连线构建 ----------------------------- */

  const maxConn = useMemo(() => {
    let m = 1;
    allPeople.forEach((p) => {
      const c = allConnections.filter(
        (x) => x.source_id === p.id || x.target_id === p.id
      ).length;
      if (c > m) m = c;
    });
    return m;
  }, [allPeople, allConnections]);

  const nodes: GraphNode[] = useMemo(() => {
    const built: GraphNode[] = allPeople.map((p) => {
      const cnt = allConnections.filter(
        (x) => x.source_id === p.id || x.target_id === p.id
      ).length;
      const imp = computeImportance(p, cnt, maxConn);
      return {
        id: p.id,
        person: p,
        importance: imp,
        radius: nodeRadius(imp.score),
        color: getThemeColor(p.themes[0]),
        fields: fieldsOf(p),
        continent: continentOf(p),
        century: centuryOf(p),
        birthYear: p.birth_year ?? null,
        appearIndex: 0,
      };
    });
    // 按星等降序，大星先点亮
    built.sort((a, b) => b.importance.score - a.importance.score);
    built.forEach((n, i) => (n.appearIndex = i));
    return built;
  }, [allPeople, allConnections, maxConn]);

  const nodeById = useMemo(() => {
    const m = new Map<string, GraphNode>();
    nodes.forEach((n) => m.set(n.id, n));
    return m;
  }, [nodes]);

  const links: GraphLink[] = useMemo(() => {
    return allConnections
      .map((c) => {
        const s = nodeById.get(c.source_id);
        const t = nodeById.get(c.target_id);
        if (!s || !t) return null;
        const vt = inferLinkType(c, s.person, t.person);
        return {
          source: s,
          target: t,
          conn: c,
          style: vt,
          color: LINK_STYLES[vt].color,
        } as GraphLink;
      })
      .filter((x): x is GraphLink => x !== null);
  }, [allConnections, nodeById]);

  /* ----------------------------- 时间轴范围 ----------------------------- */

  const { minYear, maxYear } = useMemo(() => {
    const years = allPeople
      .map((p) => p.birth_year)
      .filter((y): y is number => y != null);
    if (years.length === 0) return { minYear: 1800, maxYear: 2025 };
    const mn = Math.min(...years);
    const mx = Math.max(...years);
    // 向外取整到 50 年刻度，留出余量
    return {
      minYear: Math.floor(mn / 50) * 50,
      maxYear: Math.ceil(mx / 50) * 50,
    };
  }, [allPeople]);

  useEffect(() => {
    setYear(maxYear);
  }, [maxYear]);

  /* ----------------------------- 筛选 / 高亮集合 ----------------------------- */

  const visibleNodeIds = useMemo(() => {
    const set = new Set<string>();
    nodes.forEach((n) => {
      if (n.birthYear == null || n.birthYear <= year) set.add(n.id);
    });
    return set;
  }, [nodes, year]);

  const matchedNodeIds = useMemo(() => {
    const set = new Set<string>();
    nodes.forEach((n) => {
      if (matchesFilters(n.person, filters)) set.add(n.id);
    });
    return set;
  }, [nodes, filters]);

  const focusId = pinnedId ?? hoveredId;

  const focusLinkKeys = useMemo(() => {
    if (!focusId) return new Set<string>();
    const set = new Set<string>();
    links.forEach((l) => {
      if (l.source.id === focusId || l.target.id === focusId) {
        set.add(l.conn.id);
      }
    });
    return set;
  }, [links, focusId]);

  /* ----------------------------- 加载动画 ----------------------------- */

  useEffect(() => {
    if (!showIntro) return;
    let raf = 0;
    let start = 0;
    const duration = 2200;
    const tick = (t: number) => {
      if (!start) start = t;
      const p = Math.min(1, (t - start) / duration);
      setReveal(p);
      if (p < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        // 稍作停留后隐藏文案
        setTimeout(() => setShowIntro(false), 700);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [showIntro]);

  /* ----------------------------- 尺寸 / 力参数 / 自动缩放 ----------------------------- */

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const update = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const fg = fgRef.current;
    if (!fg) return;
    // 动态斥力：节点多斥力大，避免重叠
    const n = nodes.length;
    const charge = fg.d3Force("charge");
    if (charge) charge.strength(-(100 + n * 8));
    const link = fg.d3Force("link");
    if (link) {
      link.distance(110);
      link.strength(0.2);
    }
    fg.d3VelocityDecay(0.35);
    fg.d3ReheatSimulation();
  }, [nodes.length]);

  // 加载动画结束后自适应视图
  useEffect(() => {
    if (showIntro) return;
    const t = setTimeout(() => fgRef.current?.zoomToFit(400, 70), 200);
    return () => clearTimeout(t);
  }, [showIntro]);

  /* ----------------------------- 搜索 ----------------------------- */

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return allPeople
      .filter(
        (p) =>
          p.name_zh.toLowerCase().includes(q) ||
          p.name_en.toLowerCase().includes(q)
      )
      .slice(0, 6);
  }, [query, allPeople]);

  const focusPerson = useCallback(
    (p: Person) => {
      const n = nodeById.get(p.id);
      const fg = fgRef.current;
      if (!n || !fg || n.x == null || n.y == null) return;
      fg.centerAt(n.x, n.y, 900);
      fg.zoom(3.2, 900);
      setPinnedId(p.id);
      setPinnedPos({ x: mouse.x, y: mouse.y });
      setQuery("");
    },
    [nodeById, mouse.x, mouse.y]
  );

  /* ----------------------------- 交互回调 ----------------------------- */

  const onNodeHover = useCallback(
    (node: any) => {
      // 固定态下不切换 hover，避免卡片乱跳
      if (pinnedId) return;
      setHoveredId(node ? (node as GraphNode).id : null);
    },
    [pinnedId]
  );

  const onNodeClick = useCallback(
    (node: any) => {
      const n = node as GraphNode;
      if (pinnedId === n.id) {
        // 再点一次取消固定
        setPinnedId(null);
        return;
      }
      setPinnedId(n.id);
      setPinnedPos({ x: mouse.x, y: mouse.y });
    },
    [pinnedId, mouse.x, mouse.y]
  );

  const onBackgroundClick = useCallback(() => {
    setPinnedId(null);
  }, []);

  const onMouseMove = useCallback((e: MouseEvent) => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const rect = wrap.getBoundingClientRect();
    setMouse({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }, []);

  /* ----------------------------- 筛选标签生成 ----------------------------- */

  const tagData = useMemo(() => {
    const f = new Set<string>();
    const r = new Set<string>();
    const c = new Set<string>();
    allPeople.forEach((p) => {
      fieldsOf(p).forEach((x) => f.add(x));
      r.add(continentOf(p));
      const ce = centuryOf(p);
      if (ce) c.add(ce);
    });
    const numSort = (arr: string[]) =>
      arr.sort((a, b) => a.localeCompare(b, "zh", { numeric: true }));
    return {
      field: numSort([...f]).map((v) => ({ group: "field" as const, value: v })),
      region: numSort([...r]).map((v) => ({ group: "region" as const, value: v })),
      century: numSort([...c]).map((v) => ({ group: "century" as const, value: v })),
    };
  }, [allPeople]);

  const toggleFilter = useCallback((t: FilterTag) => {
    setFilters((prev) => {
      const exists = prev.some(
        (s) => s.group === t.group && s.value === t.value
      );
      return exists
        ? prev.filter((s) => !(s.group === t.group && s.value === t.value))
        : [...prev, t];
    });
  }, []);

  const isOn = useCallback(
    (t: FilterTag) =>
      filters.some((s) => s.group === t.group && s.value === t.value),
    [filters]
  );

  /* ----------------------------- Canvas 绘制 ----------------------------- */

  const graphData = useMemo(
    () => ({
      nodes: nodes.map((n) => ({ ...n })),
      links: links.map((l) => ({
        source: l.source.id,
        target: l.target.id,
        _gl: l,
      })),
    }),
    [nodes, links]
  );

  /** 节点绘制：光晕 → 星环 → 实心圆 → 中心高光 → 名字 */
  const drawNode = (node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const n = node as GraphNode;
    if (!visibleNodeIds.has(n.id)) return;
    if (n.x == null || n.y == null) return;

    // 浮现透明度：按星等序号逐一点亮（前 60% 时间窗内）
    const total = nodes.length || 1;
    const appearAt = (n.appearIndex / total) * 0.6;
    let alpha = showIntro ? clamp01((reveal - appearAt) / 0.3) : 1;
    if (alpha <= 0) return;

    // 筛选淡化：不匹配者降至 18%
    const matched = matchedNodeIds.has(n.id);
    if (filters.length > 0 && !matched) alpha *= 0.18;

    // 高亮态：1.3 倍 + 光晕增强
    const focused = focusId === n.id;
    const scale = focused ? 1.3 : 1;
    const r = n.radius * scale;

    // 1) 光晕（径向渐变）
    const glowR = r * 3.6;
    const grd = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, glowR);
    grd.addColorStop(0, hexA(n.color, 0.55 * alpha));
    grd.addColorStop(0.4, hexA(n.color, 0.18 * alpha));
    grd.addColorStop(1, hexA(n.color, 0));
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(n.x, n.y, glowR, 0, 2 * Math.PI);
    ctx.fill();

    // 2) 星环（重要节点：score > 0.55）
    if (n.importance.score > 0.55) {
      ctx.strokeStyle = hexA(n.color, (focused ? 0.55 : 0.3) * alpha);
      ctx.lineWidth = focused ? 1.5 : 1;
      ctx.beginPath();
      ctx.arc(n.x, n.y, r * 1.7, 0, 2 * Math.PI);
      ctx.stroke();
    }

    // 3) 实心圆（本体）
    ctx.fillStyle = hexA(n.color, alpha);
    ctx.beginPath();
    ctx.arc(n.x, n.y, r, 0, 2 * Math.PI);
    ctx.fill();

    // 中心高光（白色小点，模拟恒星核）
    ctx.fillStyle = hexA("#FFFFFF", 0.7 * alpha);
    ctx.beginPath();
    ctx.arc(n.x - r * 0.25, n.y - r * 0.25, r * 0.32, 0, 2 * Math.PI);
    ctx.fill();

    // 4) 名字：重要节点常显，其余仅高亮/悬停时显
    if (n.importance.score > 0.6 || focused || hoveredId === n.id) {
      const fs = 12 / globalScale;
      ctx.font = `${fs}px "Noto Serif SC", serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillStyle = hexA("#EDEFF5", 0.92 * alpha);
      ctx.fillText(n.person.name_zh, n.x, n.y + r + 4 / globalScale);
    }
  };

  /** 连线绘制：颜色 / 虚线 / 宽度 / 发光 / 距离衰减 / 高亮淡化 */
  const drawLink = (link: any, ctx: CanvasRenderingContext2D) => {
    const gl = link._gl as GraphLink | undefined;
    const s = link.source as GraphNode;
    const t = link.target as GraphNode;
    if (!gl || !s || !t || s.x == null || t.x == null) return;
    // 时间轴过滤
    if (!visibleNodeIds.has(s.id) || !visibleNodeIds.has(t.id)) return;

    const style = LINK_STYLES[gl.style];

    // 浮现：两端都点亮后再生长连线
    const total = nodes.length || 1;
    const sAppear = ((s.appearIndex ?? 0) / total) * 0.6;
    const tAppear = ((t.appearIndex ?? 0) / total) * 0.6;
    const linkAppear = Math.max(sAppear, tAppear) + 0.05;
    let alpha = showIntro ? clamp01((reveal - linkAppear) / 0.25) : 1;
    if (alpha <= 0) return;

    // 距离衰减：近清晰远朦胧
    const dx = t.x - s.x;
    const dy = t.y - s.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const maxDist = 520;
    alpha *= clamp01(1 - dist / maxDist + 0.25);

    // 高亮态：相关连线高亮，其余降至 15%
    if (focusId) {
      if (focusLinkKeys.has(gl.conn.id)) {
        alpha = Math.max(alpha, 0.95);
      } else {
        alpha *= 0.15;
      }
    }

    // 筛选淡化：两端都不匹配
    if (filters.length > 0) {
      const sM = matchedNodeIds.has(s.id);
      const tM = matchedNodeIds.has(t.id);
      if (!sM && !tM) alpha *= 0.15;
    }

    // 绘制
    ctx.strokeStyle = hexA(style.color, alpha);
    ctx.lineWidth = style.widthBase;
    ctx.setLineDash(style.dash ? style.dash.map((d) => d * 1.2) : []);
    ctx.shadowBlur = style.glow ? 12 : 4;
    ctx.shadowColor = style.color;
    ctx.beginPath();
    ctx.moveTo(s.x, s.y);
    ctx.lineTo(t.x, t.y);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.setLineDash([]);
  };

  /* ----------------------------- 星卡定位（跟随鼠标，避开边界） ----------------------------- */

  let cardPos: { x: number; y: number } | null = null;
  const focusNode = focusId ? nodeById.get(focusId) : null;
  if (focusNode && wrapRef.current) {
    const w = wrapRef.current.clientWidth;
    const h = wrapRef.current.clientHeight;
    const cardW = 316;
    const cardH = 380;
    const anchor =
      pinnedId && pinnedId === focusId ? pinnedPos : mouse;
    let x = anchor.x + 18;
    let y = anchor.y + 18;
    if (x + cardW > w - 8) x = anchor.x - cardW - 18;
    if (y + cardH > h - 8) y = anchor.y - cardH - 18;
    if (x < 8) x = 8;
    if (y < 8) y = 8;
    cardPos = { x, y };
  }

  const focusConnections: Connection[] = focusId
    ? allConnections.filter(
        (c) => c.source_id === focusId || c.target_id === focusId
      )
    : [];

  /* ----------------------------- 渲染 ----------------------------- */

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      {/* 顶部栏 */}
      <div className="flex flex-shrink-0 items-center justify-between border-b border-border px-5 py-3">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          返回地球
        </Button>
        <h2 className="font-serif text-base text-foreground">她的星群</h2>
        <div className="text-xs text-muted-foreground">
          {allPeople.length} 位 · {allConnections.length} 条呼应
        </div>
      </div>

      {/* 搜索 + 筛选条 */}
      <div className="cg-glass flex flex-shrink-0 flex-wrap items-center gap-2 border-b border-border px-3 py-2">
        {/* 搜索 */}
        <div className="relative w-52 max-w-[40%]">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索一颗星 · 名字"
            className="w-full rounded-full border border-border bg-background/60 py-1.5 pl-8 pr-7 text-xs text-foreground placeholder:text-muted-foreground/70 focus:border-[#F5A623]/50 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          {/* 搜索结果下拉 */}
          {query && searchResults.length > 0 && (
            <div className="absolute left-0 right-0 top-full z-30 mt-1.5 max-h-60 overflow-auto rounded-xl border border-border bg-background/95 py-1 shadow-2xl backdrop-blur">
              {searchResults.map((p) => (
                <button
                  key={p.id}
                  onClick={() => focusPerson(p)}
                  className="flex w-full items-center justify-between px-3 py-1.5 text-left text-xs hover:bg-white/[0.04]"
                >
                  <span className="text-foreground">{p.name_zh}</span>
                  <span className="ml-2 truncate text-[10px] text-muted-foreground">
                    {p.time_period}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 筛选标签条 */}
        <div className="flex flex-1 flex-wrap items-center gap-1.5">
          <TagChip
            label="全部"
            active={filters.length === 0}
            onClick={() => filters.length && setFilters([])}
          />
          <span className="mx-0.5 h-3 w-px bg-border" />
          {tagData.field.map((t) => (
            <TagChip
              key={t.value}
              label={t.value}
              dotClass="cg-dot-field"
              active={isOn(t)}
              onClick={() => toggleFilter(t)}
            />
          ))}
          <span className="mx-0.5 h-3 w-px bg-border" />
          {tagData.region.map((t) => (
            <TagChip
              key={t.value}
              label={t.value}
              dotClass="cg-dot-region"
              active={isOn(t)}
              onClick={() => toggleFilter(t)}
            />
          ))}
          <span className="mx-0.5 h-3 w-px bg-border" />
          {tagData.century.map((t) => (
            <TagChip
              key={t.value}
              label={t.value}
              dotClass="cg-dot-century"
              active={isOn(t)}
              onClick={() => toggleFilter(t)}
            />
          ))}
          {filters.length > 0 && (
            <button
              onClick={() => setFilters([])}
              className="ml-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="h-3 w-3" />
              清除
            </button>
          )}
        </div>
      </div>

      {/* 画布区 */}
      <div
        ref={wrapRef}
        className="relative flex-1 overflow-hidden"
        onMouseMove={onMouseMove}
      >
        <ForceGraph2D
          ref={fgRef}
          graphData={graphData}
          width={size.w}
          height={size.h}
          nodeCanvasObject={drawNode}
          nodeCanvasObjectMode={() => "replace" as const}
          linkCanvasObject={drawLink}
          linkCanvasObjectMode={() => "replace" as const}
          onNodeHover={onNodeHover}
          onNodeClick={onNodeClick}
          onBackgroundClick={onBackgroundClick}
          backgroundColor="rgba(7,11,20,0)"
          cooldownTicks={120}
          d3AlphaDecay={0.02}
          d3VelocityDecay={0.35}
          enableNodeDrag={false}
        />

        {/* 星卡 */}
        {focusNode && cardPos && (
          <div
            className="pointer-events-none absolute z-20"
            style={{ left: cardPos.x, top: cardPos.y }}
          >
            <div className="pointer-events-auto">
              <StarCard
                person={focusNode.person}
                importance={focusNode.importance}
                connections={focusConnections}
                allPeople={allPeople}
                onExplore={() => {
                  selectPerson(focusNode.person.id);
                  navigate("/");
                }}
              />
            </div>
          </div>
        )}

        {/* 图例 + 时间轴 + 加载文案 */}
        <ConstellationChrome
          minYear={minYear}
          maxYear={maxYear}
          year={year}
          onYearChange={setYear}
          showIntro={showIntro}
        />
      </div>
    </div>
  );
}

/* ----------------------------- 内部小组件 ----------------------------- */

function TagChip({
  label,
  active,
  onClick,
  dotClass,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  dotClass?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "cg-tag inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px]",
        active && "cg-tag-active"
      )}
    >
      {dotClass && (
        <span className={cn("h-1.5 w-1.5 rounded-full", dotClass)} />
      )}
      {label}
    </button>
  );
}
