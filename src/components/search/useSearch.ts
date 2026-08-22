import { useCallback, useEffect, useRef, useState } from "react";

/**
 * 「我想探索一个主题」搜索状态机
 *
 * - 300ms 防抖自动搜索 + 回车/按钮立即搜索（同 query 不重复请求）
 * - AbortController 取消过期请求
 * - 错误码 → 中文文案；llm 降级给出轻提示（不打断体验）
 * - 状态仅组件内局部，无其它消费者，不上 context
 */

/**
 * API 基址：生产同源留空；本地联调已部署 API 时设 VITE_API_BASE（CORS 已放开，
 * 见 docs/INTEGRATION_NOTES_ruofan.md §4 的既有约定）
 */
const API_BASE = (
  (import.meta.env.VITE_API_BASE as string | undefined) ?? ""
).replace(/\/$/, "");

/** 与 api/search.ts 响应对应（后端已 zod 校验，前端按结构消费） */
export interface SearchResultItem {
  person_id: string;
  name_zh: string;
  name_en: string;
  time_period: string;
  region_zh: string;
  themes: string[];
  starter_score: number;
  matched_theme: string | null;
  snippet: string;
  match_reason: string;
  score: number;
}

export type SearchStatus = "idle" | "loading" | "success" | "error";

const ERROR_MESSAGES: Record<string, string> = {
  rate_limited: "请求过于频繁，稍后再试试",
  not_configured: "AI 助手尚未配置，先用关键词匹配",
  upstream_error: "AI 服务暂时不可用",
  model_output_error: "AI 输出异常",
  invalid_request: "请输入有效关键词",
};

export interface UseSearchOptions {
  /** 每次搜索成功后回调（用于移动端自动打开结果抽屉） */
  onResults?: () => void;
}

export function useSearch(options?: UseSearchOptions) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [status, setStatus] = useState<SearchStatus>("idle");
  const [notice, setNotice] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const lastRunRef = useRef<string>("");
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const runSearch = useCallback(async (q: string) => {
    const trimmed = q.trim();
    lastRunRef.current = trimmed;
    if (!trimmed) {
      abortRef.current?.abort();
      setResults([]);
      setStatus("idle");
      setNotice(null);
      setErrorMsg(null);
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setStatus("loading");
    setErrorMsg(null);

    try {
      const res = await fetch(`${API_BASE}/api/search`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ query: trimmed }),
        signal: controller.signal,
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        setStatus("error");
        setErrorMsg(
          ERROR_MESSAGES[body?.error as string] ?? "搜索失败，请稍后再试"
        );
        return;
      }
      setResults(body?.results ?? []);
      setNotice(
        body?.llm_skipped_reason
          ? "今天 AI 助手休息了，先用关键词匹配"
          : null
      );
      setStatus("success");
      optionsRef.current?.onResults?.();
    } catch (e) {
      if ((e as Error).name === "AbortError") return; // 已被更新的搜索取代
      setStatus("error");
      setErrorMsg("网络异常，请检查连接");
    }
  }, []);

  // 300ms 防抖自动搜索（已立即执行过的 query 不重复请求）
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      runSearch("");
      return;
    }
    if (lastRunRef.current === trimmed) return;
    const timer = setTimeout(() => runSearch(trimmed), 300);
    return () => clearTimeout(timer);
  }, [query, runSearch]);

  // 卸载时取消在途请求
  useEffect(() => () => abortRef.current?.abort(), []);

  /** 立即搜索（回车/点击「探索」） */
  const submit = useCallback(() => {
    if (query.trim()) runSearch(query);
  }, [query, runSearch]);

  return { query, setQuery, submit, results, status, notice, errorMsg };
}
