import { useState, useCallback } from "react";
import GlobeScene from "@/components/globe/GlobeScene";
import SummaryCard from "@/components/ui/SummaryCard";
import DetailPanel from "@/components/ui/DetailPanel";
import StatsDialog from "@/components/ui/StatsDialog";

export default function HomePage() {
  const [showDetail, setShowDetail] = useState(false);

  const handleOpenDetail = useCallback(() => {
    setShowDetail(true);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setShowDetail(false);
  }, []);

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* 3D 地球 */}
      <GlobeScene />

      {/* 引导文案 - 无选中时显示 */}
      {!showDetail && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10 hidden md:block">
          <p className="text-center text-muted-foreground/60 text-sm">
            拖动地球，点击光点，遇见一位女性
          </p>
        </div>
      )}

      {/* 摘要卡（右下角） */}
      <SummaryCard onOpenDetail={handleOpenDetail} />

      {/* 数据统计入口（左下角） */}
      <StatsDialog />

      {/* 详情面板（右侧滑出） */}
      {showDetail && <DetailPanel onClose={handleCloseDetail} />}
    </div>
  );
}