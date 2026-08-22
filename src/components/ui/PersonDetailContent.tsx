import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  ExternalLink,
  ChevronDown,
  BookOpen,
  Star,
} from "lucide-react";
import type { Person, Connection, LessonPart } from "@/data/schema";
import { getThemeZh, getThemeColor } from "../../../data/themes";
import { cn } from "@/lib/utils";

interface PersonDetailContentProps {
  person: Person;
  echoes: Connection[];
  getEchoTarget: (connection: Connection, sourceId: string) => Person | null;
  onEchoClick?: (connectionId: string) => void;
  /** 面板态（右侧抽屉）更紧凑；页面态（独立路由）更宽松 */
  variant?: "panel" | "page";
}

/** 启示条目渲染：{blank} 渲染为金虚线空位，{text} 渲染为正文 */
function renderLessonParts(parts: LessonPart[]) {
  return parts.map((p, i) =>
    "blank" in p ? (
      <span key={i} className="dc-lesson-blank">
        {p.blank}
      </span>
    ) : (
      <span key={i}>{p.text}</span>
    )
  );
}

/** 取姓名首字符作为头像芯片占位 */
function nameInitial(name: string): string {
  const trimmed = name.trim();
  return trimmed ? trimmed.charAt(0) : "·";
}

/** 来源折叠项 */
function SourceItem({ url }: { url: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border last:border-b-0">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left text-sm hover:bg-secondary/5 transition-colors min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span className="flex items-center gap-2 min-w-0">
          <BookOpen className="h-4 w-4 flex-shrink-0 text-secondary/70" />
          <span className="truncate text-foreground/80">{url}</span>
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 flex-shrink-0 text-muted-foreground transition-transform duration-300",
            open && "rotate-180 text-primary"
          )}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 pl-10 pr-4 pb-3 text-xs text-secondary hover:text-primary break-all transition-colors"
            >
              <ExternalLink className="h-3 w-3 flex-shrink-0" />
              {url}
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const containerVariants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

export default function PersonDetailContent({
  person,
  echoes,
  getEchoTarget,
  onEchoClick,
  variant = "panel",
}: PersonDetailContentProps) {
  const isPage = variant === "page";

  // 尺寸映射
  const sizes = {
    name: isPage ? "text-4xl" : "text-2xl",
    story: isPage ? "text-base" : "text-sm",
    quote: isPage ? "text-xl" : "text-base",
    sectionTitle: isPage ? "text-xl" : "text-base",
  };

  // 故事按换行拆段，首段加首字下沉
  const storyParagraphs = person.short_story.split(/\n+/).filter(Boolean);

  return (
    <motion.div
      key={person.id}
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      {/* ① 人像 + 名字 + 标签 */}
      <motion.section variants={itemVariants}>
        {/* 星座肖像卡 */}
        <div
          className="relative w-full rounded-2xl overflow-hidden mb-6 border border-border"
          style={{ aspectRatio: "16 / 9" }}
        >
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(circle at 30% 40%, rgba(183,156,255,0.25), transparent 60%), radial-gradient(circle at 70% 70%, rgba(242,193,78,0.2), transparent 60%), linear-gradient(135deg, #141A2E, #0A0E1A)",
            }}
          />
          <span className="absolute inset-0 flex items-center justify-center font-serif text-[120px] font-light leading-none text-primary/15 select-none">
            {nameInitial(person.name_en)}
          </span>
          {person.constellation_code && (
            <div className="absolute left-4 bottom-3 flex items-center gap-2 text-[11px] uppercase tracking-widest text-primary/80">
              <Star className="h-3.5 w-3.5 fill-primary" />
              {person.constellation_code}
            </div>
          )}
        </div>

        <h1
          className={cn(
            "font-serif font-semibold leading-tight dc-gold-text mb-1.5",
            sizes.name
          )}
        >
          {person.name_zh}
        </h1>
        <p className="text-sm italic text-muted-foreground mb-4">
          {person.name_en}
        </p>
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs rounded-full bg-primary/10 border border-primary/30 text-primary">
            <span className="w-1 h-1 rounded-full bg-primary" />
            {person.time_period}
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs rounded-full bg-secondary/10 border border-secondary/25 text-secondary">
            <span className="w-1 h-1 rounded-full bg-secondary" />
            {person.region_zh}
          </span>
          {person.themes.map((t) => {
            const color = getThemeColor(t);
            return (
              <span
                key={t}
                className="inline-flex items-center gap-1.5 px-3 py-1 text-xs rounded-full border"
                style={{
                  color,
                  borderColor: `${color}55`,
                  backgroundColor: `${color}15`,
                }}
              >
                <span
                  className="w-1 h-1 rounded-full"
                  style={{ background: color }}
                />
                {getThemeZh(t)}
              </span>
            );
          })}
        </div>
      </motion.section>

      <div className="dc-breath-divider" aria-hidden="true" />

      {/* ② 金句引言 */}
      {person.quote && (
        <motion.blockquote
          variants={itemVariants}
          className="text-center px-2"
        >
          <p
            className={cn(
              "font-serif leading-relaxed text-foreground tracking-wide",
              person.quote.is_own_words && "dc-quote-own",
              sizes.quote
            )}
          >
            {person.quote.text}
          </p>
          {person.quote.attribution && (
            <span className="block mt-4 italic text-xs text-muted-foreground tracking-wide">
              {person.quote.attribution}
            </span>
          )}
        </motion.blockquote>
      )}

      <div className="dc-breath-divider" aria-hidden="true" />

      {/* ③ 故事正文 */}
      <motion.section variants={itemVariants}>
        <span className="inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.22em] text-secondary mb-4">
          <span className="w-5 h-px bg-gradient-to-r from-secondary to-transparent" />
          Story · 故事
        </span>
        <div
          className={cn(
            "leading-loose text-foreground/85 space-y-4 text-justify",
            sizes.story
          )}
        >
          {storyParagraphs.map((p, i) => (
            <p key={i} className={i === 0 ? "dc-drop-cap" : undefined}>
              {p}
            </p>
          ))}
        </div>
      </motion.section>

      {/* 星芒分隔符 */}
      <div
        className="flex items-center justify-center gap-4"
        aria-hidden="true"
      >
        <span className="w-[20%] h-px bg-gradient-to-r from-transparent to-border" />
        <span className="dc-asterism-spin text-primary drop-shadow-[0_0_6px_rgba(242,193,78,0.5)]">
          <Star className="h-5 w-5 fill-primary" />
        </span>
        <span className="w-[20%] h-px bg-gradient-to-r from-border to-transparent" />
      </div>

      {/* ④ 与今天的我有关 */}
      <motion.section
        variants={itemVariants}
        aria-labelledby="bridge-title"
      >
        <h2
          id="bridge-title"
          className={cn(
            "flex items-center gap-2.5 font-serif font-semibold mb-5",
            isPage ? "text-xl" : "text-lg"
          )}
        >
          <Star className="h-5 w-5 fill-primary text-primary drop-shadow-[0_0_6px_rgba(242,193,78,0.6)]" />
          <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            与今天的我有关
          </span>
        </h2>
        <div className="dc-bridge-card rounded-2xl p-6">
          <p className="font-serif text-base leading-relaxed text-foreground border-l-2 border-primary pl-4 mb-5">
            {person.relevance_today}
          </p>
          {person.lessons && person.lessons.length > 0 && (
            <div className="flex flex-col gap-4">
              {person.lessons.map((l, i) => (
                <div
                  key={i}
                  className="relative pl-3.5 border-l-[1.5px] border-primary/25"
                >
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-medium tracking-wider text-secondary mb-2">
                    <span className="w-1 h-1 rounded-full bg-secondary" />
                    {l.dir}
                  </span>
                  <p className="font-serif italic text-[15px] leading-relaxed text-foreground">
                    <span className="text-primary font-semibold not-italic">
                      “
                    </span>
                    当你 {renderLessonParts(l.parts)}。
                    <span className="text-primary font-semibold not-italic">
                      ”
                    </span>
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.section>

      {/* ⑤ 她的联结 */}
      {echoes.length > 0 && (
        <motion.section variants={itemVariants} aria-labelledby="conn-title">
          <h2
            id="conn-title"
            className={cn(
              "flex items-center gap-2 font-serif font-semibold mb-5",
              sizes.sectionTitle
            )}
          >
            <Users className="h-4 w-4 text-secondary" />
            她的联结
            <span className="flex-1 h-px bg-gradient-to-r from-border to-transparent ml-2" />
          </h2>
          <div className="flex flex-col gap-4">
            {echoes.map((c) => {
              const target = getEchoTarget(c, person.id);
              if (!target) return null;
              const color1 = getThemeColor(
                person.themes.includes(c.shared_theme)
                  ? c.shared_theme
                  : person.themes[0]
              );
              const color2 = getThemeColor(c.shared_theme);
              const arcId = `arc-${c.id}`;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => onEchoClick?.(c.id)}
                  disabled={!onEchoClick}
                  className="dc-conn-card w-full text-left p-4 rounded-xl border border-border hover:border-secondary/50 bg-card/60 disabled:cursor-default group"
                  aria-label={`查看 ${target.name_zh} 在${getThemeZh(c.shared_theme)}上的呼应`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-serif text-lg text-foreground"
                      style={{
                        background: `linear-gradient(135deg, ${color1}40, ${color2}40)`,
                        border: `1px solid ${color1}66`,
                      }}
                    >
                      {nameInitial(person.name_zh)}
                    </div>
                    <div className="flex-1 flex flex-col items-center gap-1">
                      <svg
                        viewBox="0 0 100 30"
                        className="w-full h-6 overflow-visible"
                        aria-hidden="true"
                      >
                        <defs>
                          <linearGradient
                            id={arcId}
                            x1="0"
                            y1="0"
                            x2="1"
                            y2="0"
                          >
                            <stop offset="0%" stopColor={color1} />
                            <stop offset="100%" stopColor={color2} />
                          </linearGradient>
                        </defs>
                        <path
                          d="M4,14 C28,-4 62,32 96,14"
                          stroke={`url(#${arcId})`}
                          fill="none"
                          strokeWidth="1.5"
                          className="dc-arc-grow"
                        />
                      </svg>
                      <span
                        className="text-[11px] px-2.5 py-0.5 rounded-full border whitespace-nowrap"
                        style={{
                          color: color2,
                          borderColor: `${color2}40`,
                          backgroundColor: `${color2}15`,
                        }}
                      >
                        在「{getThemeZh(c.shared_theme)}」上呼应
                      </span>
                    </div>
                    <div
                      className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-serif text-lg text-foreground"
                      style={{
                        background: `linear-gradient(135deg, ${color2}40, ${color1}40)`,
                        border: `1px solid ${color2}66`,
                      }}
                    >
                      {nameInitial(target.name_zh)}
                    </div>
                  </div>
                  <p className="text-xs leading-relaxed text-muted-foreground italic pt-2.5 border-t border-dashed border-border">
                    {c.connection_explanation}
                  </p>
                </button>
              );
            })}
          </div>
        </motion.section>
      )}

      {/* ⑥ 来源 */}
      <motion.section variants={itemVariants} aria-labelledby="src-title">
        <h2
          id="src-title"
          className={cn(
            "flex items-center gap-2 font-serif font-medium text-muted-foreground mb-4",
            sizes.sectionTitle
          )}
        >
          <BookOpen className="h-4 w-4" />
          来源
        </h2>
        <div className="rounded-xl border border-border overflow-hidden bg-card/40">
          {person.source_urls.map((url, i) => (
            <SourceItem key={i} url={url} />
          ))}
        </div>
      </motion.section>
    </motion.div>
  );
}
