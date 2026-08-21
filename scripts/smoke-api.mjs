#!/usr/bin/env node
/**
 * API smoke test（本地验证，无需 vercel CLI）
 *
 * 用 esbuild 把 api handlers 打包成自包含 .mjs（zod + SDK + JSON 全部内联），
 * 再用 Node 原生 Request/Response 直调 handler。
 *
 * 用法：
 *   npm run smoke:api                        # 确定性断言（无需 API key）
 *   ANTHROPIC_API_KEY=xxx npm run smoke:api  # 追加一次真实问答验证
 */
import { build } from "esbuild";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const tmp = mkdtempSync(join(tmpdir(), "hc-api-"));
let failures = 0;

function check(name, cond, detail = "") {
  if (cond) {
    console.log(`  PASS  ${name}`);
  } else {
    failures++;
    console.error(`  FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

async function bundleAndLoad(entry) {
  const outfile = join(tmp, entry.replace(/[/\\[\]]/g, "_") + ".mjs");
  await build({
    entryPoints: [join(root, entry)],
    bundle: true,
    platform: "node",
    format: "esm",
    target: "node20",
    outfile,
    logLevel: "silent",
  });
  const mod = await import(pathToFileURL(outfile).href);
  return mod.default;
}

function postChat(body) {
  return new Request("http://localhost/api/chat", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

try {
  console.log("[1/3] 打包 api handlers…");
  const persona = await bundleAndLoad("api/persona/[id].ts");
  const chat = await bundleAndLoad("api/chat.ts");

  console.log("[2/3] persona 端点断言…");
  let res = await persona(new Request("http://localhost/api/persona/qiu_jin"));
  let body = await res.json();
  check("GET /api/persona/qiu_jin -> 200", res.status === 200, `status=${res.status}`);
  check("响应含 persona_id", body.persona_id === "qiu_jin");
  check("prompt 含人物名", typeof body.prompt === "string" && body.prompt.includes("秋瑾"));
  check("prompt 含对话规则", body.prompt?.includes("【对话规则】"));
  check("prompt 含来源列表", body.prompt?.includes("【来源列表】"));

  res = await persona(new Request("http://localhost/api/persona/nobody"));
  body = await res.json();
  check("GET 未知人物 -> 404", res.status === 404, `status=${res.status}`);
  check("404 错误码", body.error === "persona_not_found");

  res = await persona(
    new Request("http://localhost/api/persona/qiu_jin", { method: "POST" })
  );
  check("POST persona -> 405", res.status === 405);

  console.log("[3/3] chat 端点断言…");
  res = await chat(postChat({ message: "你好", persona_id: "qiu_jin" }));
  body = await res.json();
  check(
    "chat 缺 key -> 503",
    res.status === 503,
    `status=${res.status} body=${JSON.stringify(body).slice(0, 120)}`
  );
  check("503 错误码 not_configured", body.error === "not_configured");

  res = await chat(postChat({ message: "" }));
  check("空 message -> 400", res.status === 400);

  res = await chat(postChat({ message: "x".repeat(1001) }));
  check("超长 message -> 400", res.status === 400);

  res = await chat(new Request("http://localhost/api/chat"));
  check("GET chat -> 405", res.status === 405);

  res = await chat(
    new Request("http://localhost/api/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{bad json", // 原始畸形 JSON（不经 JSON.stringify）
    })
  );
  check("非法 JSON -> 400", res.status === 400);

  if (process.env.ANTHROPIC_API_KEY) {
    console.log("  [live] ANTHROPIC_API_KEY 存在，跑一次真实问答…");
    res = await chat(
      postChat({
        message: "秋瑾是谁？她与萨维特里巴伊·菲勒有什么呼应？",
      })
    );
    body = await res.json();
    check(
      "chat live -> 200",
      res.status === 200,
      `status=${res.status} body=${JSON.stringify(body).slice(0, 200)}`
    );
    if (res.status === 200) {
      check(
        "live answer_md 非空",
        typeof body.answer_md === "string" && body.answer_md.length > 0
      );
      check(
        "live citations 合法",
        Array.isArray(body.citations) && body.citations.length >= 1
      );
      console.log(
        "  [live] citations:",
        JSON.stringify(body.citations, null, 2).slice(0, 800)
      );
    }
  } else {
    console.log(
      "  [skip] 未设置 ANTHROPIC_API_KEY，跳过真实问答（设置后重跑可验证 live 路径）"
    );
  }
} catch (e) {
  failures++;
  console.error("  执行异常:", e);
} finally {
  rmSync(tmp, { recursive: true, force: true });
}

if (failures > 0) {
  console.error(`\n${failures} 项失败`);
  process.exit(1);
}
console.log("\n全部通过");
