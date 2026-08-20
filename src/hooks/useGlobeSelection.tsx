import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { getAllPeople, getAllConnections, getConnectionsForPerson } from "@/data/load";
import type { Person, Connection } from "@/data/schema";

interface GlobeSelectionState {
  /** 当前选中的光点 id */
  selectedId: string | null;
  /** 当前选中的联结 id（用于弧线高亮） */
  selectedConnectionId: string | null;
  /** 当前筛选的议题 key */
  highlightTheme: string | null;
  /** 所有人物的结构化数据 */
  allPeople: Person[];
  /** 所有联结 */
  allConnections: Connection[];
  /** 切换选中人物 */
  selectPerson: (id: string | null) => void;
  /** 切换选中联结 */
  selectConnection: (id: string | null) => void;
  /** 设置议题筛选 */
  setHighlightTheme: (theme: string | null) => void;
  /** 获取某人的联结 */
  getEchoes: (personId: string) => Connection[];
  /** 获取某人联结的对方人物 */
  getEchoTarget: (connection: Connection, sourceId: string) => Person | null;
  /** 选择一个随机人物（Surprise Me） */
  surpriseMe: () => Person | null;
}

const GlobeSelectionContext = createContext<GlobeSelectionState | null>(null);

export function GlobeSelectionProvider({ children }: { children: ReactNode }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);
  const [highlightTheme, setHighlightTheme] = useState<string | null>(null);

  const allPeople = getAllPeople();
  const allConnections = getAllConnections();

  const selectPerson = useCallback((id: string | null) => {
    setSelectedId(id);
    setSelectedConnectionId(null); // 切换人物时清除联结选中
  }, []);

  const selectConnection = useCallback((id: string | null) => {
    setSelectedConnectionId(id);
  }, []);

  const getEchoes = useCallback(
    (personId: string): Connection[] => {
      return getConnectionsForPerson(personId);
    },
    []
  );

  const getEchoTarget = useCallback(
    (connection: Connection, sourceId: string): Person | null => {
      const targetId =
        connection.source_id === sourceId
          ? connection.target_id
          : connection.source_id;
      return allPeople.find((p) => p.id === targetId) ?? null;
    },
    [allPeople]
  );

  const surpriseMe = useCallback((): Person | null => {
    // 冷启动精选池：starter_score >= 7
    const pool = allPeople.filter((p) => (p.starter_score ?? 5) >= 7);
    const candidates = pool.length > 0 ? pool : allPeople;

    // 排除当前选中的
    const filtered = candidates.filter((p) => p.id !== selectedId);
    if (filtered.length === 0) return null;

    // 议题优先加权
    if (highlightTheme) {
      const themed = filtered.filter((p) => p.themes.includes(highlightTheme as any));
      if (themed.length > 0) {
        const pick = themed[Math.floor(Math.random() * themed.length)];
        setSelectedId(pick.id);
        setSelectedConnectionId(null);
        return pick;
      }
    }

    const pick = filtered[Math.floor(Math.random() * filtered.length)];
    setSelectedId(pick.id);
    setSelectedConnectionId(null);
    return pick;
  }, [allPeople, selectedId, highlightTheme]);

  const value: GlobeSelectionState = {
    selectedId,
    selectedConnectionId,
    highlightTheme,
    allPeople,
    allConnections,
    selectPerson,
    selectConnection,
    setHighlightTheme,
    getEchoes,
    getEchoTarget,
    surpriseMe,
  };

  return (
    <GlobeSelectionContext.Provider value={value}>
      {children}
    </GlobeSelectionContext.Provider>
  );
}

export function useGlobeSelection(): GlobeSelectionState {
  const ctx = useContext(GlobeSelectionContext);
  if (!ctx) {
    throw new Error(
      "useGlobeSelection must be used within <GlobeSelectionProvider>"
    );
  }
  return ctx;
}