import { useEffect, useRef, useCallback } from "react";
import ForceGraph2D from "react-force-graph-2d";
import { useNavigate } from "react-router-dom";
import { useGlobeSelection } from "@/hooks/useGlobeSelection";
import { getThemeColor } from "@/data/load";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function NetworkGraph() {
  const containerRef = useRef<HTMLDivElement>(null);
  const fgRef = useRef<any>(null);
  const navigate = useNavigate();
  const { allPeople, allConnections, selectPerson } = useGlobeSelection();

  const graphData = useCallback(() => {
    const nodes = allPeople.map((p) => {
      const connCount = allConnections.filter(
        (c) => c.source_id === p.id || c.target_id === p.id
      ).length;
      return {
        id: p.id,
        name: p.name_zh,
        nameEn: p.name_en,
        theme: p.themes[0],
        color: getThemeColor(p.themes[0]),
        val: Math.max(1, connCount), // 联结越多圆越大
      };
    });

    const links = allConnections.map((c) => ({
      source: c.source_id,
      target: c.target_id,
      theme: c.shared_theme,
      color: getThemeColor(c.shared_theme),
      label: c.shared_theme,
    }));

    return { nodes, links };
  }, [allPeople, allConnections]);

  useEffect(() => {
    const fg = fgRef.current;
    if (!fg) return;

    // 初始化后自动缩放
    setTimeout(() => {
      fg.zoomToFit(400, 50);
    }, 500);
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* 顶部栏 */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          返回地球
        </Button>
        <h2 className="text-lg font-serif text-foreground">
          她的星群
        </h2>
        <div className="text-xs text-muted-foreground">
          {allPeople.length} 位 · {allConnections.length} 条呼应
        </div>
      </div>

      {/* 力导向图 */}
      <div ref={containerRef} className="flex-1">
        <ForceGraph2D
          ref={fgRef}
          graphData={graphData()}
          width={containerRef.current?.clientWidth ?? window.innerWidth}
          height={containerRef.current?.clientHeight ?? window.innerHeight - 60}
          nodeLabel={(n: any) => `${n.name}\n${n.nameEn}`}
          nodeColor={(n: any) => n.color}
          nodeVal={(n: any) => n.val}
          linkColor={(l: any) => `${l.color}40`}
          linkLabel={(l: any) => l.label}
          linkWidth={1}
          linkDirectionalParticles={2}
          linkDirectionalParticleWidth={1.5}
          linkDirectionalParticleColor={(l: any) => l.color}
          linkDirectionalParticleSpeed={0.003}
          onNodeClick={(n: any) => {
            selectPerson(n.id);
            navigate("/");
          }}
          backgroundColor="rgba(7,11,20,0)"
          cooldownTicks={100}
          d3AlphaDecay={0.02}
          d3VelocityDecay={0.3}
        />
      </div>

      {/* 底部提示 */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-xs text-muted-foreground pointer-events-none">
        点击任一节点回到地球视图
      </div>
    </div>
  );
}