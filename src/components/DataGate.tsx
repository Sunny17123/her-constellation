import { useEffect, useState, type ReactNode } from "react";
import { preloadData } from "@/data/load";

/**
 * 数据门：预加载 + zod 校验通过后才渲染应用
 *
 * - loading：品牌加载屏（后续可由 yuqing 增强为完整星空加载态）
 * - error：友好错误屏 + 重试（数据格式出错不再白屏）
 * - ready：渲染 children（此时 useGlobeSelection 渲染期同步 getter 必命中缓存）
 */
export default function DataGate({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<"loading" | "error" | "ready">(
    "loading"
  );
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    preloadData()
      .then(() => {
        if (!cancelled) setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  if (status === "ready") return <>{children}</>;

  if (status === "error") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#070B14] text-center">
        <div className="space-y-4 px-6">
          <p className="text-4xl">✦</p>
          <p className="font-serif text-2xl text-[#EDEFF5]">
            星图数据暂时无法点亮
          </p>
          <p className="text-sm text-muted-foreground">
            数据文件可能损坏或格式有误，请检查 data/stories.json 与
            data/connections.json
          </p>
          <button
            onClick={() => setAttempt((a) => a + 1)}
            className="rounded-full border border-primary px-6 py-2 text-sm text-primary hover:bg-primary/10"
          >
            重试
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#070B14]">
      {/* 星空渐变占位（加载态增强待 yuqing） */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,#0D1420_0%,#070B14_70%)]" />
      <div className="relative space-y-6 text-center">
        <p className="text-4xl">✦</p>
        <h1 className="font-serif text-2xl tracking-widest text-[#EDEFF5]">
          Her Constellation
        </h1>
        <p className="text-sm text-muted-foreground">
          她们一直都在，只是没人点亮
        </p>
        <p className="animate-pulse text-xs text-muted-foreground/60">
          正在点亮星图…
        </p>
      </div>
    </div>
  );
}
