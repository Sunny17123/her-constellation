import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, BookOpen } from "lucide-react";
import { useGlobeSelection } from "@/hooks/useGlobeSelection";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { getThemeColor } from "@/data/load";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import ShareButton from "@/components/share/ShareButton";

interface SummaryCardProps {
  onOpenDetail: () => void;
}

export default function SummaryCard({ onOpenDetail }: SummaryCardProps) {
  const isMobile = useMediaQuery("(max-width: 767px)");
  const { selectedId, selectPerson, allPeople, surpriseMe } = useGlobeSelection();

  const person = selectedId
    ? allPeople.find((p) => p.id === selectedId) ?? null
    : null;

  const handleSurprise = () => {
    surpriseMe();
  };

  const handleClose = () => {
    selectPerson(null);
  };

  if (!person) return null;

  const content = (
    <>
      {/* 名字 + 关闭 */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h2 className="text-xl font-serif text-foreground">
            {person.name_zh}
          </h2>
          <p className="text-sm text-muted-foreground">{person.name_en}</p>
        </div>
        <div className="flex items-center gap-1">
          <ShareButton variant="icon" />
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="h-8 w-8 text-muted-foreground hover:text-foreground -mr-2 -mt-1"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 时代 + 地域 */}
      <div className="flex items-center gap-3 text-sm text-muted-foreground mt-3">
        <span>{person.time_period}</span>
        <span className="text-border">·</span>
        <span>{person.region_zh}</span>
      </div>

      {/* 议题 chips */}
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

      {/* 一句话简介 */}
      <p className="text-sm leading-relaxed text-foreground/80 mt-4 line-clamp-3">
        {person.short_story.split("\n")[0]}
      </p>

      {/* 两个动作按钮 */}
      <div className="flex gap-3 mt-4">
        <Button
          onClick={onOpenDetail}
          className="flex-1 gap-2"
          size="sm"
        >
          <BookOpen className="h-4 w-4" />
          阅读她的故事
        </Button>
        <Button
          variant="outline"
          onClick={handleSurprise}
          size="sm"
          className="gap-2"
        >
          <Sparkles className="h-4 w-4" />
          随机另一位
        </Button>
      </div>
    </>
  );

  return (
    <>
      {/* 桌面端：右下角滑出卡片 */}
      {!isMobile && (
        <AnimatePresence>
          <motion.div
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed right-6 bottom-6 z-50 w-[360px]"
          >
            <Card className="bg-card/95 backdrop-blur border-border shadow-2xl shadow-primary/5">
              <CardHeader className="pb-2">{content}</CardHeader>
            </Card>
          </motion.div>
        </AnimatePresence>
      )}

      {/* 移动端：底部抽屉 */}
      {isMobile && (
        <Drawer open={true} onOpenChange={(open) => { if (!open) handleClose(); }}>
          <DrawerContent className="px-6 pb-8">
            <DrawerHeader className="px-0">
              <DrawerTitle className="text-left">{content}</DrawerTitle>
            </DrawerHeader>
          </DrawerContent>
        </Drawer>
      )}
    </>
  );
}