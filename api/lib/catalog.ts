import { z } from "zod";
import {
  PersonSchema,
  ConnectionSchema,
  type Person,
  type Connection,
} from "../../src/data/schema.ts";
import { THEMES } from "../../data/themes.ts";
import storiesJson from "../../data/stories.json";
import connectionsJson from "../../data/connections.json";

/**
 * 服务端数据目录（Vercel Function 运行时装载）
 *
 * - JSON 由 esbuild 构建期内联，无运行时文件路径问题
 * - zod 校验复用 src/data/schema.ts（schema 单一事实源，见团队协作文档协调点 4）
 * - 目录注入文本按 id 确定排序、无时间戳 —— prompt cache 前缀稳定
 */

let peopleCache: Person[] | null = null;
let connectionsCache: Connection[] | null = null;

export function loadCatalog(): { people: Person[]; connections: Connection[] } {
  if (!peopleCache || !connectionsCache) {
    peopleCache = z.array(PersonSchema).parse(storiesJson);
    connectionsCache = z.array(ConnectionSchema).parse(connectionsJson);
  }
  return { people: peopleCache, connections: connectionsCache };
}

export function getPersonById(id: string): Person | null {
  return loadCatalog().people.find((p) => p.id === id) ?? null;
}

function themeZh(key: string): string {
  return THEMES[key as keyof typeof THEMES]?.zh ?? key;
}

/**
 * 全目录注入文本（system prompt 第一部分）
 * 覆盖：人物（时代/地域/议题/故事/当代关联/来源）+ 联结（议题/类型/解释/证据）
 */
export function buildCatalogBlock(
  people: Person[],
  connections: Connection[]
): string {
  const sortedPeople = [...people].sort((a, b) => a.id.localeCompare(b.id));
  const sortedConns = [...connections].sort((a, b) => a.id.localeCompare(b.id));

  const personBlocks = sortedPeople.map((p) => {
    const sources = p.source_urls
      .map((u, i) => `  ${i + 1}. ${u}`)
      .join("\n");
    return [
      `## ${p.name_zh}（id: ${p.id}）`,
      `- 英文名：${p.name_en}`,
      `- 年代：${p.time_period}`,
      `- 地域：${p.region_zh}`,
      `- 议题：${p.themes.map(themeZh).join("、")}`,
      `- 故事：${p.short_story}`,
      `- 为什么值得被看见：${p.why_visible}`,
      `- 与当代的关联：${p.relevance_today}`,
      `- 来源：\n${sources}`,
    ].join("\n");
  });

  const connectionBlocks = sortedConns.map((c) => {
    return [
      `## 联结 ${c.id}`,
      `- ${c.source_id} ↔ ${c.target_id}（议题：${themeZh(c.shared_theme)}，类型：${c.connection_type}）`,
      `- 解释：${c.connection_explanation}`,
      `- 证据：${c.evidence_summary}`,
      `- 证据来源：${c.evidence_sources.join("、")}`,
    ].join("\n");
  });

  return ["# 人物目录", ...personBlocks, "# 联结目录", ...connectionBlocks].join(
    "\n\n"
  );
}
