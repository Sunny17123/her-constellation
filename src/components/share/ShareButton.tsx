import { useState } from "react";
import { Share2 } from "lucide-react";
import { useGlobeSelection } from "@/hooks/useGlobeSelection";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import ShareSheet from "./ShareSheet";

interface ShareButtonProps {
  /** button = 带文字的按钮（卡片操作行）；icon = 图标按钮（面板头部） */
  variant?: "button" | "icon";
  className?: string;
}

/**
 * 单人卡片分享按钮（一行挂载，见集成文档协调 diff 2/3）
 * 内部读 useGlobeSelection 当前选中人物，未选中时不可用
 */
export default function ShareButton({
  variant = "button",
  className,
}: ShareButtonProps) {
  const { selectedId } = useGlobeSelection();
  const [open, setOpen] = useState(false);

  if (variant === "icon") {
    return (
      <>
        <Button
          variant="ghost"
          size="icon"
          disabled={!selectedId}
          onClick={() => setOpen(true)}
          className={cn("h-8 w-8 text-muted-foreground hover:text-foreground", className)}
        >
          <Share2 className="h-4 w-4" />
        </Button>
        <ShareSheet
          open={open}
          onClose={() => setOpen(false)}
          personId={selectedId}
        />
      </>
    );
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        disabled={!selectedId}
        onClick={() => setOpen(true)}
        className={cn("gap-2", className)}
      >
        <Share2 className="h-4 w-4" />
        分享
      </Button>
      <ShareSheet
        open={open}
        onClose={() => setOpen(false)}
        personId={selectedId}
      />
    </>
  );
}
