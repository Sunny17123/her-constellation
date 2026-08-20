import { Sparkles } from "lucide-react";
import { useGlobeSelection } from "@/hooks/useGlobeSelection";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { Button } from "@/components/ui/button";

export default function SurpriseMe() {
  const isMobile = useMediaQuery("(max-width: 767px)");
  const { surpriseMe, selectedId } = useGlobeSelection();

  const handleSurprise = () => {
    surpriseMe();
  };

  return (
    <>
      {/* 桌面端：右上角按钮 */}
      {!isMobile && (
        <div className="relative group">
          <Button
            onClick={handleSurprise}
            variant="outline"
            size="sm"
            className="gap-2 border-primary/40 text-primary hover:bg-primary/10 hover:border-primary animate-pulse-star"
          >
            <Sparkles className="h-4 w-4" />
            Surprise Me
          </Button>
          {!selectedId && (
            <span className="absolute -bottom-6 right-0 text-xs text-muted-foreground whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
              不知道从哪里开始？点我
            </span>
          )}
        </div>
      )}

      {/* 移动端：右下角 FAB */}
      {isMobile && (
        <button
          onClick={handleSurprise}
          className="fixed right-5 bottom-24 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 flex items-center justify-center active:scale-95 transition-transform animate-pulse-star"
        >
          <Sparkles className="h-6 w-6" />
        </button>
      )}
    </>
  );
}