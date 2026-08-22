import type { Person } from "@/data/schema";

export type ContinentKey =
  | "asia"
  | "europe"
  | "africa"
  | "americas"
  | "oceania"
  | "other";

export const CONTINENT_LABELS: Record<ContinentKey, string> = {
  asia: "亚洲",
  europe: "欧洲",
  africa: "非洲",
  americas: "美洲",
  oceania: "大洋洲",
  other: "其他",
};

const REGION_HINTS: Array<{ key: Exclude<ContinentKey, "other">; hints: string[] }> = [
  {
    key: "asia",
    hints: [
      "中国", "日本", "韩国", "印度", "伊朗", "越南", "泰国", "印尼", "菲律宾",
      "巴基斯坦", "中亚", "西亚", "china", "japan", "korea", "india", "iran",
      "pakistan", "asia",
    ],
  },
  {
    key: "europe",
    hints: [
      "英国", "法国", "德国", "意大利", "西班牙", "葡萄牙", "波兰", "俄国", "瑞典",
      "挪威", "希腊", "奥地利", "欧洲", "england", "united kingdom", "france",
      "germany", "italy", "spain", "russia", "poland", "greece", "austria", "europe",
    ],
  },
  {
    key: "africa",
    hints: [
      "埃及", "南非", "尼日利亚", "肯尼亚", "埃塞俄比亚", "利比里亚", "加纳", "非洲",
      "egypt", "alexandria", "nigeria", "kenya", "ethiopia", "liberia", "ghana", "africa",
    ],
  },
  {
    key: "americas",
    hints: [
      "美国", "加拿大", "墨西哥", "巴西", "阿根廷", "智利", "玻利维亚", "美洲",
      "america", "usa", "u.s.", "canada", "mexico", "brazil", "argentina", "chile",
      "bolivia",
    ],
  },
  {
    key: "oceania",
    hints: ["澳大利亚", "新西兰", "大洋洲", "australia", "new zealand", "oceania"],
  },
];

export function continentKeyOf(person: Pick<Person, "region_zh" | "region_en">): ContinentKey {
  const region = `${person.region_zh} ${person.region_en}`.toLowerCase();
  return REGION_HINTS.find(({ hints }) => hints.some((hint) => region.includes(hint)))?.key ?? "other";
}

export function continentLabelOf(person: Pick<Person, "region_zh" | "region_en">): string {
  return CONTINENT_LABELS[continentKeyOf(person)];
}
