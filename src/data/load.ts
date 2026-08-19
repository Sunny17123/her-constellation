import { Person, PersonSchema, Connection, ConnectionSchema } from "./schema";
import { THEMES } from "../../data/themes";

/**
 * 数据加载工具
 *
 * 当前实现：从根目录 data/ 读取 JSON
 * 未来适配：一人一档后可改为 import.meta.glob('../data/people/*.json')
 */

// 导入根目录数据（Vite 构建期会打包）
import storiesJson from "../../data/stories.json";
import connectionsJson from "../../data/connections.json";

// 缓存解析结果
let peopleCache: Person[] | null = null;
let connectionsCache: Connection[] | null = null;

/**
 * 获取所有人物（带 zod 校验）
 */
export function getAllPeople(): Person[] {
  if (peopleCache) return peopleCache;

  const result = z.array(PersonSchema).safeParse(storiesJson);
  if (!result.success) {
    console.error("人物数据校验失败:", result.error);
    throw new Error("数据格式错误，请检查 data/stories.json");
  }

  peopleCache = result.data;
  return peopleCache;
}

/**
 * 根据 id 获取人物
 */
export function getPersonById(id: string): Person | null {
  const people = getAllPeople();
  return people.find((p) => p.id === id) ?? null;
}

/**
 * 获取所有联结（带 zod 校验）
 */
export function getAllConnections(): Connection[] {
  if (connectionsCache) return connectionsCache;

  const result = z.array(ConnectionSchema).safeParse(connectionsJson);
  if (!result.success) {
    console.error("联结数据校验失败:", result.error);
    throw new Error("数据格式错误，请检查 data/connections.json");
  }

  connectionsCache = result.data;
  return connectionsCache;
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

import { z } from "zod";
