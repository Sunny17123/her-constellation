import { ReactNode } from "react";
import { useGlobeSelection } from "@/hooks/useGlobeSelection";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { allPeople, allConnections } = useGlobeSelection();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* 顶部导航 */}
      <header className="fixed top-0 left-0 right-0 z-50 p-6 pointer-events-none">
        <div className="flex items-center justify-between pointer-events-auto">
          <div>
            <h1 className="text-xl font-serif tracking-wide text-primary">
              ✦ Her Constellation
            </h1>
            <p className="text-xs text-muted-foreground mt-1 hidden sm:block">
              她们一直都在，只是没人点亮
            </p>
          </div>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="relative">{children}</main>

      {/* 左下角计数 */}
      <footer className="fixed bottom-6 left-6 z-40 text-xs text-muted-foreground pointer-events-none">
        <p>
          已点亮 {allPeople.length} 位 · {allConnections.length} 条呼应
        </p>
      </footer>
    </div>
  );
}