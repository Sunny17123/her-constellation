import { useEffect, useRef, useCallback } from "react";
import Globe from "globe.gl";
import { useGlobeSelection } from "@/hooks/useGlobeSelection";
import { getThemeColor } from "@/data/load";

// 地球纹理 - 深色主题
const EARTH_DARK = "//unpkg.com/three-globe/example/img/earth-dark.jpg";

export default function GlobeScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const globeRef = useRef<any>(null);

  // 拖拽检测
  const pointerRef = useRef({ down: false, moved: false, startX: 0, startY: 0 });

  const {
    selectedId,
    selectedConnectionId,
    highlightTheme,
    allPeople,
    allConnections,
    selectPerson,
    selectConnection,
    getEchoes,
    getEchoTarget,
  } = useGlobeSelection();

  // 初始化 globe.gl 实例
  useEffect(() => {
    if (!containerRef.current) return;

    const globe = new Globe(containerRef.current)
      .backgroundColor("rgba(7,11,20,0)")
      .showAtmosphere(true)
      .atmosphereColor("#4ECDC4")
      .atmosphereAltitude(0.15)
      .globeImageUrl(EARTH_DARK)
      .width(containerRef.current.clientWidth)
      .height(containerRef.current.clientHeight);

    // 自动旋转
    globe.controls().autoRotate = true;
    globe.controls().autoRotateSpeed = 0.35;
    globe.controls().enableZoom = true;

    globeRef.current = globe;

    // 拖拽检测
    const container = containerRef.current;
    const onPointerDown = (e: PointerEvent) => {
      pointerRef.current = {
        down: true,
        moved: false,
        startX: e.clientX,
        startY: e.clientY,
      };
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!pointerRef.current.down) return;
      const dx = Math.abs(e.clientX - pointerRef.current.startX);
      const dy = Math.abs(e.clientY - pointerRef.current.startY);
      if (dx > 8 || dy > 8) {
        pointerRef.current.moved = true;
      }
    };
    const onPointerUp = () => {
      pointerRef.current.down = false;
    };

    container.addEventListener("pointerdown", onPointerDown);
    container.addEventListener("pointermove", onPointerMove);
    container.addEventListener("pointerup", onPointerUp);

    // 响应式
    const handleResize = () => {
      if (containerRef.current && globeRef.current) {
        globeRef.current
          .width(containerRef.current.clientWidth)
          .height(containerRef.current.clientHeight);
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      container.removeEventListener("pointerdown", onPointerDown);
      container.removeEventListener("pointermove", onPointerMove);
      container.removeEventListener("pointerup", onPointerUp);
      if (globeRef.current) {
        globeRef.current._destructor?.();
      }
    };
  }, []);

  // 更新光点数据（响应 selectedId / highlightTheme 变化）
  const updatePoints = useCallback(() => {
    const globe = globeRef.current;
    if (!globe) return;

    const pointsData = allPeople.map((p) => {
      const isSelected = p.id === selectedId;
      const isDimmed =
        highlightTheme && !p.themes.includes(highlightTheme as any) && !isSelected;

      return {
        lat: p.coordinates.lat,
        lng: p.coordinates.lng,
        size: isSelected ? 0.8 : 0.45,
        color: isDimmed
          ? "rgba(100,100,120,0.3)"
          : getThemeColor(p.themes[0]),
        id: p.id,
        name: p.name_zh,
        nameEn: p.name_en,
        period: p.time_period,
        isSelected,
        altitude: isSelected ? 0.06 : 0.01,
      };
    });

    globe
      .pointsData(pointsData)
      .pointColor("color")
      .pointAltitude("altitude")
      .pointRadius("size")
      .pointLabel((d: any) =>
        `<b>${d.name}</b><br/>${d.nameEn}<br/>${d.period}`
      )
      .onPointClick((point: any) => {
        // 拖拽时不触发点击
        if (pointerRef.current.moved) return;
        selectPerson(point.id);
      });
  }, [allPeople, selectedId, highlightTheme, selectPerson]);

  // 更新联结弧线
  const updateArcs = useCallback(() => {
    const globe = globeRef.current;
    if (!globe) return;

    if (!selectedId) {
      // 无选中时：显示所有弧线，低透明度
      const arcs = allConnections.map((c) => {
        const src = allPeople.find((p) => p.id === c.source_id);
        const tgt = allPeople.find((p) => p.id === c.target_id);
        if (!src || !tgt) return null;
        return {
          startLat: src.coordinates.lat,
          startLng: src.coordinates.lng,
          endLat: tgt.coordinates.lat,
          endLng: tgt.coordinates.lng,
          color: "rgba(183, 156, 255, 0.15)",
          id: c.id,
        };
      }).filter(Boolean);

      globe.arcsData(arcs).arcColor("color").arcAltitude(0.2).arcStroke(0.8);
    } else {
      // 有选中时：只显示该人物的联结，高亮
      const echoes = getEchoes(selectedId);
      const arcs = echoes.map((c) => {
        const target = getEchoTarget(c, selectedId);
        const src = allPeople.find((p) => p.id === selectedId);
        if (!target || !src) return null;
        const isSelectedConn = c.id === selectedConnectionId;
        return {
          startLat: src.coordinates.lat,
          startLng: src.coordinates.lng,
          endLat: target.coordinates.lat,
          endLng: target.coordinates.lng,
          color: isSelectedConn
            ? "rgba(183, 156, 255, 1)"
            : "rgba(183, 156, 255, 0.6)",
          id: c.id,
          label: `${target.name_zh} · ${c.shared_theme}`,
        };
      }).filter(Boolean);

      globe
        .arcsData(arcs)
        .arcColor("color")
        .arcAltitude(0.2)
        .arcStroke(1.2)
        .arcLabel((d: any) => d.label || "");
    }
  }, [selectedId, selectedConnectionId, allConnections, allPeople, getEchoes, getEchoTarget]);

  // 相机聚焦
  const focusCamera = useCallback(() => {
    const globe = globeRef.current;
    if (!globe || !selectedId) return;

    const person = allPeople.find((p) => p.id === selectedId);
    if (!person) return;

    globe.pointOfView(
      {
        lat: person.coordinates.lat,
        lng: person.coordinates.lng,
        altitude: 1.6,
      },
      900
    );
  }, [selectedId, allPeople]);

  // 每次 selectedId 变化时更新
  useEffect(() => {
    updatePoints();
    updateArcs();
    if (selectedId) {
      focusCamera();
    }
  }, [updatePoints, updateArcs, focusCamera, selectedId]);

  // highlightTheme 变化时更新光点
  useEffect(() => {
    updatePoints();
  }, [highlightTheme, updatePoints]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
      style={{ background: "linear-gradient(to bottom, #070B14, #0D1420)" }}
    />
  );
}