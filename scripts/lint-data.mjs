#!/usr/bin/env node
/**
 * SHESHAPES · 数据校验脚本
 *
 * 用法：node scripts/lint-data.mjs
 *
 * 校验规则（与 PRODUCT_BRIEF §4 对齐）：
 * 1. stories.json / connections.json 必须是合法 JSON
 * 2. 每位女性的 id 必须唯一、全小写蛇形
 * 3. themes 必须从固定枚举中选 1–3 个
 * 4. coordinates 必须 lat ∈ [-90,90], lng ∈ [-180,180]
 * 5. source_urls 至少 2 条
 * 6. connections 的 source_id / target_id 必须存在于 stories
 * 7. connections 的 shared_theme 必须 ∈ 双方 themes 交集
 * 8. connections 的 source ≠ target
 * 9. 每位女性至少 1 条联结（避免孤岛）
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const VALID_THEMES = new Set([
  "education",
  "suffrage",
  "body",
  "labor",
  "science",
  "art_voice",
  "peace_justice",
]);

const VALID_CONNECTION_TYPES = new Set([
  "cross_region",
  "cross_era",
  "cross_both",
  "direct_lineage",
]);

const errors = [];
const warnings = [];

function err(msg) {
  errors.push(msg);
}
function warn(msg) {
  warnings.push(msg);
}

// ---------- 加载 ----------
let stories, connections;
try {
  stories = JSON.parse(readFileSync(join(root, "data/stories.json"), "utf8"));
} catch (e) {
  err(`stories.json 解析失败: ${e.message}`);
}
try {
  connections = JSON.parse(
    readFileSync(join(root, "data/connections.json"), "utf8")
  );
} catch (e) {
  err(`connections.json 解析失败: ${e.message}`);
}

if (errors.length > 0) {
  reportAndExit();
}

// ---------- 校验 stories ----------
const storyIds = new Set();
const snakeCaseRe = /^[a-z][a-z0-9_]*$/;

stories.forEach((s, i) => {
  const tag = `stories[${i}] (${s.id ?? "未命名"})`;

  if (!s.id) return err(`${tag} 缺少 id`);
  if (!snakeCaseRe.test(s.id)) err(`${tag} id 必须全小写蛇形: ${s.id}`);
  if (storyIds.has(s.id)) err(`${tag} id 重复: ${s.id}`);
  storyIds.add(s.id);

  if (!s.name_zh) err(`${tag} 缺少 name_zh`);
  if (!s.name_en) err(`${tag} 缺少 name_en`);
  if (!s.time_period) err(`${tag} 缺少 time_period`);
  if (!s.region_zh) err(`${tag} 缺少 region_zh`);

  if (!s.coordinates || typeof s.coordinates.lat !== "number" || typeof s.coordinates.lng !== "number") {
    err(`${tag} coordinates 缺失或非法`);
  } else {
    const { lat, lng } = s.coordinates;
    if (lat < -90 || lat > 90) err(`${tag} lat 越界: ${lat}`);
    if (lng < -180 || lng > 180) err(`${tag} lng 越界: ${lng}`);
  }

  if (!Array.isArray(s.themes) || s.themes.length === 0) {
    err(`${tag} themes 必须是非空数组`);
  } else {
    if (s.themes.length > 3) warn(`${tag} themes 超过 3 个: ${s.themes.length}`);
    s.themes.forEach((t) => {
      if (!VALID_THEMES.has(t)) err(`${tag} 非法 theme: "${t}"`);
    });
  }

  if (!s.short_story || s.short_story.length < 100) {
    warn(`${tag} short_story 太短（<100 字）`);
  }
  if (s.short_story && s.short_story.length > 500) {
    warn(`${tag} short_story 过长（>500 字），建议精简`);
  }

  if (!s.why_visible) warn(`${tag} 缺少 why_visible`);
  if (!s.relevance_today) warn(`${tag} 缺少 relevance_today`);

  if (!Array.isArray(s.source_urls) || s.source_urls.length < 2) {
    err(`${tag} source_urls 至少 2 条`);
  }
});

// ---------- 校验 connections ----------
const connIds = new Set();
const linkedStoryIds = new Set();

connections.forEach((c, i) => {
  const tag = `connections[${i}] (${c.id ?? "未命名"})`;

  if (!c.id) return err(`${tag} 缺少 id`);
  if (connIds.has(c.id)) err(`${tag} id 重复: ${c.id}`);
  connIds.add(c.id);

  if (!c.source_id || !c.target_id) {
    err(`${tag} 缺少 source_id 或 target_id`);
    return;
  }
  if (c.source_id === c.target_id) err(`${tag} 不能自连: ${c.source_id}`);
  if (!storyIds.has(c.source_id)) err(`${tag} source_id 不存在: ${c.source_id}`);
  if (!storyIds.has(c.target_id)) err(`${tag} target_id 不存在: ${c.target_id}`);

  if (storyIds.has(c.source_id)) linkedStoryIds.add(c.source_id);
  if (storyIds.has(c.target_id)) linkedStoryIds.add(c.target_id);

  if (!VALID_CONNECTION_TYPES.has(c.connection_type)) {
    err(`${tag} 非法 connection_type: "${c.connection_type}"`);
  }

  // shared_theme 必须 ∈ 双方 themes 交集
  const src = stories.find((s) => s.id === c.source_id);
  const tgt = stories.find((s) => s.id === c.target_id);
  if (src && tgt) {
    const intersection = src.themes.filter((t) => tgt.themes.includes(t));
    if (!intersection.includes(c.shared_theme)) {
      err(
        `${tag} shared_theme "${c.shared_theme}" 不在双方 themes 交集中 ` +
        `(src=[${src.themes}], tgt=[${tgt.themes}], 交集=[${intersection}])`
      );
    }
  }

  if (!c.connection_explanation || c.connection_explanation.length < 50) {
    warn(`${tag} connection_explanation 太短（<50 字）`);
  }
  if (!Array.isArray(c.evidence_sources) || c.evidence_sources.length < 1) {
    err(`${tag} evidence_sources 至少 1 条`);
  }
});

// ---------- 孤岛检测 ----------
storyIds.forEach((id) => {
  if (!linkedStoryIds.has(id)) {
    warn(`孤岛人物（没有任何联结）: ${id}`);
  }
});

// ---------- 汇总 ----------
reportAndExit();

function reportAndExit() {
  console.log("\n========== SHESHAPES 数据校验 ==========\n");
  console.log(`人物数: ${stories?.length ?? 0}`);
  console.log(`联结数: ${connections?.length ?? 0}`);
  console.log(`议题覆盖: ${new Set(stories?.flatMap((s) => s.themes) ?? []).size} / ${VALID_THEMES.size}`);
  console.log("");

  if (errors.length > 0) {
    console.log(`❌ 错误 ${errors.length} 条：`);
    errors.forEach((e) => console.log(`   - ${e}`));
    console.log("");
  }
  if (warnings.length > 0) {
    console.log(`⚠️  警告 ${warnings.length} 条：`);
    warnings.forEach((w) => console.log(`   - ${w}`));
    console.log("");
  }
  if (errors.length === 0 && warnings.length === 0) {
    console.log("✅ 数据全部通过校验\n");
  } else if (errors.length === 0) {
    console.log("✅ 无错误（有警告建议处理）\n");
  }
  process.exit(errors.length > 0 ? 1 : 0);
}
