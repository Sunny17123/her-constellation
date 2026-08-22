import { z } from "zod";

/**
 * SHESHAPES · 数据 schema（zod 单一事实源）
 *
 * 基于 PLAN_v1 §2.2 定义，做了以下适配：
 * - 一人一档（people/*.json）而非 stories.json 数组
 * - 保留 v1 的核心字段约束
 * - starter_score 字段（PLAN_v2 §7.3 新增）
 */

// 主题枚举（与 data/themes.ts 对齐）
export const ThemeKeySchema = z.enum([
  "education",
  "suffrage",
  "body",
  "labor",
  "science",
  "art_voice",
  "peace_justice",
]);
export type ThemeKey = z.infer<typeof ThemeKeySchema>;

// 坐标
export const CoordinatesSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

// 人物 schema
export const PersonSchema = z.object({
  id: z.string().regex(/^[a-z][a-z0-9_]*$/, "id 必须全小写蛇形"),
  name_zh: z.string().min(1),
  name_en: z.string().min(1),
  time_period: z.string().min(1),
  birth_year: z.number().int().optional(),
  death_year: z.number().int().optional(),
  region_zh: z.string().min(1),
  region_en: z.string().min(1),
  coordinates: CoordinatesSchema,
  themes: z.array(ThemeKeySchema).min(1).max(3),
  short_story: z.string().min(100, "short_story 至少 100 字"),
  why_visible: z.string().min(1),
  relevance_today: z.string().min(1),
  source_urls: z.array(z.string().url()).min(2, "至少 2 条来源"),
  image_url: z.string().optional(),
  starter_score: z.number().min(0).max(10).optional().default(5),
});
export type Person = z.infer<typeof PersonSchema>;

// 联结类型
export const ConnectionTypeSchema = z.enum([
  "same_era",
  "cross_region",
  "cross_era",
  "cross_both",
  "direct_lineage",
]);
export type ConnectionType = z.infer<typeof ConnectionTypeSchema>;

// 联结证据类型：真实历史关系或策展并置
export const EvidenceTypeSchema = z.enum(["documented", "thematic"]);
export type EvidenceType = z.infer<typeof EvidenceTypeSchema>;

// 联结 schema
export const ConnectionSchema = z.object({
  id: z.string().min(1),
  source_id: z.string().min(1),
  target_id: z.string().min(1),
  shared_theme: ThemeKeySchema,
  connection_type: ConnectionTypeSchema,
  evidence_type: EvidenceTypeSchema,
  connection_explanation: z.string().min(50, "联结解释至少 50 字"),
  evidence_summary: z.string().min(1),
  evidence_sources: z.array(z.string().url()).min(1),
});
export type Connection = z.infer<typeof ConnectionSchema>;

// 主题元数据
export const ThemeSchema = z.object({
  key: ThemeKeySchema,
  zh: z.string(),
  en: z.string(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  description: z.string(),
});
export type Theme = z.infer<typeof ThemeSchema>;
