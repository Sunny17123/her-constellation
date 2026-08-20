import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useGlobeSelection } from "@/hooks/useGlobeSelection";
import SurpriseMe from "@/components/ui/SurpriseMe";
import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const { allPeople, allConnections } = useGlobeSelection();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* 顶部导航 */}
      <header className="fixed top-0 left-0 right-0 z-50 p-4 md:p-6">
        <div className="flex items-center justify-between">
            <div className="pointer-events-none">
              <h1 className="text-lg md:text-xl font-serif tracking-wide text-primary">
                ✦ Her Constellation
              </h1>
              <p className="text-xs text-muted-foreground mt-1 hidden sm:block">
                她们一直都在，只是没人点亮
              </p>
            </div>
            <SurpriseMe />
          </div>
      </header>

      {/* 主内容区 */}
      <main className="relative">{children}</main>

      {/* 左下角计数 + 网络视图入口 */}
      <footer className="fixed bottom-6 left-6 z-40 flex items-center gap-4">
        <p className="text-xs text-muted-foreground pointer-events-none">
          已点亮 {allPeople.length} 位 · {allConnections.length} 条呼应
        </p>
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
    </div>
  );
}