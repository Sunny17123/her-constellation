import type { Connection, ConnectionType, Person, ThemeKey } from "@/data/schema";

/**
 * 3D 地球视觉测试数据（仅在 ?demo=30 时启用）。
 *
 * 这些人物和故事是虚构的占位内容，不应作为产品事实内容发布；
 * 目的是让 yuqing 在不改动 data/stories.json 的情况下测试 30 个光点和关系弧线。
 */

type DemoSeed = {
  id: string;
  name_zh: string;
  name_en: string;
  time_period: string;
  region_zh: string;
  region_en: string;
  lat: number;
  lng: number;
  themes: [ThemeKey, ...ThemeKey[]];
  voice: string;
  starter_score: number;
};

const seeds: DemoSeed[] = [
  { id: "amina_hassan", name_zh: "阿米娜·哈桑", name_en: "Amina Hassan", time_period: "1898–1972", region_zh: "埃及 · 开罗", region_en: "Cairo, Egypt", lat: 30.04, lng: 31.24, themes: ["education", "labor"], voice: "把夜校带到织工和年轻母亲身边", starter_score: 8.4 },
  { id: "lin_lan", name_zh: "林澜", name_en: "Lin Lan", time_period: "1912–1986", region_zh: "中国 · 上海", region_en: "Shanghai, China", lat: 31.23, lng: 121.47, themes: ["art_voice", "education"], voice: "用出版和识字课让女性拥有自己的声音", starter_score: 8.8 },
  { id: "marisol_vega", name_zh: "玛丽索尔·维加", name_en: "Marisol Vega", time_period: "1924–2001", region_zh: "墨西哥 · 瓦哈卡", region_en: "Oaxaca, Mexico", lat: 17.07, lng: -96.72, themes: ["body", "peace_justice"], voice: "组织乡村诊所，守护女性的身体自主", starter_score: 8.1 },
  { id: "nora_okafor", name_zh: "诺拉·奥卡福", name_en: "Nora Okafor", time_period: "1935–2010", region_zh: "尼日利亚 · 拉各斯", region_en: "Lagos, Nigeria", lat: 6.52, lng: 3.38, themes: ["labor", "suffrage"], voice: "把市场女工的劳动权益带进公共讨论", starter_score: 8.7 },
  { id: "elena_markovic", name_zh: "埃莱娜·马尔科维奇", name_en: "Elena Markovic", time_period: "1879–1958", region_zh: "塞尔维亚 · 贝尔格莱德", region_en: "Belgrade, Serbia", lat: 44.79, lng: 20.45, themes: ["science", "education"], voice: "在战乱中保存实验记录和女孩的学习机会", starter_score: 8.0 },
  { id: "sora_kim", name_zh: "金素罗", name_en: "Sora Kim", time_period: "1941–2018", region_zh: "韩国 · 釜山", region_en: "Busan, South Korea", lat: 35.18, lng: 129.08, themes: ["labor", "body"], voice: "为工厂女性争取安全的工作环境", starter_score: 8.3 },
  { id: "ines_quiroga", name_zh: "伊内斯·基罗加", name_en: "Inés Quiroga", time_period: "1906–1977", region_zh: "阿根廷 · 科尔多瓦", region_en: "Córdoba, Argentina", lat: -31.42, lng: -64.19, themes: ["art_voice", "peace_justice"], voice: "让被排除的声音进入剧场和广播", starter_score: 7.9 },
  { id: "maya_thompson", name_zh: "玛雅·汤普森", name_en: "Maya Thompson", time_period: "1930–1999", region_zh: "美国 · 亚特兰大", region_en: "Atlanta, United States", lat: 33.75, lng: -84.39, themes: ["suffrage", "peace_justice"], voice: "在社区之间搭起争取投票权的桥梁", starter_score: 8.9 },
  { id: "leila_ben_said", name_zh: "莱拉·本·赛义德", name_en: "Leila Ben Said", time_period: "1952–", region_zh: "突尼斯 · 突尼斯市", region_en: "Tunis, Tunisia", lat: 36.81, lng: 10.18, themes: ["body", "education"], voice: "把法律知识写成普通女性读得懂的手册", starter_score: 8.2 },
  { id: "tala_makena", name_zh: "塔拉·马凯娜", name_en: "Tala Makena", time_period: "1964–", region_zh: "肯尼亚 · 内罗毕", region_en: "Nairobi, Kenya", lat: -1.29, lng: 36.82, themes: ["science", "peace_justice"], voice: "用社区研究回应干旱和迁徙带来的不平等", starter_score: 8.5 },
  { id: "ana_petrova", name_zh: "安娜·彼得罗娃", name_en: "Ana Petrova", time_period: "1888–1963", region_zh: "保加利亚 · 索菲亚", region_en: "Sofia, Bulgaria", lat: 42.70, lng: 23.32, themes: ["education", "suffrage"], voice: "把乡村教师的经验带进公共政策", starter_score: 7.8 },
  { id: "lucia_ferreira", name_zh: "卢西亚·费雷拉", name_en: "Lúcia Ferreira", time_period: "1920–1994", region_zh: "巴西 · 累西腓", region_en: "Recife, Brazil", lat: -8.05, lng: -34.88, themes: ["labor", "education"], voice: "为家政劳动者建立互助学校", starter_score: 8.6 },
  { id: "meena_ravi", name_zh: "米娜·拉维", name_en: "Meena Ravi", time_period: "1971–", region_zh: "印度 · 班加罗尔", region_en: "Bengaluru, India", lat: 12.97, lng: 77.59, themes: ["science", "labor"], voice: "让更多女孩在技术实验室里找到位置", starter_score: 9.0 },
  { id: "olena_koval", name_zh: "奥列娜·科瓦尔", name_en: "Olena Koval", time_period: "1917–1989", region_zh: "乌克兰 · 利沃夫", region_en: "Lviv, Ukraine", lat: 49.84, lng: 24.03, themes: ["peace_justice", "art_voice"], voice: "用档案和诗歌记录战争中的普通女性", starter_score: 8.1 },
  { id: "fatou_diop", name_zh: "法图·迪奥普", name_en: "Fatou Diop", time_period: "1948–", region_zh: "塞内加尔 · 达喀尔", region_en: "Dakar, Senegal", lat: 14.72, lng: -17.47, themes: ["body", "suffrage"], voice: "让女性在家庭和社区决策中拥有发言权", starter_score: 8.4 },
  { id: "hana_watanabe", name_zh: "渡边花", name_en: "Hana Watanabe", time_period: "1902–1975", region_zh: "日本 · 京都", region_en: "Kyoto, Japan", lat: 35.01, lng: 135.77, themes: ["art_voice", "science"], voice: "在传统与现代之间为女性保留创作空间", starter_score: 7.7 },
  { id: "claire_dubois", name_zh: "克莱尔·杜布瓦", name_en: "Claire Dubois", time_period: "1939–", region_zh: "法国 · 里昂", region_en: "Lyon, France", lat: 45.76, lng: 4.84, themes: ["labor", "body"], voice: "把照护劳动从私人沉默带到城市议会", starter_score: 8.3 },
  { id: "sofia_papadopoulos", name_zh: "索菲娅·帕帕多普洛斯", name_en: "Sofia Papadopoulos", time_period: "1928–2008", region_zh: "希腊 · 雅典", region_en: "Athens, Greece", lat: 37.98, lng: 23.73, themes: ["education", "art_voice"], voice: "用口述史让渔村女性的记忆不被抹去", starter_score: 7.9 },
  { id: "noura_al_khatib", name_zh: "努拉·哈提卜", name_en: "Noura Al-Khatib", time_period: "1960–", region_zh: "约旦 · 安曼", region_en: "Amman, Jordan", lat: 31.95, lng: 35.91, themes: ["peace_justice", "education"], voice: "为流离失所的女孩重建安全的学习场所", starter_score: 8.8 },
  { id: "yara_mensah", name_zh: "雅拉·门萨", name_en: "Yara Mensah", time_period: "1978–", region_zh: "加纳 · 库马西", region_en: "Kumasi, Ghana", lat: 6.69, lng: -1.62, themes: ["science", "body"], voice: "把公共卫生知识翻译成社区真正能使用的工具", starter_score: 8.6 },
  { id: "beatriz_silva", name_zh: "比阿特丽斯·席尔瓦", name_en: "Beatriz Silva", time_period: "1910–1982", region_zh: "葡萄牙 · 波尔图", region_en: "Porto, Portugal", lat: 41.15, lng: -8.61, themes: ["suffrage", "labor"], voice: "在码头城市组织女性工人的夜间议会", starter_score: 7.8 },
  { id: "margaret_owens", name_zh: "玛格丽特·欧文斯", name_en: "Margaret Owens", time_period: "1895–1969", region_zh: "加拿大 · 温哥华", region_en: "Vancouver, Canada", lat: 49.28, lng: -123.12, themes: ["peace_justice", "science"], voice: "用地图和统计说明被忽视的移民女性处境", starter_score: 8.0 },
  { id: "ruth_njoroge", name_zh: "露丝·恩乔罗盖", name_en: "Ruth Njoroge", time_period: "1958–", region_zh: "坦桑尼亚 · 达累斯萨拉姆", region_en: "Dar es Salaam, Tanzania", lat: -6.79, lng: 39.21, themes: ["education", "body"], voice: "让海岸社区的女孩拥有继续学习的时间", starter_score: 8.5 },
  { id: "valentina_ruiz", name_zh: "瓦伦蒂娜·鲁伊斯", name_en: "Valentina Ruiz", time_period: "1944–", region_zh: "智利 · 圣地亚哥", region_en: "Santiago, Chile", lat: -33.45, lng: -70.67, themes: ["art_voice", "suffrage"], voice: "用壁画保存社区女性对城市的想象", starter_score: 8.2 },
  { id: "nadia_rahman", name_zh: "娜迪娅·拉赫曼", name_en: "Nadia Rahman", time_period: "1969–", region_zh: "孟加拉国 · 达卡", region_en: "Dhaka, Bangladesh", lat: 23.81, lng: 90.41, themes: ["labor", "body"], voice: "为成衣工人争取健康、薪资和尊严", starter_score: 8.9 },
  { id: "evelyn_carter", name_zh: "伊芙琳·卡特", name_en: "Evelyn Carter", time_period: "1922–1997", region_zh: "英国 · 曼彻斯特", region_en: "Manchester, United Kingdom", lat: 53.48, lng: -2.24, themes: ["science", "education"], voice: "把工人家庭的女孩带进公共图书馆和实验室", starter_score: 8.1 },
  { id: "maria_luz", name_zh: "玛丽亚·卢斯", name_en: "Maria Luz", time_period: "1932–2015", region_zh: "菲律宾 · 宿务", region_en: "Cebu, Philippines", lat: 10.32, lng: 123.90, themes: ["peace_justice", "labor"], voice: "在台风和迁徙之后重建女性互助网络", starter_score: 8.4 },
  { id: "tsering_dolma", name_zh: "次仁卓玛", name_en: "Tsering Dolma", time_period: "1955–", region_zh: "尼泊尔 · 加德满都", region_en: "Kathmandu, Nepal", lat: 27.72, lng: 85.32, themes: ["education", "suffrage"], voice: "让山地女孩的教育不再被距离决定", starter_score: 8.7 },
  { id: "julia_fischer", name_zh: "朱莉娅·费舍尔", name_en: "Julia Fischer", time_period: "1918–1988", region_zh: "德国 · 柏林", region_en: "Berlin, Germany", lat: 52.52, lng: 13.40, themes: ["body", "art_voice"], voice: "用戏剧讨论女性如何重新拥有自己的身体", starter_score: 7.9 },
  { id: "aisha_williams", name_zh: "艾莎·威廉姆斯", name_en: "Aisha Williams", time_period: "1982–", region_zh: "澳大利亚 · 悉尼", region_en: "Sydney, Australia", lat: -33.87, lng: 151.21, themes: ["science", "peace_justice"], voice: "把原住民女性的生态知识带进研究机构", starter_score: 8.8 },
];

function makePerson(seed: DemoSeed): Person {
  return {
    id: seed.id,
    name_zh: seed.name_zh,
    name_en: seed.name_en,
    time_period: seed.time_period,
    region_zh: seed.region_zh,
    region_en: seed.region_en,
    coordinates: { lat: seed.lat, lng: seed.lng },
    themes: seed.themes,
    short_story: `${seed.name_zh} 是 SHESHAPES 的视觉演示人物。她生活在${seed.region_zh}，长期围绕“${seed.voice}”展开工作。这个示例故事用于测试地球上的人物分布、光点密度、摘要卡和详情面板的阅读节奏，不代表真实史料。她留下的实践提醒我们，改变通常从一间教室、一份记录、一次集体讨论或一个愿意互相照看的社区开始。随着时间推移，她把个人经验变成了可以被更多人使用的方法，也让原本分散的声音获得了连接。`,
    why_visible: `这是一个用于界面演示的占位人物：她的故事围绕${seed.voice}展开，适合测试人物卡片、主题标签和关联关系在不同地域中的视觉呈现。`,
    relevance_today: `当你在今天面对与${seed.voice}相似的困境时，这条虚构叙事想提醒你：经验可以被记录，声音可以彼此连接，微小的行动也值得被看见。`,
    source_urls: [`https://example.com/sheshapes-demo/${seed.id}/story`, `https://example.com/sheshapes-demo/${seed.id}/archive`],
    image_url: undefined,
    starter_score: seed.starter_score,
  };
}

export const demoPeople: Person[] = seeds.map(makePerson);

function makeConnection(
  index: number,
  source: DemoSeed,
  target: DemoSeed,
  theme: ThemeKey,
  connectionType: ConnectionType
): Connection {
  return {
    id: `demo-connection-${String(index + 1).padStart(2, "0")}`,
    source_id: source.id,
    target_id: target.id,
    shared_theme: theme,
    connection_type: connectionType,
    evidence_type: "thematic",
    connection_explanation: `这是用于测试 SHESHAPES 弧线生长动画的示例联结：${source.name_zh} 与 ${target.name_zh} 都从“${theme}”相关的经验出发，虽然生活在不同地域或时代，却都把个人行动转化为可以被后来者继续使用的公共方法。`,
    evidence_summary: "视觉演示占位关系，不代表经过史料核验的历史判断。",
    evidence_sources: [`https://example.com/sheshapes-demo/connections/${source.id}-${target.id}`],
  };
}

const connectionPairs: Array<[number, number, ThemeKey, ConnectionType]> = [
  [0, 1, "education", "cross_both"], [1, 2, "education", "cross_region"], [2, 3, "body", "cross_both"], [3, 4, "labor", "cross_region"], [4, 5, "science", "cross_era"],
  [5, 6, "labor", "cross_both"], [6, 7, "art_voice", "cross_region"], [7, 8, "suffrage", "cross_era"], [8, 9, "body", "cross_region"], [9, 10, "science", "cross_both"],
  [10, 11, "education", "cross_region"], [11, 12, "labor", "cross_era"], [12, 13, "science", "cross_both"], [13, 14, "peace_justice", "cross_region"], [14, 15, "body", "cross_both"],
  [15, 16, "art_voice", "cross_era"], [16, 17, "art_voice", "cross_region"], [17, 18, "education", "cross_both"], [18, 19, "peace_justice", "cross_region"], [19, 20, "science", "cross_era"],
  [20, 21, "education", "cross_region"], [21, 22, "labor", "cross_both"], [22, 23, "peace_justice", "cross_region"], [23, 24, "suffrage", "cross_era"], [24, 25, "labor", "cross_both"],
  [25, 26, "science", "cross_region"], [26, 27, "education", "cross_era"], [27, 28, "body", "cross_both"], [28, 29, "peace_justice", "cross_region"], [29, 0, "education", "cross_both"],
  [0, 10, "education", "cross_region"], [3, 13, "labor", "cross_era"], [6, 16, "art_voice", "cross_region"], [9, 19, "peace_justice", "cross_both"], [12, 22, "science", "cross_region"],
  [15, 25, "suffrage", "cross_era"], [18, 28, "education", "cross_both"], [21, 1, "labor", "cross_region"], [24, 4, "science", "cross_both"], [27, 7, "body", "cross_era"],
];

export const demoConnections: Connection[] = connectionPairs.map(([sourceIndex, targetIndex, theme, type], index) =>
  makeConnection(index, seeds[sourceIndex], seeds[targetIndex], theme, type)
);
