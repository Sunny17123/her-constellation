import { useGlobeSelection } from "@/hooks/useGlobeSelection";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

// 议题定义（与 data/themes.ts 对齐）
const THEMES = {
  education:      { key: "education",      zh: "教育权",     color: "#4ECDC4" },
  suffrage:       { key: "suffrage",       zh: "参政与投票", color: "#A8E6CF" },
  body:           { key: "body",           zh: "身体自主",   color: "#FF6B9D" },
  labor:          { key: "labor",          zh: "劳动权益",   color: "#F7B32B" },
  science:        { key: "science",        zh: "科学参与",   color: "#6C5CE7" },
  art_voice:      { key: "art_voice",      zh: "艺术与发声", color: "#FD79A8" },
  peace_justice:  { key: "peace_justice",  zh: "和平与正义", color: "#00B894" },
} as const;

type ThemeItem = (typeof THEMES)[keyof typeof THEMES];

export default function ThemeChips() {
  const { highlightTheme, setHighlightTheme } = useGlobeSelection();

  const themes: ThemeItem[] = Object.values(THEMES);

  return (
    <ScrollArea className="w-full max-w-[600px]">
      <div className="flex gap-2 px-1 py-1">
        {themes.map((theme) => {
          const isActive = highlightTheme === theme.key;
          return (
            <button
              key={theme.key}
              onClick={() => setHighlightTheme(isActive ? null : theme.key)}
              className="flex-shrink-0 transition-all duration-200"
            >
              <Badge
                variant={isActive ? "default" : "outline"}
                className="text-xs cursor-pointer px-3 py-1.5 transition-all"
                style={
                  isActive
                    ? {
                        backgroundColor: theme.color,
                        color: "#070B14",
                        borderColor: theme.color,
                      }
                    : {
                        borderColor: `${theme.color}50`,
                        color: theme.color,
                      }
                }
              >
                {theme.zh}
              </Badge>
            </button>
          );
        })}
      </div>
      <ScrollBar orientation="horizontal" className="h-1.5" />
    </ScrollArea>
  );
}