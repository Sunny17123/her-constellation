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

async function bundleModule(entry) {
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
  return import(pathToFileURL(outfile).href);
}

async function bundleAndLoad(entry) {
  const mod = await bundleModule(entry);
  return mod.default;
}

function postChat(body) {
  return new Request("http://localhost/api/chat", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

function postSearch(body) {
  return new Request("http://localhost/api/search", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

try {
  console.log("[1/4] 打包 api handlers…");
  const persona = await bundleAndLoad("api/persona/[id].ts");
  const chat = await bundleAndLoad("api/chat.ts");
  const search = await bundleAndLoad("api/search.ts");
  const { loadCatalog } = await bundleModule("api/lib/catalog.ts");

  console.log("[2/4] persona 端点断言…");
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

  console.log("[3/4] chat 端点断言…");
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

  console.log("[4/4] search 端点断言…");
  const { people } = loadCatalog();
  const knownIds = new Set(people.map((p) => p.id));
  const validThemes = new Set([
    "education",
    "suffrage",
    "body",
    "labor",
    "science",
    "art_voice",
    "peace_justice",
  ]);

  res = await search(postSearch({ query: "教育" }));
  body = await res.json();
  check(
    "search 教育 -> 200",
    res.status === 200,
    `status=${res.status} body=${JSON.stringify(body).slice(0, 200)}`
  );
  check(
    "确定性模式（无 key 不报错）",
    body.mode === "deterministic"
  );
  check(
    "返回 1..3 条结果",
    Array.isArray(body.results) && body.results.length >= 1 && body.results.length <= 3
  );
  check(
    "结果 person_id 均在目录内",
    body.results?.every((r) => knownIds.has(r.person_id))
  );
  check(
    "结果 themes 均为合法议题",
    body.results?.every((r) => r.themes.every((t) => validThemes.has(t)))
  );
  check(
    "每条含 match_reason 与 snippet",
    body.results?.every(
      (r) =>
        typeof r.match_reason === "string" &&
        r.match_reason.length > 0 &&
        typeof r.snippet === "string"
    )
  );

  res = await search(postSearch({ query: "一个不存在的词xyzzy" }));
  body = await res.json();
  check(
    "零命中 -> 200 回退推荐",
    res.status === 200 && body.mode === "deterministic" && body.results.length >= 1,
    `status=${res.status}`
  );
  check("回退 match_reason 为「为你推荐」", body.results?.[0]?.match_reason === "为你推荐");

  res = await search(postSearch({ query: "   " }));
  check("空白 query -> 400", res.status === 400);

  res = await search(postSearch({ query: "x".repeat(101) }));
  check("超长 query -> 400", res.status === 400);

  res = await search(postSearch({ query: "教育", mode: "deterministic" }));
  body = await res.json();
  check("deterministic 强制 -> 200", res.status === 200 && body.mode === "deterministic");

  res = await search(postSearch({ query: "教育", mode: "llm" }));
  body = await res.json();
  check(
    "llm 强制缺 key -> 503",
    res.status === 503,
    `status=${res.status} body=${JSON.stringify(body).slice(0, 120)}`
  );
  check("503 错误码 not_configured", body.error === "not_configured");

  res = await search(new Request("http://localhost/api/search"));
  check("GET search -> 405", res.status === 405);

  res = await search(
    new Request("http://localhost/api/search", { method: "OPTIONS" })
  );
  check("OPTIONS search -> 204（CORS 预检）", res.status === 204);

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

    console.log("  [live] search 真实检索…");
    res = await search(postSearch({ query: "关于科学与教育的女性" }));
    body = await res.json();
    check(
      "search live -> 200",
      res.status === 200,
      `status=${res.status} body=${JSON.stringify(body).slice(0, 200)}`
    );
    if (res.status === 200) {
      check(
        "live search mode 为 llm 或确定性（不允许报错）",
        body.mode === "llm" || body.mode === "deterministic",
        `mode=${body.mode} reason=${body.llm_skipped_reason}`
      );
      check(
        "live search results 非空且 id 合法",
        Array.isArray(body.results) &&
          body.results.length >= 1 &&
          body.results.every((r) => knownIds.has(r.person_id))
      );
      console.log(
        `  [live] search mode=${body.mode} skipped=${body.llm_skipped_reason ?? "-"} results=${body.results?.map((r) => r.person_id).join(",")}`
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
