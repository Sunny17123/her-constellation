import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AdditiveBlending,
  Group,
  Mesh,
  MeshBasicMaterial,
  SphereGeometry,
} from "three";
import Globe, { type GlobeInstance } from "globe.gl";
import { useGlobeSelection } from "@/hooks/useGlobeSelection";

// 回退到上一版：深蓝夜空、暖色球形光点、连续暖色弧线与移动虚线光段。
const EARTH_DARK = "/textures/earth-night.jpg";
const STARLIGHT = "#F4D9A6";
const STARLIGHT_BRIGHT = "#FFF7E0";
const STARLIGHT_RELATED = "#EFCF99";
const ARC_WARM = "rgba(214, 185, 137, 0.52)";
const ARC_BRIGHT = "rgba(255, 232, 178, 0.98)";

type PointDatum = {
  id: string;
  lat: number;
  lng: number;
  name: string;
  nameEn: string;
  period: string;
  themes: string[];
  phase: number;
  periodMs: number;
  altitude: number;
  visualColor: string;
  visualOpacity: number;
  visualScale: number;
};

type ArcDatum = {
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  altitude: number;
  color: string;
  id: string;
  label: string;
  active: boolean;
  dashLength: number;
  dashGap: number;
  dashInitialGap: number;
  dashAnimateTime: number;
  layer: "base" | "flow";
};

type RingDatum = {
  lat: number;
  lng: number;
  altitude: number;
  maxR: number;
  propagationSpeed: number;
  repeatPeriod: number;
  kind: "selected" | "hovered";
};

type StarGroup = Group & {
  userData: { core: Mesh; halo: Mesh };
};

function geographicDistance(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
) {
  const latDelta = a.lat - b.lat;
  let lngDelta = Math.abs(a.lng - b.lng);
  if (lngDelta > 180) lngDelta = 360 - lngDelta;
  return Math.sqrt(latDelta * latDelta + lngDelta * lngDelta);
}

function escapeLabel(value: string) {
  return value.replace(/[&<>'"]/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "'": "&#39;",
      '"': "&quot;",
    };
    return entities[character];
  });
}

function createStarObject(): StarGroup {
  const group = new Group() as StarGroup;
  const core = new Mesh(
    new SphereGeometry(0.9, 12, 8),
    new MeshBasicMaterial({
      color: STARLIGHT_BRIGHT,
      transparent: true,
      opacity: 1,
      blending: AdditiveBlending,
      depthWrite: false,
    })
  );
  const halo = new Mesh(
    new SphereGeometry(1.8, 12, 8),
    new MeshBasicMaterial({
      color: STARLIGHT,
      transparent: true,
      opacity: 0.12,
      blending: AdditiveBlending,
      depthWrite: false,
    })
  );
  group.userData = { core, halo };
  group.add(halo, core);
  return group;
}

export default function GlobeScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const globeRef = useRef<GlobeInstance | null>(null);
  const pointDataRef = useRef<PointDatum[]>([]);
  const starObjectsRef = useRef(new Map<string, StarGroup>());
  const cursorCoordsRef = useRef<{ lat: number; lng: number } | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastPaintRef = useRef(0);
  const autoRotateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const selectedIdRef = useRef<string | null>(null);
  const hoveredIdRef = useRef<string | null>(null);
  const reducedMotionRef = useRef(false);
  const pointerRef = useRef({ down: false, moved: false, startX: 0, startY: 0 });
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [activeArcId, setActiveArcId] = useState<string | null>(null);

  const {
    selectedId,
    selectedConnectionId,
    highlightTheme,
    allPeople,
    selectPerson,
    getEchoes,
    getEchoTarget,
  } = useGlobeSelection();

  selectedIdRef.current = selectedId;
  hoveredIdRef.current = hoveredId;

  const clearAutoRotateTimer = useCallback(() => {
    if (autoRotateTimerRef.current) {
      clearTimeout(autoRotateTimerRef.current);
      autoRotateTimerRef.current = null;
    }
  }, []);

  const pauseAutoRotate = useCallback(() => {
    clearAutoRotateTimer();
    if (globeRef.current) globeRef.current.controls().autoRotate = false;
  }, [clearAutoRotateTimer]);

  const scheduleAutoRotate = useCallback(() => {
    clearAutoRotateTimer();
    if (reducedMotionRef.current || selectedIdRef.current || hoveredIdRef.current) return;
    autoRotateTimerRef.current = setTimeout(() => {
      if (!selectedIdRef.current && !hoveredIdRef.current && globeRef.current) {
        globeRef.current.controls().autoRotate = true;
      }
    }, 6500);
  }, [clearAutoRotateTimer]);

  const relatedIds = useMemo(() => {
    const ids = new Set<string>();
    if (selectedId) {
      getEchoes(selectedId).forEach((connection) => {
        const target = getEchoTarget(connection, selectedId);
        if (target) ids.add(target.id);
      });
    }
    return ids;
  }, [getEchoTarget, getEchoes, selectedId]);

  const paintPoints = useCallback(
    (timestamp: number) => {
      const cursor = cursorCoordsRef.current;
      pointDataRef.current.forEach((point) => {
        const isSelected = point.id === selectedId;
        const isHovered = point.id === hoveredId;
        const isRelated = relatedIds.has(point.id);
        const isThemeDimmed = Boolean(
          highlightTheme && !point.themes.includes(highlightTheme)
        );
        const isDimmed = Boolean(
          (selectedId && !isSelected && !isRelated) ||
            (isThemeDimmed && !isSelected)
        );
        const pulse = reducedMotionRef.current
          ? 0.5
          : 0.5 + 0.5 * Math.sin(timestamp / point.periodMs + point.phase);
        const proximity = cursor
          ? Math.max(0, 1 - geographicDistance(cursor, point) / 18)
          : 0;

        let color = STARLIGHT;
        let opacity = 0.44 + pulse * 0.2;
        let coreScale = 0.82 + pulse * 0.16;
        let haloScale = 0.9 + pulse * 0.18;

        if (isDimmed) {
          opacity = 0.16;
          coreScale = 0.7;
          haloScale = 0.76;
        }
        if (isRelated) {
          color = STARLIGHT_RELATED;
          opacity = 0.8;
          coreScale = 1.02 + pulse * 0.14;
          haloScale = 1.1 + pulse * 0.2;
        }
        if (proximity > 0 && !isDimmed) {
          opacity = Math.min(0.92, opacity + proximity * 0.34);
          coreScale += proximity * 0.42;
          haloScale += proximity * 0.72;
        }
        if (isHovered) {
          color = STARLIGHT_BRIGHT;
          opacity = 1;
          coreScale = 1.24 + pulse * 0.18;
          haloScale = 1.42 + pulse * 0.24;
        }
        if (isSelected) {
          color = STARLIGHT_BRIGHT;
          opacity = 1;
          coreScale = 1.45 + pulse * 0.22;
          haloScale = 1.7 + pulse * 0.3;
        }

        const star = starObjectsRef.current.get(point.id);
        if (!star) return;
        const coreMaterial = star.userData.core.material as MeshBasicMaterial;
        const haloMaterial = star.userData.halo.material as MeshBasicMaterial;
        star.userData.core.scale.setScalar(coreScale);
        star.userData.halo.scale.setScalar(haloScale);
        coreMaterial.color.set(color);
        coreMaterial.opacity = opacity;
        haloMaterial.color.set(color);
        haloMaterial.opacity = Math.min(0.2, opacity * (0.045 + pulse * 0.04));
      });
    },
    [highlightTheme, hoveredId, relatedIds, selectedId]
  );

  const refreshPointData = useCallback(() => {
    pointDataRef.current = allPeople.map((person, index) => ({
      id: person.id,
      lat: person.coordinates.lat,
      lng: person.coordinates.lng,
      name: person.name_zh,
      nameEn: person.name_en,
      period: person.time_period,
      themes: person.themes,
      phase: (index * 1.87) % (Math.PI * 2),
      periodMs: 3200 + (index % 4) * 420,
      altitude: 0.012,
      visualColor: STARLIGHT,
      visualOpacity: 0.55,
      visualScale: 0.56,
    }));
    globeRef.current?.customLayerData([...pointDataRef.current]);
  }, [allPeople]);

  const updateRings = useCallback(() => {
    const globe = globeRef.current;
    if (!globe) return;
    const rings: RingDatum[] = [];
    const selectedPerson = selectedId
      ? allPeople.find((person) => person.id === selectedId)
      : null;
    const hoveredPerson = hoveredId
      ? allPeople.find((person) => person.id === hoveredId)
      : null;

    if (selectedPerson) {
      rings.push({
        lat: selectedPerson.coordinates.lat,
        lng: selectedPerson.coordinates.lng,
        altitude: 0.013,
        maxR: 4.5,
        propagationSpeed: 1.2,
        repeatPeriod: 3400,
        kind: "selected",
      });
    }
    if (hoveredPerson && hoveredPerson.id !== selectedPerson?.id) {
      rings.push({
        lat: hoveredPerson.coordinates.lat,
        lng: hoveredPerson.coordinates.lng,
        altitude: 0.01,
        maxR: 2.7,
        propagationSpeed: 0.9,
        repeatPeriod: 2300,
        kind: "hovered",
      });
    }

    globe
      .ringsData(rings)
      .ringAltitude("altitude")
      .ringMaxRadius("maxR")
      .ringPropagationSpeed("propagationSpeed")
      .ringRepeatPeriod("repeatPeriod")
      .ringColor((ring: object) => (t: number) => {
        const datum = ring as RingDatum;
        const alpha = (datum.kind === "selected" ? 0.5 : 0.28) * (1 - t);
        return `rgba(255, 224, 166, ${Math.max(0, alpha)})`;
      });
  }, [allPeople, hoveredId, selectedId]);

  const updateArcs = useCallback(() => {
    const globe = globeRef.current;
    if (!globe || !selectedId) {
      globe?.arcsData([]);
      return;
    }
    const source = allPeople.find((person) => person.id === selectedId);
    if (!source) return;

    const arcs: ArcDatum[] = getEchoes(selectedId).flatMap((connection) => {
      const target = getEchoTarget(connection, selectedId);
      if (!target) return [];
      const distance = geographicDistance(source.coordinates, target.coordinates);
      const base = {
        startLat: source.coordinates.lat,
        startLng: source.coordinates.lng,
        endLat: target.coordinates.lat,
        endLng: target.coordinates.lng,
        altitude: Math.min(0.3, 0.1 + distance / 760),
        id: connection.id,
        label: `${target.name_zh} · ${connection.shared_theme}`,
      };
      const active = connection.id === activeArcId;
      return [
        {
          ...base,
          color: active ? "rgba(255, 230, 174, 0.76)" : "rgba(214, 185, 137, 0.34)",
          active: false,
          dashLength: 1,
          dashGap: 0,
          dashInitialGap: 0,
          dashAnimateTime: 0,
          layer: "base" as const,
        },
        {
          ...base,
          color: active ? ARC_BRIGHT : ARC_WARM,
          active,
          dashLength: active ? 0.12 : 0.07,
          dashGap: active ? 0.88 : 0.93,
          dashInitialGap: active ? 0 : Math.abs(connection.id.length * 0.11) % 1,
          dashAnimateTime: active ? 1450 : 4800,
          layer: "flow" as const,
        },
      ];
    });

    globe
      .arcsData(arcs)
      .arcStartLat("startLat")
      .arcStartLng("startLng")
      .arcEndLat("endLat")
      .arcEndLng("endLng")
      .arcAltitude("altitude")
      .arcColor("color")
      .arcStroke((arc: object) => {
        const datum = arc as ArcDatum;
        return datum.layer === "base"
          ? datum.active
            ? 0.78
            : 0.55
          : datum.active
            ? 1.35
            : 0.68;
      })
      .arcDashLength("dashLength")
      .arcDashGap("dashGap")
      .arcDashInitialGap("dashInitialGap")
      .arcDashAnimateTime("dashAnimateTime")
      .arcLabel((arc: object) => {
        const datum = arc as ArcDatum;
        return datum.layer === "flow" ? datum.label : "";
      })
      .arcsTransitionDuration(420);
  }, [activeArcId, allPeople, getEchoTarget, getEchoes, selectedId]);

  useEffect(() => {
    if (selectedId && selectedConnectionId) {
      const connection = getEchoes(selectedId).find(
        (candidate) => candidate.id === selectedConnectionId
      );
      const target = connection ? getEchoTarget(connection, selectedId) : null;
      if (target) {
        setActiveArcId(selectedConnectionId);
        const timer = setTimeout(() => selectPerson(target.id), 900);
        return () => clearTimeout(timer);
      }
    }
    setActiveArcId(null);
    return undefined;
  }, [getEchoTarget, getEchoes, selectPerson, selectedConnectionId, selectedId]);

  useEffect(() => {
    if (!containerRef.current) return;
    reducedMotionRef.current = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const container = containerRef.current;
    const globe = new Globe(container)
      .backgroundColor("rgba(5, 10, 18, 0)")
      .backgroundImageUrl("/textures/night-sky.png")
      .showAtmosphere(true)
      .atmosphereColor("#4F94A3")
      .atmosphereAltitude(0.12)
      .globeImageUrl(EARTH_DARK)
      .width(container.clientWidth)
      .height(container.clientHeight)
      .pointLabel((point: object) => {
        const datum = point as PointDatum;
        return `<div style="padding:7px 10px;border:1px solid rgba(214,185,137,.32);border-radius:8px;background:rgba(5,10,18,.9);color:#f5e8ca;font:12px/1.45 Inter,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.28)"><strong>${escapeLabel(datum.name)}</strong><br/><span style="opacity:.62">${escapeLabel(datum.nameEn)} · ${escapeLabel(datum.period)}</span></div>`;
      });

    globe
      .customLayerData(pointDataRef.current)
      .customThreeObject(() => createStarObject())
      .customThreeObjectUpdate((object, data) => {
        const datum = data as PointDatum;
        const star = object as StarGroup;
        starObjectsRef.current.set(datum.id, star);
        Object.assign(star.position, globe.getCoords(datum.lat, datum.lng, datum.altitude));
      })
      .onCustomLayerClick((point: object) => {
        if (!pointerRef.current.moved) selectPerson((point as PointDatum).id);
      })
      .onCustomLayerHover((point: object | null) => {
        const nextId = point ? (point as PointDatum).id : null;
        setHoveredId(nextId);
        if (nextId) pauseAutoRotate();
        else if (!selectedIdRef.current) scheduleAutoRotate();
      });

    const controls = globe.controls();
    controls.autoRotate = !reducedMotionRef.current;
    controls.autoRotateSpeed = 0.045;
    controls.enableZoom = true;
    controls.enablePan = false;
    globeRef.current = globe;

    const onPointerDown = (event: PointerEvent) => {
      pointerRef.current = {
        down: true,
        moved: false,
        startX: event.clientX,
        startY: event.clientY,
      };
      pauseAutoRotate();
    };
    const onPointerMove = (event: PointerEvent) => {
      if (pointerRef.current.down) {
        const dx = Math.abs(event.clientX - pointerRef.current.startX);
        const dy = Math.abs(event.clientY - pointerRef.current.startY);
        if (dx > 8 || dy > 8) pointerRef.current.moved = true;
      }
      if (pointerRef.current.moved) return;

      const rect = container.getBoundingClientRect();
      const coords = globe.toGlobeCoords(
        event.clientX - rect.left,
        event.clientY - rect.top
      );
      if (!coords) {
        cursorCoordsRef.current = null;
        setHoveredId(null);
        return;
      }
      cursorCoordsRef.current = coords;
      const nearest = allPeople.reduce<{ id: string; distance: number } | null>(
        (best, person) => {
          const distance = geographicDistance(coords, person.coordinates);
          return !best || distance < best.distance
            ? { id: person.id, distance }
            : best;
        },
        null
      );
      const nextHoveredId = nearest && nearest.distance < 13 ? nearest.id : null;
      setHoveredId((previous) => (previous === nextHoveredId ? previous : nextHoveredId));
    };
    const onPointerUp = () => {
      pointerRef.current.down = false;
      if (!pointerRef.current.moved && !selectedIdRef.current && !hoveredIdRef.current) {
        scheduleAutoRotate();
      }
    };
    const onPointerLeave = () => {
      cursorCoordsRef.current = null;
      setHoveredId(null);
      if (!selectedIdRef.current) scheduleAutoRotate();
    };
    const onResize = () => globe.width(container.clientWidth).height(container.clientHeight);

    container.addEventListener("pointerdown", onPointerDown);
    container.addEventListener("pointermove", onPointerMove);
    container.addEventListener("pointerup", onPointerUp);
    container.addEventListener("pointerleave", onPointerLeave);
    window.addEventListener("resize", onResize);

    return () => {
      clearAutoRotateTimer();
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      window.removeEventListener("resize", onResize);
      container.removeEventListener("pointerdown", onPointerDown);
      container.removeEventListener("pointermove", onPointerMove);
      container.removeEventListener("pointerup", onPointerUp);
      container.removeEventListener("pointerleave", onPointerLeave);
      globe._destructor();
      globeRef.current = null;
      starObjectsRef.current.clear();
    };
  }, [allPeople, clearAutoRotateTimer, pauseAutoRotate, scheduleAutoRotate, selectPerson]);

  useEffect(() => {
    refreshPointData();
    updateArcs();
  }, [refreshPointData, updateArcs]);

  useEffect(() => {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    const animate = (timestamp: number) => {
      if (timestamp - lastPaintRef.current > 42) {
        lastPaintRef.current = timestamp;
        paintPoints(timestamp);
      }
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    animationFrameRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    };
  }, [paintPoints]);

  useEffect(() => {
    updateRings();
    if (selectedId || hoveredId) pauseAutoRotate();
    else scheduleAutoRotate();
  }, [hoveredId, pauseAutoRotate, scheduleAutoRotate, selectedId, updateRings]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
      style={{
        background:
          "radial-gradient(circle at 50% 46%, rgba(18, 48, 67, 0.28), transparent 42%), linear-gradient(160deg, #050A12 0%, #081521 52%, #040912 100%)",
      }}
    />
  );
}
