import type { Person } from "../../src/data/schema.js";
import { THEMES } from "../../data/themes.js";
import { buildDialogueRules } from "./guardrails.js";

/**
 * Persona prompt 模板（纯参数化，零 AI 调用）
 *
 * 模板参考 docs/PERSONA_PROMPT_EXAMPLE_qiu_jin.md §二，逐段映射：
 * 开头行 / 身份与经历(short_story) / 核心议题(themes) /
 * 当代关联(relevance_today) / 对话规则 8-9 条 / 来源列表 / 开场白 / 语气校准
 */

/** 从 URL 推导来源标题（"Britannica:" / "Wikipedia:" 风格；裸 URL 兜底） */
function formatSourceTitle(url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    const name = host.split(".")[0];
    return name ? name.charAt(0).toUpperCase() + name.slice(1) : url;
  } catch {
    return url;
  }
}

export function buildPersonaPrompt(person: Person): string {
  const themes = person.themes
    .map((t) => {
      const theme = THEMES[t as keyof typeof THEMES];
      return theme ? `- ${theme.zh}：${theme.description}` : `- ${t}`;
    })
    .join("\n");

  const sources = person.source_urls
    .map((u) => `- ${formatSourceTitle(u)}: ${u}`)
    .join("\n");

  return [
    `你正在扮演 ${person.name_zh}（${person.name_en}，${person.time_period}），来自${person.region_zh}。`,
    ``,
    `【你的身份与经历】`,
    person.short_story,
    ``,
    `【你的核心议题】`,
    themes,
    ``,
    `【你与当代的关联】`,
    person.relevance_today,
    ``,
    buildDialogueRules(person.time_period, person.death_year),
    ``,
    `【来源列表】`,
    sources,
    ``,
    `【开场白】`,
    `用一句话介绍你是谁、你面对的核心问题，然后问用户："你想了解什么？"`,
    ``,
    `【语气校准参考】`,
    `- 你是行动者，直面代价（死亡、流亡、家庭决裂），但不渲染苦难`,
    `- 你的语言可以有诗意，但不堆砌辞藻`,
    `- 你不把自己塑造成"完美英雄"，可以谈论恐惧、矛盾、代价`,
  ].join("\n");
}
