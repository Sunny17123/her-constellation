import { useEffect, useMemo, useState } from "react";
import { Check, Download, Link2, Loader2, Share } from "lucide-react";
import { useGlobeSelection } from "@/hooks/useGlobeSelection";
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
import {
  buildPersonShareLink,
  buildPersonShareTitle,
  FEELING_SHARE_TITLE,
  weiboUrl,
  xUrl,
  openShareIntent,
  copyText,
  webShare,
  downloadBlob,
} from "@/lib/share";
import { renderPersonCard, renderFeelingCard } from "./renderCard";

interface ShareSheetProps {
  open: boolean;
  onClose: () => void;
  /** 单人卡片分享：传入人物 id；与 feelingText 二选一 */
  personId?: string | null;
  /** 感受卡片分享：传入感想文本；与 personId 二选一 */
  feelingText?: string | null;
}

const PLATFORMS = [
  { key: "weibo", label: "微博", color: "#E6162D" },
  { key: "x", label: "X", color: "#E7E9EA" },
  { key: "wechat", label: "微信", color: "#07C160" },
  { key: "douyin", label: "抖音", color: "#25F4EE" },
] as const;

/**
 * 分享面板：卡片预览 + 平台按钮 + 保存/复制
 * 微博/X 走 intent URL；微信/抖音无网页 intent → 复制链接 + 保存图片兜底
 */
export default function ShareSheet({
  open,
  onClose,
  personId,
  feelingText,
}: ShareSheetProps) {
  const isMobile = useMediaQuery("(max-width: 767px)");
  const { allPeople } = useGlobeSelection();
  const person = personId
    ? (allPeople.find((p) => p.id === personId) ?? null)
    : null;

  const [blob, setBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fallbackHint, setFallbackHint] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const canSystemShare = useMemo(
    () => typeof navigator !== "undefined" && "share" in navigator,
    []
  );

  const shareTitle = person
    ? buildPersonShareTitle(person.name_zh)
    : FEELING_SHARE_TITLE;
  const shareUrl = person
    ? buildPersonShareLink(person.id)
    : window.location.origin;

  // 打开时生成卡片
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    let url: string | null = null;
    setGenerating(true);
    setError(null);
    setFallbackHint(null);
    setCopied(false);

    (async () => {
      try {
        const b = person
          ? await renderPersonCard(person, buildPersonShareLink(person.id))
          : await renderFeelingCard(feelingText ?? "");
        if (cancelled) return;
        url = URL.createObjectURL(b);
        setBlob(b);
        setPreviewUrl(url);
      } catch {
        if (!cancelled) setError("卡片生成失败，请重试");
      } finally {
        if (!cancelled) setGenerating(false);
      }
    })();

    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, person?.id, feelingText]);

  const handlePlatform = async (key: string) => {
    if (key === "weibo") {
      openShareIntent(weiboUrl(shareTitle, shareUrl));
      return;
    }
    if (key === "x") {
      openShareIntent(xUrl(shareTitle, shareUrl));
      return;
    }
    // 微信 / 抖音：复制链接 + 引导保存图片
    const ok = await copyText(shareUrl);
    setFallbackHint(
      ok
        ? "已复制链接。微信/抖音不支持网页直接分享：保存卡片图片，前往 App 发送即可"
        : "微信/抖音不支持网页直接分享：保存卡片图片，前往 App 发送即可"
    );
  };

  const handleSave = () => {
    if (!blob) return;
    downloadBlob(blob, "her-constellation.png");
  };

  const handleCopy = async () => {
    setCopied(await copyText(shareUrl));
  };

  const handleSystemShare = async () => {
    if (!blob) return;
    await webShare({ title: shareTitle, text: shareTitle, url: shareUrl, blob });
  };

  const title = person ? `分享「${person.name_zh}」` : "分享今天的感受";

  const content = (
    <div className="flex flex-col gap-4">
      {/* 卡片预览 */}
      <div className="rounded-xl border border-border/60 overflow-hidden bg-background/40 flex items-center justify-center">
        {generating && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-10">
            <Loader2 className="h-4 w-4 animate-spin" />
            正在生成卡片…
          </div>
        )}
        {error && !generating && (
          <p className="text-sm text-destructive py-10 px-4">{error}</p>
        )}
        {previewUrl && !generating && (
          <img
            src={previewUrl}
            alt="分享卡片预览"
            className="w-full max-h-[300px] object-contain"
          />
        )}
      </div>

      {/* 平台按钮 */}
      <div className="grid grid-cols-4 gap-2">
        {PLATFORMS.map((p) => (
          <button
            key={p.key}
            onClick={() => handlePlatform(p.key)}
            className="flex flex-col items-center gap-1.5 rounded-lg border border-border/60 py-2.5 hover:border-primary/50 transition-colors"
          >
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: p.color }}
            />
            <span className="text-xs text-foreground/80">{p.label}</span>
          </button>
        ))}
      </div>

      {fallbackHint && (
        <p className="text-xs text-secondary leading-relaxed">{fallbackHint}</p>
      )}

      {/* 保存 / 复制 */}
      <div className="flex gap-2">
        <Button
          onClick={handleSave}
          disabled={!blob}
          className="flex-1 gap-2"
          size="sm"
        >
          <Download className="h-4 w-4" />
          保存图片
        </Button>
        <Button
          variant="outline"
          onClick={handleCopy}
          size="sm"
          className="flex-1 gap-2"
        >
          {copied ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
          {copied ? "已复制" : "复制链接"}
        </Button>
      </div>

      {canSystemShare && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSystemShare}
          disabled={!blob}
          className="gap-2"
        >
          <Share className="h-4 w-4" />
          系统分享
        </Button>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={(o) => !o && onClose()}>
        <DrawerContent className="px-5 pb-8">
          <DrawerHeader className="px-0">
            <DrawerTitle className="text-left">{title}</DrawerTitle>
          </DrawerHeader>
          {content}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>生成统一格式卡片，分享到你的社交平台</DialogDescription>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}
