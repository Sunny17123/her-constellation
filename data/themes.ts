/**
 * SHESHAPES · 议题枚举
 *
 * 约束：
 * - 议题总数固定为 7 个，新增议题必须全队评审（议题一多，联结网络就稀疏）
 * - stories.json 中每位女性的 themes 数组必须从这里选 1–3 个 key
 * - connections.json 中 shared_theme 必须是两位女性 themes 的交集
 * - color 用于地图光点 + UI 标签，色板固定，不要随意改
 */

export const THEMES = {
  education: {
    key: "education",
    zh: "教育权",
    en: "Education",
    color: "#4ECDC4",
    description: "争取女性受教育权、创办学校、推动识字与知识普及",
  },
  suffrage: {
    key: "suffrage",
    zh: "参政与投票",
    en: "Suffrage & Political Participation",
    color: "#A8E6CF",
    description: "争取投票权、参政权、进入公共决策领域",
  },
  body: {
    key: "body",
    zh: "身体自主",
    en: "Bodily Autonomy",
    color: "#FF6B9D",
    description: "生育权、反对童婚/裹脚/割礼、性与身体自主权",
  },
  labor: {
    key: "labor",
    zh: "劳动权益",
    en: "Labor Rights",
    color: "#F7B32B",
    description: "同工同酬、职业准入、工会参与、反对职场歧视",
  },
  science: {
    key: "science",
    zh: "科学参与",
    en: "Science & Knowledge",
    color: "#6C5CE7",
    description: "进入科学/学术领域、做出被承认的知识贡献",
  },
  art_voice: {
    key: "art_voice",
    zh: "艺术与发声",
    en: "Art & Voice",
    color: "#FD79A8",
    description: "通过写作、艺术、出版、演讲进入公共话语",
  },
  peace_justice: {
    key: "peace_justice",
    zh: "和平与正义",
    en: "Peace & Justice",
    color: "#00B894",
    description: "反战、人权、法律援助、社会正义运动",
  },
} as const;

export type ThemeKey = keyof typeof THEMES;

export const THEME_KEYS = Object.keys(THEMES) as ThemeKey[];

/**
 * 校验一个 theme key 是否合法
 */
export function isValidTheme(key: string): key is ThemeKey {
  return key in THEMES;
}

/**
 * 获取议题的中文名（用于 UI 显示）
 */
export function getThemeZh(key: string): string {
  return isValidTheme(key) ? THEMES[key].zh : key;
}

/**
 * 获取议题颜色（用于地图光点）
 */
export function getThemeColor(key: string): string {
  return isValidTheme(key) ? THEMES[key].color : "#999999";
}
