import { z } from "zod";
import Anthropic from "@anthropic-ai/sdk";
import {
  runSearch,
  NotConfiguredError,
  ModelOutputError,
} from "./lib/search-core.ts";
import { json } from "./lib/http.ts";

/**
 * POST /api/search — RAG 检索 endpoint（「我想探索一个主题」）
 *
 * 请求体：{ query: string(1..100), mode?: "auto" | "deterministic" | "llm" }
 * - auto（默认）：有 key 时 Claude 语义重排，任何失败自动降级确定性检索
 * - deterministic：只走本地关键词/议题匹配（零 AI、无需 key）
 * - llm：强制 Claude，失败按错误码返回
 *
 * 部署要求：Vercel 环境变量 ANTHROPIC_API_KEY（可选 MODEL，默认 claude-sonnet-5）
 */

export const maxDuration = 60;

const SearchRequestSchema = z.object({
  query: z.string().trim().min(1).max(100),
  mode: z.enum(["auto", "deterministic", "llm"]).optional().default("auto"),
});

export default async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") return json(null, 204);
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json({ error: "invalid_json" }, 400);
  }

  const parsed = SearchRequestSchema.safeParse(body);
  if (!parsed.success) {
    return json({ error: "invalid_request", details: parsed.error.issues }, 400);
  }

  try {
    const result = await runSearch(parsed.data.query, parsed.data.mode);
    return json(result);
  } catch (e) {
    if (e instanceof NotConfiguredError) {
      return json({ error: "not_configured", message: e.message }, 503);
    }
    if (e instanceof Anthropic.RateLimitError) {
      return json({ error: "rate_limited" }, 429);
    }
    if (e instanceof Anthropic.AuthenticationError) {
      return json({ error: "auth_failed" }, 503);
    }
    if (e instanceof Anthropic.APIError) {
      return json({ error: "upstream_error", status: e.status }, 502);
    }
    if (e instanceof ModelOutputError) {
      return json({ error: "model_output_error", message: e.message }, 502);
    }
    return json({ error: "internal_error" }, 500);
  }
}
