/**
 * 统一 JSON 响应助手
 *
 * 带上宽松 CORS 头：生产环境前后端同源不需要，但方便队友在
 * localhost:5173 直连已部署的 /api 联调。
 */

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "content-type",
};

export function json(data: unknown, status = 200): Response {
  return Response.json(data, { status, headers: CORS_HEADERS });
}
