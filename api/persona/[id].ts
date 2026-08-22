import { getPersonById } from "../lib/catalog.ts";
import { buildPersonaPrompt } from "../lib/persona.ts";
import { json } from "../lib/http.ts";

/**
 * GET /api/persona/:id — 返回人物的完整 persona prompt
 *
 * 纯模板生成、零 AI 调用（模板参考 docs/PERSONA_PROMPT_EXAMPLE_qiu_jin.md）。
 * 前端拿到 prompt 后可直接注入 system 与人物对话，或改用
 * POST /api/chat { persona_id } 由服务端组装。
 *
 * Vercel 文件路由：/api/persona/[id].ts 匹配 /api/persona/*，
 * 路径参数需自行从 URL pathname 解析（无 Next.js 式 params 对象）。
 */

const ID_PATH = /^\/api\/persona\/([a-z0-9_]+)\/?$/;

export default function handler(req: Request): Response {
  if (req.method === "OPTIONS") return json(null, 204);
  if (req.method !== "GET") return json({ error: "method_not_allowed" }, 405);

  const m = ID_PATH.exec(new URL(req.url).pathname);
  if (!m) return json({ error: "invalid_path" }, 400);

  const person = getPersonById(decodeURIComponent(m[1]));
  if (!person) return json({ error: "persona_not_found" }, 404);

  return json({
    persona_id: person.id,
    name_zh: person.name_zh,
    name_en: person.name_en,
    prompt: buildPersonaPrompt(person),
  });
}
