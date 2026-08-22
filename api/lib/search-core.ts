import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import type { Person, Connection, ThemeKey } from "../../src/data/schema.js";
import { THEMES } from "../../data/themes.js";
import { loadCatalog, getPersonById, buildCatalogBlock } from "./catalog.js";

/**
 * RAG 检索核心（「我想探索一个主题」）
 *
 * 分层（对齐 PLAN_v1 §2.5 L0/L1/L2）：
 * - L0 确定性检索：纯本地打分，零 AI、无需 API key —— 永远可用
 * - L1 Claude 重排：语义理解 + 每条一行匹配理由（有 key 时），
 *   auto 模式下任何失败自动降级回 L0，演示永不死路
 *
 * 规模说明：3 人目录直接全文注入（同 chat-core）；40-50 人仍可行，
 * >200 人时按方案引入 embeddings/BM25。
 */

// ---------- 别名表：常见中文关键词 → 议题 key ----------
const ALIAS_TO_THEME: Record<string, ThemeKey> = {
  学科: "science",
  学术: "science",
  科学: "science",
  数学: "science",
  天文: "science",
  哲学: "science",
  创作: "art_voice",
  写作: "art_voice",
  出版: "art_voice",
  文学: "art_voice",
  诗歌: "art_voice",
  艺术: "art_voice",
  发声: "art_voice",
  教育: "education",
  教书: "education",
  学校: "education",
  识字: "education",
  老师: "education",
  教师: "education",
  读书: "education",
  投票: "suffrage",
  参政: "suffrage",
  平权: "suffrage",
  身体: "body",
  生育: "body",
  童婚: "body",
  裹脚: "body",
  劳工: "labor",
  工作: "labor",
  职场: "labor",
  同工同酬: "labor",
  和平: "peace_justice",
  战争: "peace_justice",
  正义: "peace_justice",
  人权: "peace_justice",
};

export type SearchMode = "auto" | "deterministic" | "llm";

export interface SearchResult {
  person_id: string;
  name_zh: string;
  name_en: string;
  time_period: string;
  region_zh: string;
  themes: ThemeKey[];
  starter_score: number;
  /** 确定性阶段命中的议题 key（llm 模式下可能为 null） */
  matched_theme: ThemeKey | null;
  /** short_story 中与关键词/议题最相关的一句话 */
  snippet: string;
  /** 匹配理由：确定性为「议题匹配：教育权」，llm 为模型输出的一行理由 */
  match_reason: string;
  score: number;
}

export interface SearchResponse {
  mode: "deterministic" | "llm";
  /** llm 尝试过但被跳过时给出原因（no_api_key / rate_limited / llm_error / no_llm_match） */
  llm_skipped_reason?: string;
  results: SearchResult[];
}

export class NotConfiguredError extends Error {}
export class ModelOutputError extends Error {}

// ---------- L0：确定性检索 ----------

/** 查询命中的议题 key 集合（别名 + 中英文名 + 描述子串） */
function themeMatchKeys(query: string): ThemeKey[] {
  const matched = new Set<ThemeKey>();
  for (const [word, key] of Object.entries(ALIAS_TO_THEME)) {
    if (query.includes(word)) matched.add(key);
  }
  const qLower = query.toLowerCase();
  for (const theme of Object.values(THEMES)) {
    if (query.includes(theme.zh) || theme.zh.includes(query)) {
      matched.add(theme.key);
      continue;
    }
    if (
      theme.en.toLowerCase().includes(qLower) ||
      qLower.includes(theme.en.toLowerCase())
    ) {
      matched.add(theme.key);
      continue;
    }
    // 描述短语命中（如「创办学校」→ education）
    if (query.length >= 2 && theme.description.includes(query)) {
      matched.add(theme.key);
    }
  }
  return [...matched];
}

/** 抽取 short_story 中与关键词/议题最相关的一句话（兜底第一句） */
function extractSnippet(
  person: Person,
  query: string,
  matchedTheme: ThemeKey | null
): string {
  const sentences = person.short_story
    .split(/[。！？；]/)
    .map((s) => s.trim())
    .filter(Boolean);
  const target = matchedTheme ? THEMES[matchedTheme].zh : query;
  const hit = sentences.find((s) => s.includes(target)) ?? sentences[0] ?? "";
  return hit.length > 120 ? hit.slice(0, 120) + "…" : hit;
}

/**
 * 确定性检索：对目录逐人打分，返回按相关度排序的至多 3 条结果。
 * 零命中时回退 top-3 starter_score（镜像 surpriseMe 精选池逻辑）。
 */
export function deterministicSearch(
  query: string,
  people: Person[]
): SearchResult[] {
  const matchedThemes = themeMatchKeys(query);
  const qLower = query.toLowerCase();
  const scored: SearchResult[] = [];

  for (const p of people) {
    let score = 0;
    const personMatched = p.themes.filter((t) => matchedThemes.includes(t));
    score += personMatched.length * 10;

    // 姓名 / 地域命中
    if (p.name_zh.includes(query) || p.name_en.toLowerCase().includes(qLower)) {
      score += 8;
    }
    if (
      p.region_zh.includes(query) ||
      p.region_en.toLowerCase().includes(qLower)
    ) {
      score += 6;
    }
    // 正文命中
    for (const field of [p.short_story, p.why_visible, p.relevance_today]) {
      if (field.includes(query)) score += 2;
    }

    if (score <= 0) continue;

    const matchedTheme = personMatched[0] ?? null;
    const matchReason =
      personMatched.length > 0
        ? `议题匹配：${personMatched.map((t) => THEMES[t].zh).join("、")}`
        : p.name_zh.includes(query) || p.name_en.toLowerCase().includes(qLower)
          ? "姓名匹配"
          : p.region_zh.includes(query) ||
              p.region_en.toLowerCase().includes(qLower)
            ? "地域匹配"
            : "故事内容相关";

    scored.push({
      person_id: p.id,
      name_zh: p.name_zh,
      name_en: p.name_en,
      time_period: p.time_period,
      region_zh: p.region_zh,
      themes: p.themes,
      starter_score: p.starter_score ?? 5,
      matched_theme: matchedTheme,
      snippet: extractSnippet(p, query, matchedTheme),
      match_reason: matchReason,
      score,
    });
  }

  scored.sort(
    (a, b) => b.score - a.score || b.starter_score - a.starter_score
  );
  if (scored.length > 0) return scored.slice(0, 3);

  // 零命中：回退精选池 top-3
  const fallback = [...people].sort(
    (a, b) => (b.starter_score ?? 5) - (a.starter_score ?? 5)
  );
  return fallback.slice(0, 3).map((p) => ({
    person_id: p.id,
    name_zh: p.name_zh,
    name_en: p.name_en,
    time_period: p.time_period,
    region_zh: p.region_zh,
    themes: p.themes,
    starter_score: p.starter_score ?? 5,
    matched_theme: null,
    snippet: extractSnippet(p, query, null),
    match_reason: "为你推荐",
    score: 0,
  }));
}

// ---------- L1：Claude 语义重排 ----------

const SEARCH_SYSTEM = `你是一座"女性故事星图"的策展助手。用户想探索一个主题/关键词，你要从上方目录中选出与其最相关的至多 3 位女性。
规则：
1. 只从目录中选择，只能返回目录中存在的 person id
2. 按相关度排序，最多 3 位；目录中确实没有相关人物时返回空数组
3. 每位给出一行理由（不超过 60 字），说明她与关键词的关联
4. 理由语气克制、基于目录事实，不神化人物`;

// structured output 的 JSON Schema（与 zod 校验对应，手写保持版本无关）
const SEARCH_JSON_SCHEMA = {
  type: "object",
  properties: {
    results: {
      type: "array",
      maxItems: 3,
      items: {
        type: "object",
        properties: {
          person_id: {
            type: "string",
            description: "目录中的人物 id",
          },
          reason: {
            type: "string",
            description: "一行匹配理由，不超过 60 字",
          },
        },
        required: ["person_id", "reason"],
        additionalProperties: false,
      },
    },
  },
  required: ["results"],
  additionalProperties: false,
} as const;

const LLM_RESULT_SCHEMA = z.object({
  results: z
    .array(
      z.object({
        person_id: z.string().min(1),
        reason: z.string().min(1).max(120),
      })
    )
    .max(3),
});

/** Claude 语义检索：返回按相关度排序的 { person_id, reason } 列表（0..3 条） */
async function llmSearch(
  query: string,
  people: Person[],
  connections: Connection[]
): Promise<{ person_id: string; reason: string }[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new NotConfiguredError("ANTHROPIC_API_KEY 未配置");

  const client = new Anthropic({ apiKey });
  const response = await client.messages.create({
    model: process.env.MODEL || "claude-sonnet-5",
    max_tokens: 1000,
    system: [
      {
        type: "text",
        text: buildCatalogBlock(people, connections),
        cache_control: { type: "ephemeral" },
      },
      {
        type: "text",
        text: SEARCH_SYSTEM,
        cache_control: { type: "ephemeral" },
      },
    ],
    output_config: {
      format: { type: "json_schema", schema: SEARCH_JSON_SCHEMA },
    },
    messages: [{ role: "user", content: `关键词/主题：${query}` }],
  });

  if (response.stop_reason === "max_tokens") {
    throw new ModelOutputError("搜索输出被截断（max_tokens）");
  }

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new ModelOutputError("模型未返回文本内容");
  }

  let raw: unknown;
  try {
    raw = JSON.parse(textBlock.text);
  } catch {
    throw new ModelOutputError("模型输出不是合法 JSON");
  }

  const parsed = LLM_RESULT_SCHEMA.safeParse(raw);
  if (!parsed.success) {
    throw new ModelOutputError("模型输出不符合响应结构：" + parsed.error.message);
  }

  // 反幻觉：person_id 必须存在于目录
  const known = new Set(people.map((p) => p.id));
  for (const r of parsed.data.results) {
    if (!known.has(r.person_id)) {
      throw new ModelOutputError(`模型返回未知人物: ${r.person_id}`);
    }
  }

  return parsed.data.results;
}

// ---------- 编排 ----------

/**
 * 分层检索入口。
 *
 * - deterministic：只走 L0
 * - llm：强制走 Claude，失败原样抛出（由 api/search.ts 映射错误码）
 * - auto：先试 Claude，任何失败/无结果降级回 L0，附 llm_skipped_reason
 */
export async function runSearch(
  query: string,
  mode: SearchMode = "auto"
): Promise<SearchResponse> {
  const { people, connections } = loadCatalog();
  const deterministic = deterministicSearch(query, people);

  if (mode === "deterministic") {
    return { mode: "deterministic", results: deterministic };
  }

  try {
    const picks = await llmSearch(query, people, connections);
    if (picks.length === 0) {
      // 模型认为目录中无相关人物 → 回退确定性结果
      return {
        mode: "llm",
        llm_skipped_reason: "no_llm_match",
        results: deterministic,
      };
    }

    // 不足 3 条时用确定性结果补足，保证「3 张卡片」体验
    if (picks.length < 3) {
      const picked = new Set(picks.map((p) => p.person_id));
      for (const d of deterministic) {
        if (picked.size >= 3) break;
        if (!picked.has(d.person_id)) {
          picked.add(d.person_id);
          picks.push({ person_id: d.person_id, reason: d.match_reason });
        }
      }
    }

    const detByPerson = new Map(
      deterministic.map((r) => [r.person_id, r])
    );
    const results: SearchResult[] = picks.map((pick) => {
      const person = getPersonById(pick.person_id)!;
      const det = detByPerson.get(pick.person_id);
      return {
        person_id: person.id,
        name_zh: person.name_zh,
        name_en: person.name_en,
        time_period: person.time_period,
        region_zh: person.region_zh,
        themes: person.themes,
        starter_score: person.starter_score ?? 5,
        matched_theme: det?.matched_theme ?? null,
        snippet: det?.snippet ?? extractSnippet(person, query, null),
        match_reason: pick.reason,
        score: det?.score ?? 0,
      };
    });
    return { mode: "llm", results };
  } catch (e) {
    if (mode === "llm") throw e;
    // auto：降级回确定性结果，附降级原因（演示永不死路）
    const reason =
      e instanceof NotConfiguredError
        ? "no_api_key"
        : e instanceof Anthropic.RateLimitError
          ? "rate_limited"
          : "llm_error";
    return {
      mode: "deterministic",
      llm_skipped_reason: reason,
      results: deterministic,
    };
  }
}
