import { useState } from "react";
import { PenLine } from "lucide-react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import ShareSheet from "./ShareSheet";

const MAX_LEN = 120;

/**
 * 「分享今天的感受」浮动入口（自定位，一行挂载，见集成文档协调 diff 4）
 *
 * 两段流程：
 * 1. 入口（桌面右上按钮 / 移动 FAB）→ 输入卡片（Textarea + 生成）
 * 2. 生成 → 复用 ShareSheet 预览统一格式卡片 → 分享到各平台
 */
export default function FeelingShareFab() {
  const isMobile = useMediaQuery("(max-width: 767px)");
  const [composerOpen, setComposerOpen] = useState(false);
  const [feelingText, setFeelingText] = useState("");
  const [shareOpen, setShareOpen] = useState(false);

  const handleGenerate = () => {
    if (!feelingText.trim()) return;
    setComposerOpen(false);
    setShareOpen(true);
  };

  const composer = (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">写下今天与她的相遇…</p>
      <textarea
        value={feelingText}
        onChange={(e) => setFeelingText(e.target.value)}
        maxLength={MAX_LEN}
        rows={4}
        placeholder="今天，我想说……"
        className="w-full rounded-lg border border-border bg-card/60 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none"
      />
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {feelingText.length}/{MAX_LEN}
        </span>
        <Button
          size="sm"
          disabled={!feelingText.trim()}
          onClick={handleGenerate}
          className="gap-2"
        >
          <PenLine className="h-4 w-4" />
          生成
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* 入口：桌面右上按钮（DetailPanel 打开时会被其覆盖，可接受）
          必须位于 header 之下：header 含搜索栏高约 174px 且 z-50，
          若按钮探入其盒内会被 header 拦截点击（可见但点不到） */}
      {!isMobile && (
        <div className="fixed right-6 top-48 z-40">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setComposerOpen(true)}
            className="gap-2 border-secondary/40 text-secondary hover:bg-secondary/10 hover:border-secondary"
          >
            <PenLine className="h-4 w-4" />
            分享感受
          </Button>
        </div>
      )}

      {/* 入口：移动 FAB（叠在 SurpriseMe FAB bottom-24 上方，不重叠） */}
      {isMobile && (
        <button
          onClick={() => setComposerOpen(true)}
          className="fixed right-5 bottom-40 z-40 w-14 h-14 rounded-full bg-secondary text-secondary-foreground shadow-lg shadow-secondary/30 flex items-center justify-center active:scale-95 transition-transform"
        >
          <PenLine className="h-6 w-6" />
        </button>
      )}

      {/* 输入卡片 */}
      {!isMobile ? (
        <Dialog
          open={composerOpen}
          onOpenChange={(o) => !o && setComposerOpen(false)}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>分享今天的感受</DialogTitle>
              <DialogDescription>生成一张属于你的星图卡片</DialogDescription>
            </DialogHeader>
            {composer}
          </DialogContent>
        </Dialog>
      ) : (
        <Drawer
          open={composerOpen}
          onOpenChange={(o) => !o && setComposerOpen(false)}
        >
          <DrawerContent className="px-5 pb-8">
            <DrawerHeader className="px-0">
              <DrawerTitle className="text-left">分享今天的感受</DrawerTitle>
            </DrawerHeader>
            {composer}
          </DrawerContent>
        </Drawer>
      )}

      {/* 生成后的分享面板 */}
      <ShareSheet
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        feelingText={feelingText}
      />
    </>
  );
}
