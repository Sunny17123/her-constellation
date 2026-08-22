import { z } from "zod";
import Anthropic from "@anthropic-ai/sdk";
import {
  runChat,
  NotConfiguredError,
  UnknownPersonaError,
  ModelOutputError,
} from "./lib/chat-core.js";
import { json } from "./lib/http.js";

/**
 * POST /api/chat — L2 运行时问答 endpoint
 *
 * 请求体：{ message: string, persona_id?: string }
 * - 无 persona_id：通用目录问答（第三人称）
 * - 带 persona_id：角色对话模式（第一人称，persona prompt 见 api/lib/persona.ts）
 *
 * 部署要求：Vercel 环境变量 ANTHROPIC_API_KEY（可选 MODEL，默认 claude-sonnet-5）
 */

export const maxDuration = 60;

const ChatRequestSchema = z.object({
  message: z.string().min(1).max(1000),
  persona_id: z.string().regex(/^[a-z][a-z0-9_]*$/).optional(),
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

  const parsed = ChatRequestSchema.safeParse(body);
  if (!parsed.success) {
    return json({ error: "invalid_request", details: parsed.error.issues }, 400);
  }

  try {
    const answer = await runChat(parsed.data.message, parsed.data.persona_id);
    return json({ ...answer, model: process.env.MODEL || "claude-sonnet-5" });
  } catch (e) {
    if (e instanceof NotConfiguredError) {
      return json({ error: "not_configured", message: e.message }, 503);
    }
    if (e instanceof UnknownPersonaError) {
      return json({ error: "persona_not_found", persona_id: e.message }, 404);
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
