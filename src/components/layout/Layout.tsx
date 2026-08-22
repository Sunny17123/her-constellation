import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import SurpriseMe from "@/components/ui/SurpriseMe";
import FeelingShareFab from "@/components/share/FeelingShareFab";
import SearchPanel from "@/components/search/SearchPanel";
import StatsDialog from "@/components/ui/StatsDialog";
import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* 顶部导航：pointer-events-none 让 header 透明区域不拦截下方 fixed 元素点击，
          交互子元素（搜索栏/下拉面板、SurpriseMe）各自 pointer-events-auto */}
      <header className="fixed top-0 left-0 right-0 z-50 p-4 md:p-6 pointer-events-none">
        <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="pointer-events-none">
                <h1 className="text-lg md:text-xl font-serif tracking-wide text-primary">
                  ✦ Her Constellation
                </h1>
                <p className="text-xs text-muted-foreground mt-1 hidden sm:block">
                  她们一直都在，只是没人点亮
                </p>
              </div>
              {/* 主题探索搜索栏（logo 下方） */}
              <div className="mt-3">
                <SearchPanel />
              </div>
            </div>
            <div className="pointer-events-auto">
              <SurpriseMe />
            </div>
          </div>
      </header>

      {/* 主内容区 */}
      <main className="relative">{children}</main>

      {/* 左下角计数 + 网络视图入口 */}
      <footer className="fixed bottom-6 left-6 z-40 flex items-center gap-4">
        <StatsDialog />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/network")}
          className="text-xs text-muted-foreground hover:text-secondary-foreground gap-1.5"
        >
          <Share2 className="h-3 w-3" />
          查看星群网络
        </Button>
      </footer>

      {/* 分享感受入口（自定位） */}
      <FeelingShareFab />
    </div>
  );
}
