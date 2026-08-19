import { useEffect, useRef } from "react";
import Globe from "globe.gl";
import { getAllPeople, getThemeColor } from "@/data/load";

export default function GlobeScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const globeRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // 初始化 globe.gl 实例
    const globe = new Globe(containerRef.current)
      .backgroundColor("rgba(7,11,20,0)")  // 透明背景，使用 CSS 背景
      .showAtmosphere(true)
      .atmosphereColor("#4ECDC4")
      .atmosphereAltitude(0.15)
      .width(containerRef.current.clientWidth)
      .height(containerRef.current.clientHeight);

    // 地球材质 - 深色
    const globeMaterial = globe.globeMaterial() as any;
    globeMaterial.bumpScale = 10;
    // 简化版：暂不加载地球纹理，先用纯色

    // 加载人物光点
    const people = getAllPeople();
    const pointsData = people.map((p) => ({
      lat: p.coordinates.lat,
      lng: p.coordinates.lng,
      size: 0.5,
      color: getThemeColor(p.themes[0]),
      id: p.id,
      name: p.name_zh,
    }));

    globe
      .pointsData(pointsData)
      .pointColor("color")
      .pointAltitude(0.01)
      .pointRadius("size")
      .pointLabel("name")
      .onPointClick((point: any) => {
        console.log("Clicked:", point);
        // 跳转到详情页
        window.location.href = `/person/${point.id}`;
      });

    // 自动旋转
    globe.controls().autoRotate = true;
    globe.controls().autoRotateSpeed = 0.35;
    globe.controls().enableZoom = true;

    globeRef.current = globe;

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
      if (globeRef.current) {
        globeRef.current._destructor?.();
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
      style={{ background: "linear-gradient(to bottom, #070B14, #0D1420)" }}
    />
  );
}
