import { useState } from "react";
import { Loader2, Search } from "lucide-react";
import { useGlobeSelection } from "@/hooks/useGlobeSelection";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSearch } from "./useSearch";
import SearchResults from "./SearchResults";

/**
 * 「我想探索一个主题」搜索面板（自包含，无 props）
 *
 * 挂载方式（见集成文档协调 diff 1）：
 * 挂到 Layout 顶部导航 logo 下方，一处挂载即可。
 * 桌面：输入框下方悬浮结果面板；移动：结果走 vaul 抽屉。
 */
export default function SearchPanel() {
  const isMobile = useMediaQuery("(max-width: 767px)");
  const { selectPerson } = useGlobeSelection();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { query, setQuery, submit, results, status, notice, errorMsg } =
    useSearch({
      // 搜索成功 → 移动端自动打开结果抽屉
      onResults: () => {
        if (isMobile) setDrawerOpen(true);
      },
    });

  const handleSelect = (personId: string) => {
    // 先关抽屉再选中，避免与 SummaryCard 移动端抽屉叠加
    setDrawerOpen(false);
    selectPerson(personId);
  };

  const inputRow = (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="flex w-full gap-2"
    >
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="例如：学科 / 创作 / 教育…"
        className="flex-1 min-w-0 rounded-lg border border-border bg-card/60 backdrop-blur px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/50"
      />
      <Button type="submit" size="sm" disabled={!query.trim()} className="gap-2">
        <Search className="h-4 w-4" />
        探索
      </Button>
    </form>
  );

  const resultsContent = (
    <SearchResults
      results={results}
      status={status}
      notice={notice}
      errorMsg={errorMsg}
      onSelect={handleSelect}
      onSuggestion={setQuery}
      panel={!isMobile}
    />
  );

  return (
    <div className="flex flex-col items-start gap-2 w-full max-w-[300px] pointer-events-auto">
      <p className="text-sm text-muted-foreground/70 tracking-wide">
        ✦ 我想探索一个主题
      </p>

      {isMobile ? (
        <>
          {inputRow}
          {status === "loading" && (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground/70">
              <Loader2 className="h-3 w-3 animate-spin" />
              正在星群中寻找…
            </p>
          )}
          <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
            <DrawerContent className="h-[70dvh] px-4 pb-6 flex flex-col">
              <DrawerHeader className="px-1">
                <DrawerTitle className="text-left">探索结果</DrawerTitle>
              </DrawerHeader>
              <ScrollArea className="flex-1 min-h-0 px-1">
                {resultsContent}
              </ScrollArea>
            </DrawerContent>
          </Drawer>
        </>
      ) : (
        <div className="relative w-full">
          {inputRow}
          {(status !== "idle" || query.trim()) && (
            <div className="absolute top-full left-0 right-0 mt-3 z-20">
              {resultsContent}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
