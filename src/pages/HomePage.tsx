import { useState, useCallback } from "react";
import GlobeScene from "@/components/globe/GlobeScene";
import SummaryCard from "@/components/ui/SummaryCard";
import DetailPanel from "@/components/ui/DetailPanel";

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

      {/* 引导文案：避开地球中心，让地球和人物光点保持完整可见 */}
      {!showDetail && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 pointer-events-none z-10 hidden md:block">
          <p className="text-center text-muted-foreground/55 text-xs tracking-wide">
            拖动地球，点击光点，遇见一位女性
          </p>
        </div>
      )}

      {/*
        摘要与详情是同一条探索路径的两个连续阶段。
        打开详情时卸载摘要卡，避免桌面端的重复卡片和移动端两个 Drawer 同时抢占焦点、滚动与关闭手势；
        关闭详情后 selectedId 保留，因此摘要卡会自然恢复。
      */}
      {!showDetail && <SummaryCard onOpenDetail={handleOpenDetail} />}

      {/* 详情面板（右侧滑出 / 移动端全屏抽屉） */}
      {showDetail && <DetailPanel onClose={handleCloseDetail} />}
    </div>
  );
}