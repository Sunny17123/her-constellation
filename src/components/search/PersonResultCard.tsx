import { ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getThemeColor } from "@/data/load";
import { getThemeZh } from "../../../data/themes";
import type { SearchResultItem } from "./useSearch";

interface PersonResultCardProps {
  result: SearchResultItem;
  onSelect: (personId: string) => void;
}

/**
 * 搜索结果卡片：点击 → selectPerson(person_id)
 * （SummaryCard 滑入、DeepLinkSync 写 /person/:id、相机聚焦均由既有契约免费获得）
 */
export default function PersonResultCard({
  result,
  onSelect,
}: PersonResultCardProps) {
  return (
    <button
      onClick={() => onSelect(result.person_id)}
      className="w-full text-left rounded-lg border border-border/60 bg-background/60 p-4 hover:border-primary/50 transition-colors"
    >
      {/* 姓名 */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-serif text-foreground truncate">
            {result.name_zh}
          </h3>
          <p className="text-xs text-muted-foreground truncate">
            {result.name_en}
          </p>
        </div>
        <ArrowUpRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
      </div>

      {/* 时代 + 地域 */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
        <span>{result.time_period}</span>
        <span className="text-border">·</span>
        <span className="truncate">{result.region_zh}</span>
      </div>

      {/* 议题徽章（与 SummaryCard 同款配色） */}
      <div className="flex flex-wrap gap-1.5 mt-2">
        {result.themes.map((t) => (
          <Badge
            key={t}
            variant="secondary"
            className="text-[10px] px-2 py-0"
            style={{
              borderColor: getThemeColor(t),
              color: getThemeColor(t),
              backgroundColor: `${getThemeColor(t)}15`,
            }}
          >
            {getThemeZh(t)}
          </Badge>
        ))}
      </div>

      {/* 摘要一句 */}
      <p className="text-xs leading-relaxed text-foreground/70 mt-3 line-clamp-2">
        {result.snippet}
      </p>

      {/* 匹配理由 */}
      <p className="text-xs text-secondary mt-2">{result.match_reason}</p>
    </button>
  );
}
