import { Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import PersonResultCard from "./PersonResultCard";
import type { SearchResultItem, SearchStatus } from "./useSearch";

interface SearchResultsProps {
  results: SearchResultItem[];
  status: SearchStatus;
  notice: string | null;
  errorMsg: string | null;
  onSelect: (personId: string) => void;
  onSuggestion: (query: string) => void;
  /** true = 桌面悬浮面板样式；false = 移动端抽屉内纯列表 */
  panel?: boolean;
}

const SUGGESTIONS = ["学科", "创作", "教育"];

/**
 * 搜索结果展示：加载 / 错误 / 空态建议 / 卡片列表
 */
export default function SearchResults({
  results,
  status,
  notice,
  errorMsg,
  onSelect,
  onSuggestion,
  panel = true,
}: SearchResultsProps) {
  const content = (
    <>
      {notice && (
        <p className="text-xs text-muted-foreground px-2 pt-1">{notice}</p>
      )}

      {status === "loading" && (
        <div className="flex items-center gap-2 px-2 py-3 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          正在星群中寻找…
        </div>
      )}

      {status === "error" && errorMsg && (
        <p className="px-2 py-3 text-sm text-destructive">{errorMsg}</p>
      )}

      {status === "success" && results.length === 0 && (
        <div className="px-2 py-3">
          <p className="text-sm text-muted-foreground">没有找到相关人物</p>
          <p className="text-xs text-muted-foreground/70 mt-1">试试：</p>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => onSuggestion(s)}
                className="rounded-full border border-border px-2.5 py-0.5 text-xs text-secondary hover:border-secondary/60 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {status === "success" && results.length > 0 && (
        <div className="flex flex-col gap-2 px-2 pb-1">
          {results.map((r) => (
            <PersonResultCard key={r.person_id} result={r} onSelect={onSelect} />
          ))}
        </div>
      )}
    </>
  );

  if (!panel) return <div>{content}</div>;

  return (
    <div className="rounded-xl border border-border/60 bg-card/95 backdrop-blur shadow-2xl shadow-black/40 p-2">
      <ScrollArea className="max-h-[380px] pr-1">{content}</ScrollArea>
    </div>
  );
}
