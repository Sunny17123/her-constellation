/**
 * 2D 星群界面 · 工具与映射
 *
 * - 用「星等」表达人物重要性（节点大小）
 * - 用「光谱」表达联结类型（连线颜色 / 线型）
 * - 节点 / 连线样式、领域 / 大洲 / 世纪推断、筛选匹配
 *
 * 注：现有数据尚无 impactScore / recognitionScore / rarityScore 字段，
 * 这里用 starter_score + 联结数 + 出生年代做代理计算，
 * 字段补全后只需替换 computeImportance 内部即可。
 */
import type { Person, Connection } from "@/data/schema";
import { continentLabelOf } from "@/data/regions";

/* ----------------------------- 联结光谱 ----------------------------- */

/** 5 种视觉联结类型（光谱带） */
export type LinkVisualType =
  | "legacy" // 思想传承（琥珀金 · 实线）
  | "contemporary" // 同时代对话（星云紫 · 虚线）
  | "geographic" // 地理跨越（海洋蓝 · 点线）
  | "thematic" // 主题共鸣（玫瑰粉 · 实线 + 微光）
  | "lineage"; // 血缘 / 师徒（翡翠绿 · 粗实线）

export interface LinkStyle {
  type: LinkVisualType;
  label: string;
  color: string;
  /** 虚线模式，null = 实线 */
  dash: number[] | null;
  /** 基础宽度（px），最终宽度还会叠加联结强度 */
  widthBase: number;
  /** 是否叠加发光（shadowBlur） */
  glow: boolean;
}

export const LINK_STYLES: Record<LinkVisualType, LinkStyle> = {
  legacy: { type: "legacy", label: "思想传承", color: "#F5A623", dash: null, widthBase: 2.5, glow: false },
  contemporary: { type: "contemporary", label: "同时代对话", color: "#9B59B6", dash: [7, 5], widthBase: 2, glow: false },
  geographic: { type: "geographic", label: "地理跨越", color: "#3498DB", dash: [1, 5], widthBase: 2, glow: false },
  thematic: { type: "thematic", label: "主题共鸣", color: "#E74C8B", dash: null, widthBase: 2.5, glow: true },
  lineage: { type: "lineage", label: "血缘 / 师徒", color: "#2ECC71", dash: null, widthBase: 4, glow: false },
};

/** 图例展示顺序 */
export const LEGEND_ORDER: LinkVisualType[] = [
  "legacy",
  "contemporary",
  "geographic",
  "thematic",
  "lineage",
];

/** 同时代判定阈值：出生年相差 ≤ 60 年视为同时代 */
const SAME_ERA_THRESHOLD = 60;

function isSameEra(a: Person, b: Person): boolean {
  if (a.birth_year == null || b.birth_year == null) return false;
  return Math.abs(a.birth_year - b.birth_year) <= SAME_ERA_THRESHOLD;
}

/** 取地区末段（国家）做同地区判定 */
function countryOf(region_en: string): string {
  return region_en.split(",").map((s) => s.trim()).pop()?.toLowerCase() ?? "";
}

function isSameRegion(a: Person, b: Person): boolean {
  return countryOf(a.region_en) === countryOf(b.region_en);
}

/**
 * 根据联结 + 两端人物推断视觉联结类型
 * 判定树：师徒 → 同时空主题 → 同时代跨地区 → 跨时代同地区 → 跨时代跨地区
 */
export function inferLinkType(
  conn: Connection,
  source: Person,
  target: Person
): LinkVisualType {
  if (conn.connection_type === "direct_lineage") return "lineage";
  const sameEra = isSameEra(source, target);
  const sameRegion = isSameRegion(source, target);
  if (sameEra && sameRegion) return "thematic"; // 同时空 + 主题相关
  if (sameEra && !sameRegion) return "contemporary"; // 同时代 · 跨地区
  if (!sameEra && sameRegion) return "legacy"; // 跨时代 · 同地区（思想传承）
  return "geographic"; // 跨时代 · 跨地区
}

/* ----------------------------- 星等 / 重要性 ----------------------------- */

export interface NodeImportance {
  /** 历史影响力 0-1 */
  impact: number;
  /** 当代知名度 0-1 */
  recognition: number;
  /** 联结广度 0-1 */
  breadth: number;
  /** 故事稀缺度 0-1 */
  rarity: number;
  /** 加权综合 0-1 */
  score: number;
}

/**
 * 计算节点重要性（星等）
 * 权重：影响力 35% · 知名度 25% · 广度 25% · 稀缺度 15%
 * 字段补全前用 starter_score 等做代理。
 */
export function computeImportance(
  person: Person,
  connCount: number,
  maxConnCount: number
): NodeImportance {
  const starter = person.starter_score ?? 5; // 0-10
  const impact = clamp01(starter / 10);
  const recognition = clamp01(starter / 10); // 代理：暂用 starter_score
  const breadth = maxConnCount > 0 ? clamp01(connCount / maxConnCount) : 0;
  const rarity = clamp01(1 - starter / 10); // 代理：越不知名越稀缺
  const score =
    0.35 * impact + 0.25 * recognition + 0.25 * breadth + 0.15 * rarity;
  return { impact, recognition, breadth, rarity, score };
}

/** 节点半径：8 + score × 16，clamp 到 8 ~ 32 */
export function nodeRadius(score: number): number {
  return Math.min(32, Math.max(8, 8 + score * 16));
}

export function clamp01(v: number): number {
  return Math.min(1, Math.max(0, v));
}

/** hex(#RRGGBB) + alpha(0-1) → rgba 字符串，供 canvas 使用 */
export function hexA(hex: string, a: number): string {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r},${g},${b},${a})`;
}

/* ----------------------------- 筛选维度 ----------------------------- */

export type FilterGroup = "field" | "region" | "century";

export interface FilterTag {
  group: FilterGroup;
  /** 显示文本 */
  value: string;
}

/** 主题 → 领域标签（一人可属多个领域） */
export function fieldsOf(person: Person): string[] {
  const set = new Set<string>();
  person.themes.forEach((t) => {
    switch (t) {
      case "science":
        set.add("科学家");
        break;
      case "art_voice":
        set.add("艺术家");
        break;
      case "education":
      case "peace_justice":
        set.add("思想者");
        break;
      case "suffrage":
      case "body":
      case "labor":
        set.add("行动者");
        break;
    }
  });
  return [...set];
}

/** 大洲推断（与数据统计共用同一地域归一化规则） */
export function continentOf(person: Person): string {
  return continentLabelOf(person);
}

/** 世纪推断（基于出生年） */
export function centuryOf(person: Person): string | null {
  if (person.birth_year == null || person.birth_year <= 0) return null;
  const c = Math.ceil(person.birth_year / 100);
  return `${c}世纪`;
}

/** 节点是否匹配某个 tag */
export function matchesTag(person: Person, tag: FilterTag): boolean {
  if (tag.group === "field") return fieldsOf(person).includes(tag.value);
  if (tag.group === "region") return continentOf(person) === tag.value;
  if (tag.group === "century") return centuryOf(person) === tag.value;
  return false;
}

/**
 * 组间 AND、组内 OR 的筛选匹配
 * 未选任何 tag 时返回 true（全部显示）
 * 例：选「亚洲 + 科学家」= 亚洲的科学家；选「亚洲 + 非洲」= 亚洲或非洲
 */
export function matchesFilters(person: Person, tags: FilterTag[]): boolean {
  if (tags.length === 0) return true;
  const groups = new Map<FilterGroup, FilterTag[]>();
  tags.forEach((t) => {
    const arr = groups.get(t.group) ?? [];
    arr.push(t);
    groups.set(t.group, arr);
  });
  for (const arr of groups.values()) {
    if (!arr.some((t) => matchesTag(person, t))) return false;
  }
  return true;
}
