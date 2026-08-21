import { z } from "zod";
import { Person, PersonSchema, Connection, ConnectionSchema } from "./schema";
import { THEMES } from "../../data/themes";

/**
 * 数据加载工具
 *
 * 懒加载：数据经 preloadData() 动态 import（Vite 构建时拆为独立异步 chunk），
 * 由 DataGate 在挂载应用前完成加载与 zod 校验；同步 getter 供渲染期使用（命中缓存）。
 * 未来适配：一人一档后可改为 import.meta.glob('../data/people/*.json')
 */

// 缓存
let peopleCache: Person[] | null = null;
let connectionsCache: Connection[] | null = null;
let loadPromise: Promise<void> | null = null;

/** 数据校验/加载失败（DataGate 应已拦截此路径，此异常为兜底） */
export class DataLoadError extends Error {}

/**
 * 预加载并校验全部数据（动态 import + zod safeParse）
 *
 * - 成功/进行中复用同一 Promise（StrictMode 双挂载安全）
 * - 失败时重置 loadPromise，使 DataGate 的"重试"可真正重新加载
 */
export function preloadData(): Promise<void> {
  if (peopleCache && connectionsCache) return Promise.resolve();
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    const [storiesMod, connectionsMod] = await Promise.all([
      import("../../data/stories.json"),
      import("../../data/connections.json"),
    ]);

    const people = z.array(PersonSchema).safeParse(storiesMod.default);
    if (!people.success) {
      throw new DataLoadError("人物数据校验失败：" + people.error.message);
    }

    const connections = z.array(ConnectionSchema).safeParse(
      connectionsMod.default
    );
    if (!connections.success) {
      throw new DataLoadError("联结数据校验失败：" + connections.error.message);
    }

    peopleCache = people.data;
    connectionsCache = connections.data;
  })().catch((err) => {
    loadPromise = null;
    throw err;
  });

  return loadPromise;
}

function requireLoaded(): void {
  if (!peopleCache || !connectionsCache) {
    throw new DataLoadError("数据尚未加载完成（DataGate 应已拦截此路径）");
  }
}

/**
 * 获取所有人物（带 zod 校验，需先 preloadData）
 */
export function getAllPeople(): Person[] {
  requireLoaded();
  return peopleCache!;
}

/**
 * 根据 id 获取人物
 */
export function getPersonById(id: string): Person | null {
  return getAllPeople().find((p) => p.id === id) ?? null;
}

/**
 * 获取所有联结（带 zod 校验，需先 preloadData）
 */
export function getAllConnections(): Connection[] {
  requireLoaded();
  return connectionsCache!;
}

/**
 * 获取某人物的所有联结
 */
export function getConnectionsForPerson(personId: string): Connection[] {
  const connections = getAllConnections();
  return connections.filter(
    (c) => c.source_id === personId || c.target_id === personId
  );
}

/**
 * 获取主题颜色
 */
export function getThemeColor(themeKey: string): string {
  const theme = THEMES[themeKey as keyof typeof THEMES];
  return theme?.color ?? "#999999";
}
