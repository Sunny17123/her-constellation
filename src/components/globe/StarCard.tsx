import {
  Sparkles,
  MapPin,
  Calendar,
  Orbit,
  Quote,
  ArrowRight,
  GraduationCap,
  Landmark,
  Heart,
  Briefcase,
  Atom,
  Palette,
  Scale,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Person, Connection } from "@/data/schema";
import { THEMES } from "../../../data/themes";
import type { NodeImportance } from "./constellation-utils";

/** 主题 → 图标映射（用 lucide 星群主题图标代替 emoji） */
const THEME_ICON: Record<string, LucideIcon> = {
  education: GraduationCap,
  suffrage: Landmark,
  body: Heart,
  labor: Briefcase,
  science: Atom,
  art_voice: Palette,
  peace_justice: Scale,
};

interface StarCardProps {
  person: Person;
  importance: NodeImportance;
  /** 该人物的所有联结（用于"星群引力"列表） */
  connections: Connection[];
  /** 所有人物（用于解析联结对方） */
  allPeople: Person[];
  onExplore: () => void;
}

/**
 * 微型星卡：悬停 / 固定时弹出，呈现一颗"星"的故事快照
 * 顺序：星名 → 主题 → 地区 → 星历 → 星群引力 → 引言 → 探索按钮
 */
export default function StarCard({
  person,
  importance,
  connections,
  allPeople,
  onExplore,
}: StarCardProps) {
  // 解析"星群引力"——与该星相连的对方人物
  const neighbors = connections
    .map((c) => {
      const otherId = c.source_id === person.id ? c.target_id : c.source_id;
      return allPeople.find((p) => p.id === otherId);
    })
    .filter((p): p is Person => Boolean(p));

  const themeChips = person.themes.map((t) => THEMES[t]).slice(0, 3);
  const quote = person.quote;

  return (
    <div className="cg-starcard w-[300px] rounded-2xl p-4 text-sm leading-relaxed text-foreground">
      {/* ① 星名 */}
      <div className="flex items-start gap-2">
        <Sparkles className="cg-twinkle mt-0.5 h-4 w-4 flex-shrink-0 text-[#F5A623]" />
        <div className="min-w-0">
          <div className="cg-name-gold font-serif text-lg font-semibold leading-tight">
            {person.name_zh}
          </div>
          <div className="mt-0.5 truncate text-xs text-muted-foreground">
            {person.name_en}
          </div>
        </div>
        {/* 右上角星等小标 */}
        <div className="ml-auto flex-shrink-0 text-right">
          <div className="text-[9px] uppercase tracking-wider text-muted-foreground/70">
            星等
          </div>
          <div className="font-mono text-xs text-[#F5D980]">
            {importance.score.toFixed(2)}
          </div>
        </div>
      </div>

      <div className="cg-divider my-3" />

      {/* ② 主题 */}
      <div className="flex flex-wrap items-center gap-1.5">
        {themeChips.map((t) => {
          const Icon = THEME_ICON[t.key] ?? Sparkles;
          return (
            <span
              key={t.key}
              className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px]"
              style={{
                borderColor: `${t.color}55`,
                color: t.color,
                background: `${t.color}12`,
              }}
            >
              <Icon className="h-3 w-3" />
              {t.zh}
            </span>
          );
        })}
      </div>

      {/* ③ 地区 */}
      <div className="mt-2.5 flex items-start gap-2 text-xs text-muted-foreground">
        <MapPin className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-[#3498DB]" />
        <span>{person.region_zh}</span>
      </div>

      {/* ④ 星历（高光时刻） */}
      <div className="mt-1.5 flex items-start gap-2 text-xs text-muted-foreground">
        <Calendar className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-[#9B59B6]" />
        <span>
          {person.time_period}
          {person.constellation_code ? (
            <span className="ml-1.5 text-[#F5D980]/80">
              · {person.constellation_code}
            </span>
          ) : null}
        </span>
      </div>

      {/* ⑤ 星群引力（最亮联结） */}
      {neighbors.length > 0 && (
        <div className="mt-2.5">
          <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground/80">
            <Orbit className="h-3 w-3 text-[#E74C8B]" />
            星群引力
          </div>
          <div className="mt-1 flex flex-wrap gap-y-0.5 text-xs text-foreground/85">
            {neighbors.slice(0, 4).map((n, i) => (
              <span key={n.id} className="flex items-center">
                {i > 0 && (
                  <span className="mx-1.5 text-muted-foreground/50">·</span>
                )}
                {n.name_zh}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ⑥ 引言 */}
      {quote && (
        <div className="mt-3 flex gap-2 rounded-lg bg-white/[0.03] p-2.5">
          <Quote className="mt-0.5 h-3 w-3 flex-shrink-0 text-[#F2C14E]/70" />
          <p className="line-clamp-3 text-xs italic leading-relaxed text-foreground/80">
            {quote.text}
          </p>
        </div>
      )}

      {/* ⑦ 探索按钮 */}
      <button
        onClick={onExplore}
        className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-[#F5A623]/40 bg-[#F5A623]/10 py-2 text-xs font-medium text-[#F5D980] transition-colors hover:bg-[#F5A623]/20"
      >
        探索她的星群
        <ArrowRight className="h-3 w-3" />
      </button>
    </div>
  );
}
