import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { loadCatalog, getPersonById, buildCatalogBlock } from "./catalog.js";
import { GUARDRAILS_BLOCK, GENERAL_SYSTEM } from "./guardrails.js";
import { buildPersonaPrompt } from "./persona.js";

/**
 * L2 问答核心
 *
 * - 全目录注入（3 人规模无需工具检索；>200 人时按方案引入 embeddings/BM25）
 * - structured output（手写 JSON Schema）强制引用卡结构；响应再用项目 zod v3 本地校验
 *   （不用 SDK 的 zodOutputFormat helper —— 它绑定 zod/v4，与本项目 zod 3 混用有风险）
 * - 引用数据集成员资格交叉核对（防引用幻觉）
 * - 非流式（方案允许：单轮 2-5s 可接受）
 * - prompt caching：system 双断点（护栏+目录 / persona），前缀确定排序、无时间戳
 */

export const CitationSchema = z.object({
  person_id: z.string().min(1),
  source_url: z.string().url(),
  quote: z.string().min(1).max(300),
});

export const AnswerSchema = z.object({
  answer_md: z.string().min(1),
  citations: z.array(CitationSchema).min(1).max(8),
});

export type ChatAnswer = z.infer<typeof AnswerSchema>;

// structured output 的 JSON Schema（与 AnswerSchema 对应，手写保持版本无关）
const ANSWER_JSON_SCHEMA = {
  type: "object",
  properties: {
    answer_md: { type: "string", description: "回答正文，Markdown 格式" },
    citations: {
      type: "array",
      minItems: 1,
      maxItems: 8,
      items: {
        type: "object",
        properties: {
          person_id: {
            type: "string",
            description: "引用的人物 id（目录中 person 的 id）",
          },
          source_url: {
            type: "string",
            description: "来源 URL，必须来自该人物目录中的来源列表",
          },
          quote: {
            type: "string",
            description: "被引用事实的原文摘录，不超过 300 字",
          },
        },
        required: ["person_id", "source_url", "quote"],
        additionalProperties: false,
      },
    },
  },
  required: ["answer_md", "citations"],
  additionalProperties: false,
} as const;

export class NotConfiguredError extends Error {}
export class UnknownPersonaError extends Error {}
export class ModelOutputError extends Error {}

export async function runChat(
  question: string,
  personaId?: string
): Promise<ChatAnswer> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new NotConfiguredError("ANTHROPIC_API_KEY 未配置");

  const client = new Anthropic({ apiKey });
  const { people, connections } = loadCatalog();

  const system: Anthropic.TextBlockParam[] = [
    {
      type: "text",
      text: GUARDRAILS_BLOCK + "\n\n" + buildCatalogBlock(people, connections),
      cache_control: { type: "ephemeral" },
    },
  ];

  if (personaId) {
    const person = getPersonById(personaId);
    if (!person) throw new UnknownPersonaError(personaId);
    system.push({
      type: "text",
      text: buildPersonaPrompt(person),
      cache_control: { type: "ephemeral" },
    });
  } else {
    system.push({ type: "text", text: GENERAL_SYSTEM });
  }

  const response = await client.messages.create({
    model: process.env.MODEL || "claude-sonnet-5",
    max_tokens: 4000,
    system,
    output_config: {
      format: { type: "json_schema", schema: ANSWER_JSON_SCHEMA },
    },
    messages: [{ role: "user", content: question }],
  });

  if (response.stop_reason === "max_tokens") {
    throw new ModelOutputError("回答被截断（max_tokens）");
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

  const parsed = AnswerSchema.safeParse(raw);
  if (!parsed.success) {
    throw new ModelOutputError("模型输出不符合响应结构：" + parsed.error.message);
  }

  // 引用数据集成员资格交叉核对（防引用幻觉）
  for (const c of parsed.data.citations) {
    const p = getPersonById(c.person_id);
    if (!p) throw new ModelOutputError(`引用未知人物: ${c.person_id}`);
    if (!p.source_urls.includes(c.source_url)) {
      throw new ModelOutputError(`引用来源不在数据集中: ${c.source_url}`);
    }
  }

  return parsed.data;
}
