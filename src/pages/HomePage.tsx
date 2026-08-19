import GlobeScene from "@/components/globe/GlobeScene";

export default function HomePage() {
  return (
    <div className="relative w-full h-screen">
      <GlobeScene />

      {/* 引导文案 - 冷启动提示 */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10">
        <p className="text-center text-muted-foreground text-sm">
          拖动地球，点击光点，遇见一位女性
        </p>
      </div>
    </div>
  );
}
