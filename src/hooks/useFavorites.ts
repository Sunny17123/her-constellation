import {
  createContext,
  createElement,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";

/**
 * 收藏状态：localStorage 持久化 + Context 共享
 *
 * 接口契约（见 docs/TEAM_COLLABORATION_v2.md 协调点 8）：
 *   { favorites: string[], isFavorite(id), toggleFavorite(id) }
 * ⚠️ 团队文档原写 Set<string>，此处用 string[]（JSON 序列化友好），差异已标注在集成说明中。
 *
 * 消费方（队友实现）：
 * - GlobeScene：已收藏光点加特殊标记（星形边框/光晕）
 * - SummaryCard / DetailPanel：收藏按钮，onClick 调 toggleFavorite(person.id)
 */

const STORAGE_KEY = "her-constellation:favorites";

interface FavoritesState {
  /** 已收藏的 person id 列表 */
  favorites: string[];
  isFavorite: (id: string) => boolean;
  toggleFavorite: (id: string) => void;
}

const FavoritesContext = createContext<FavoritesState | null>(null);

function loadFavorites(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is string => typeof x === "string");
  } catch {
    // 数据损坏 / 隐私模式：静默降级为空列表
    return [];
  }
}

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<string[]>(loadFavorites);

  // 持久化到 localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
    } catch {
      // 存储不可用（隐私模式/配额）：忽略，会话内功能仍可用
    }
  }, [favorites]);

  const isFavorite = useCallback(
    (id: string) => favorites.includes(id),
    [favorites]
  );

  const toggleFavorite = useCallback((id: string) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }, []);

  // 注：本文件按团队文档命名为 .ts，JSX 不可用，用 createElement 替代
  return createElement(
    FavoritesContext.Provider,
    { value: { favorites, isFavorite, toggleFavorite } },
    children
  );
}

export function useFavorites(): FavoritesState {
  const ctx = useContext(FavoritesContext);
  if (!ctx) {
    throw new Error("useFavorites must be used within <FavoritesProvider>");
  }
  return ctx;
}
