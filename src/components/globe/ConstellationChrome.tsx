import { LEGEND_ORDER, LINK_STYLES } from "./constellation-utils";

interface ConstellationChromeProps {
  /** 时间轴最小年份 */
  minYear: number;
  /** 时间轴最大年份 */
  maxYear: number;
  /** 当前时间轴值 */
  year: number;
  onYearChange: (y: number) => void;
  /** 是否显示初始加载文案 */
  showIntro: boolean;
}

/**
 * 星群界面的"外饰层"（chrome）：
 * - 左下角图例（联结光谱，常驻）
 * - 右下角时间轴滑块
 * - 中央初始加载文案
 * 搜索 / 筛选条放在 NetworkGraph 主组件内（需访问 fgRef 聚焦）
 */
export default function ConstellationChrome({
  minYear,
  maxYear,
  year,
  onYearChange,
  showIntro,
}: ConstellationChromeProps) {
  return (
    <>
      {/* 左下角图例：联结光谱 */}
      <div className="cg-glass pointer-events-auto absolute bottom-3 left-3 z-20 rounded-xl border p-3">
        <div className="mb-1.5 text-[10px] uppercase tracking-wider text-muted-foreground/80">
          联结光谱
        </div>
        <ul className="space-y-1.5">
          {LEGEND_ORDER.map((t) => {
            const s = LINK_STYLES[t];
            // dash[0]===1 视为点线，否则虚线，null 为实线
            const style = s.dash
              ? s.dash[0] === 1
                ? "dotted"
                : "dashed"
              : "solid";
            return (
              <li
                key={t}
                className="flex items-center gap-2 text-[11px] text-foreground/85"
              >
                <span
                  className="cg-legend-line"
                  style={{
                    borderColor: s.color,
                    borderTopStyle: style,
                    boxShadow: s.glow ? `0 0 6px ${s.color}` : undefined,
                  }}
                />
                <span>{s.label}</span>
              </li>
            );
          })}
        </ul>
      </div>

      {/* 右下角时间轴滑块 */}
      <div className="cg-glass pointer-events-auto absolute bottom-3 right-3 z-20 w-[min(360px,calc(100%-360px))] min-w-[220px] rounded-xl border p-3">
        <div className="mb-1.5 flex items-center justify-between text-[10px] uppercase tracking-wider text-muted-foreground/80">
          <span>时间轴</span>
          <span className="text-[#F5D980]/90">{year} 年及以前</span>
        </div>
        <input
          type="range"
          min={minYear}
          max={maxYear}
          value={year}
          step={1}
          onChange={(e) => onYearChange(Number(e.target.value))}
          className="cg-range w-full"
        />
        <div className="mt-1 flex justify-between text-[9px] text-muted-foreground/60">
          <span>{minYear}</span>
          <span>{maxYear}</span>
        </div>
      </div>

      {/* 初始加载文案 */}
      {showIntro && (
        <div className="cg-intro pointer-events-none absolute inset-0 z-30 flex items-center justify-center">
          <p className="cg-intro-text text-center text-lg font-serif">
            她们一直都在，只是没人点亮
          </p>
        </div>
      )}
    </>
  );
}
