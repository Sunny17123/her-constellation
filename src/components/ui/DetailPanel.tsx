import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowLeft, ExternalLink, Sparkles, Users } from "lucide-react";
import { useGlobeSelection } from "@/hooks/useGlobeSelection";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { getThemeColor } from "@/data/load";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import ShareButton from "@/components/share/ShareButton";

interface DetailPanelProps {
  onClose: () => void;
}

export default function DetailPanel({ onClose }: DetailPanelProps) {
  const isMobile = useMediaQuery("(max-width: 767px)");
  const {
    selectedId,
    selectPerson,
    selectConnection,
    allPeople,
    getEchoes,
    getEchoTarget,
  } = useGlobeSelection();

  const person = selectedId
    ? allPeople.find((p) => p.id === selectedId) ?? null
    : null;

  const echoes = selectedId ? getEchoes(selectedId) : [];

  const handleEchoClick = (connectionId: string) => {
    const connection = echoes.find((c) => c.id === connectionId);
    if (!connection || !selectedId) return;
    const target = getEchoTarget(connection, selectedId);
    if (target) {
      selectConnection(connectionId);
      setTimeout(() => {
        selectPerson(target.id);
      }, 600);
    }
  };

  if (!person) return null;

  const content = (
    <div className="space-y-8">
      {/* 人物头部 */}
      <div>
        <h1 className="text-2xl font-serif text-foreground mb-1">
          {person.name_zh}
        </h1>
        <p className="text-sm text-muted-foreground">{person.name_en}</p>
        <div className="flex items-center gap-3 mt-3 text-sm text-muted-foreground">
          <span>{person.time_period}</span>
          <span className="text-border">·</span>
          <span>{person.region_zh}</span>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-3">
          {person.themes.map((t) => (
            <Badge
              key={t}
              variant="secondary"
              className="text-xs"
              style={{
                borderColor: getThemeColor(t),
                color: getThemeColor(t),
                backgroundColor: `${getThemeColor(t)}15`,
              }}
            >
              {t}
            </Badge>
          ))}
        </div>
      </div>

      {/* 故事正文 */}
      <section>
        <h2 className="text-lg font-serif text-foreground mb-3">她的故事</h2>
        <div className="text-sm leading-relaxed text-foreground/85 whitespace-pre-wrap">
          {person.short_story}
        </div>
      </section>

      {/* 为什么值得被看见 */}
      <section className="p-4 rounded-lg border border-primary/30 bg-primary/5">
        <h3 className="text-sm font-serif text-primary mb-2">
          ✦ 为什么她值得被看见
        </h3>
        <p className="text-sm leading-relaxed text-foreground/80">
          {person.why_visible}
        </p>
      </section>

      {/* 与今天的你有什么关系 */}
      <section className="p-4 rounded-lg border border-secondary/30 bg-secondary/5">
        <h3 className="text-sm font-serif text-secondary-foreground mb-2 flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          与今天的你有什么关系
        </h3>
        <p className="text-sm leading-relaxed text-foreground/80">
          {person.relevance_today}
        </p>
      </section>

      {/* 她的联结 */}
      {echoes.length > 0 && (
        <section>
          <h3 className="text-lg font-serif text-foreground mb-3 flex items-center gap-2">
            <Users className="h-4 w-4" />
            她的回声
          </h3>
          <div className="space-y-3">
            {echoes.map((c) => {
              const target = getEchoTarget(c, person.id);
              if (!target) return null;
              return (
                <button
                  key={c.id}
                  onClick={() => handleEchoClick(c.id)}
                  className="w-full text-left p-3 rounded-lg border border-border hover:border-secondary/50 hover:bg-secondary/5 transition-colors group"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-foreground group-hover:text-secondary-foreground transition-colors">
                      {target.name_zh}
                    </span>
                    <Badge
                      variant="outline"
                      className="text-xs"
                      style={{
                        borderColor: getThemeColor(c.shared_theme),
                        color: getThemeColor(c.shared_theme),
                      }}
                    >
                      {c.shared_theme}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {c.connection_explanation}
                  </p>
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    {c.evidence_summary}
                  </p>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* 来源 */}
      <section className="pb-8">
        <h3 className="text-sm font-serif text-foreground mb-3">来源</h3>
        <ul className="space-y-2">
          {person.source_urls.map((url, i) => (
            <li key={i}>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline flex items-center gap-1 break-all"
              >
                <ExternalLink className="h-3 w-3 flex-shrink-0" />
                {url}
              </a>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );

  return (
    <>
      {/* 桌面端：右侧面板 */}
      {!isMobile && (
        <AnimatePresence>
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/20"
              onClick={onClose}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed right-0 top-0 bottom-0 z-50 w-[440px] max-w-[90vw] bg-card/95 backdrop-blur-xl border-l border-border shadow-2xl flex flex-col"
            >
              {/* 顶部导航 */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="gap-2 text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="h-4 w-4" />
                  返回地球
                </Button>
                <div className="flex items-center gap-1">
                  <ShareButton variant="icon" />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <ScrollArea className="flex-1">
                <div className="px-6 py-6">{content}</div>
              </ScrollArea>
            </motion.div>
          </>
        </AnimatePresence>
      )}

      {/* 移动端：全屏底部抽屉 */}
      {isMobile && (
        <Drawer open={true} onOpenChange={(open) => { if (!open) onClose(); }}>
          <DrawerContent className="h-[92dvh] flex flex-col">
            <DrawerHeader className="flex-shrink-0 pb-2">
              <DrawerTitle className="sr-only">{person.name_zh} 详情</DrawerTitle>
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="gap-2 text-muted-foreground"
                >
                  <ArrowLeft className="h-4 w-4" />
                  返回
                </Button>
                <ShareButton variant="icon" />
              </div>
            </DrawerHeader>
            <ScrollArea className="flex-1 px-6">
              {content}
            </ScrollArea>
          </DrawerContent>
        </Drawer>
      )}
    </>
  );
}