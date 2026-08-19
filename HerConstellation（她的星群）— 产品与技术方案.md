# HerConstellation（她的星群）— 产品与技术方案

**Ready for review**

Select text to add comments on the plan

# HerConstellation（她的星群）— 产品与技术方案

> 本文件即本次交付的方案文档（产品 \+ 技术 \+ UI 三部分）。用户明确要求"先出方案、不进入开发"：批准后仅将方案整理入库（docs/），开发待用户另行指令启动。
> 
> 

## Context

全新项目（仓库为空，仅初始提交）。产品愿景：以全球女性故事为"光点"的可视化探索产品，让更多被忽视的女性被看见，发现跨地域、跨时代女性在共同议题上的思想呼应，以及这些故事与"此刻的我"的联系。核心价值 = **发现**（可视化探索）\+ **连接**（关系图谱）。

**已确认的关键决策**（用户拍板）：

- 数据：先用占位假数据（8\-12 位示例人物），最终 20\-50 位真实策展故事；数据结构从第一天按真实标准设计

- 运行时 AI：MVP 零运行时 AI、纯静态站点、零后端依赖；Agent 方案仅作分层架构预留（L0/L1/L2）

- 语言：中文为主，人物名与来源保留原文，预留未来双语

- 视觉：3D 暗色地球全端（桌面\+移动），WebGL 不可用时降级 2D 星图地图

---

## 一、产品整体功能方案

### 1\.1 产品目标

- **使命**：她们一直都在，只是没人点亮。把散落在时间与地理中的女性故事连成"星座"，让今天的年轻女性抬头就能找到方向。

- **Demo 体验目标**：新用户在 1 分钟内完成"打开 → 发现一位女性 → 通过联结走到第二位 → 读到'与今天的你有什么关系'并停留"的完整路径。

- **Demo 可观测指标**：人均点击光点 ≥3 次；联结跳转率 ≥30%（打开详情的人中有三成点击了联结）；详情页停留 ≥20s；Surprise me 使用率 ≥50%。

- **内容目标**（真实数据阶段）：20\-50 位资料可靠、联结设计清晰的故事；每人 ≥2 条可查证来源；全图连通（无孤点，任意两人 ≤3 跳可达）。

### 1\.2 用户与任务

### 1\.3 核心流程（Demo 剧本细化）

1. **进入**：加载（星空底图 \+ 品牌闪现）→ 暗色 3D 地球缓慢自转，光点呼吸闪烁；顶部引导文案"点击任意光点，遇见一位女性"；Surprise me 按钮发光脉冲，引导冷启动。

2. **发现**：点击光点 → 摘要卡滑出（名字/年代/领域/一句话简介/议题 chips \+ 两个动作：**阅读她的故事**、**随机另一位**）。

3. **深入**：详情面板展开，地球镜头自动聚焦该人物所在区域；内容顺序：故事正文 → 时代与地域 → **"与今天的你有什么关系"**（星芒强调卡）→ 她的联结 → 来源列表。

4. **连接**：详情内每条联结显示"她与 X 在「教育」上呼应" \+ 2\-3 句可解释理由 \+ 来源；点击 → 地球在两个光点间生长出发光弧线 → 镜头飞向 X → 打开 X 的详情。这是产品的**核心差异化体验**。

5. **随机**：任意时刻 Surprise me → 随机人物摘要卡（算法避免近期重复）；卡内可连续随机。

6. **分享**：/person/:id 深链直接打开人物详情，可复制链接。

7. （Should）**议题过滤**：顶部议题 chips 筛选——非该议题光点变暗，该议题光点变亮，保留全图语境。

### 1\.4 功能范围（MoSCoW）

**Must（必做，Demo 成败判断）**

1. 3D 暗光地球 \+ 光点人物分布（真实经纬度）

2. 点击光点 → 摘要卡（名字、年代、领域、一句话简介）

3. Surprise me → 随机摘要卡

4. 详情视图：故事、时代、地域、议题、来源

5. 人物联结：从 A 到 B，每条联结有可解释理由 \+ 来源 \+ "与今天的你有什么关系"文本

6. 移动端响应式可用（摘要卡/详情/联结在手机完整可走通）

7. 数据质量门槛：每条故事 ≥2 来源，联结理由可查证

**Should（有余力即做）**

- 议题/地域标签过滤（chips）

- 联结"星座模式"：全屏弧线图（至少详情内弧线高亮）

- 深链分享 /person/:id

- 简单搜索（按名字/关键词）

**Could（锦上添花）**

- 收藏（localStorage）

- 彩蛋级"向她提问"（单人物预设问答，运行时 AI，需后端——与"零运行时 AI"决策冲突，明确不放 MVP）

- 时间线视图、中英切换

**Won't（明确不做）**

- 完整 AI \+ RAG 聊天产品；用户注册/账号/社交/评论/社区；复杂检索系统与专业研究数据库；用户上传故事/众包/CMS；"大而全"人物数量。

---

## 二、前后端与 Agent 技术方案

### 2\.1 总体架构

一句话架构：**纯静态 Vite SPA \+ 本地 JSON 数据集（zod 单一事实源）\+ globe\.gl 3D 地球 \+ React Router 深链**。数据模型从第一天按"可被 AI 引用、可切片、可双语"标准设计，为 L1（构建期策展）与 L2（运行时问答）预留接口而不预留任何运行时依赖。

### 2\.2 数据模型（zod schema 草案，`data/schema.ts`）

```TypeScript
LocalizedText = { zh: string, en?: string }                  // 双语文本，zh 必填
Era = enum['ancient','earlyModern','modern','contemporary']  // 古代/近代/现代/当代
Source = { title, url, type: enum[book|article|academic|archive|media|database],
           lang?, accessedAt, quote?: LocalizedText }        // accessedAt=引用协议时间戳
RegionRef = { region, role?('birth'|'activity'|'residence'|'legacy'),
              coordinates: { lat: -90..90, lng: -180..180 } } // 光点位置（真实经纬度）
Person = {
  id: /^[a-z0-9-]+$/          // 稳定 slug 永不变 —— L2 引用协议 person_id
  nameZh, nameEn, nameNative?, aliases[]
  born: string, died?, isLiving?  // 字符串：支持"约公元前630"等不确定性
  era: Era, fields[]≥1, regions[]≥1, themes[]≥1
  summary: LocalizedText      // 一句话简介 —— 摘要卡 + 检索摘要
  story: LocalizedText        // 正文 300-800 字纯文本，\n\n 分段 —— 切片友好
  relevance: LocalizedText    // "与今天的你有什么关系"
  sources: Source[]≥2, keywords[], imageUrl?, updatedAt, curatorNotes?
}
Connection = { id, from, to, theme,
               type: enum[crossEra|sameEra|regionalIdentity],
               rationale: LocalizedText,     // 可解释理由 2-3 句
               sources: Source[]≥1,          // 联结本身必须有来源
               relevanceText: LocalizedText }
Theme = { id, nameZh, nameEn, color: #hex, description, order }
```

**为未来 RAG/embedding 预留的字段**：

### 2\.3 前端组件架构

```Plain Text
App（路由 + 状态 Provider）
├─ DataGate              # zod 校验通过才渲染；失败显示错误屏（不静默）
├─ GlobeScene            # WebGL 检测：可用→3D / 不可用→FallbackMap2D
│  └─ GlobeCanvas        # globe.gl 命令式实例（useEffect 初始化一次，React 不参与渲染循环）
│     ├─ LightPoint      # 光点：光晕 sprite + 核心点，议题色，选中抬高
│     ├─ ConnectionArc   # 弧线：默认 0.15 淡显，选中人物相关联结高亮+流动动画
│     ├─ HoverTooltip    # 桌面 hover 显示名字
│     └─ FallbackMap2D   # d3-geo + SVG 平面星图，与 3D 共享同一选择 hook
└─ UIOverlay
   ├─ TopBar             # 品牌 + SurpriseMe（桌面按钮）
   ├─ ThemeChips         # 议题 chips（横滚），点击过滤/加权光点
   ├─ SummaryCard        # 名字/年代/领域/一句话简介 + 两个动作
   ├─ DetailPanel        # 桌面右侧面板 / 移动底部抽屉（同一组件双形态）
   │  ├─ PersonHeader / StoryBody / RelevanceBlock
   │  ├─ ConnectionsList # 联结卡 → 点击跳转另一人
   │  └─ SourcesList     # 来源链接（L2 引用卡的雏形）
   └─ SurpriseMe         # 桌面按钮 / 移动 FAB
```

- **数据加载**：`import.meta.glob('../data/people/*.json', { eager: true })` 构建期打进静态产物，零网络请求；dev 模块加载时执行一次 `zod.parse` 快速失败。

- **深链与历史**：`selectedPersonId` 变化即 pushState `/person/:id`；返回键关闭面板、相机退回全景；刷新深链 2 秒内复现（先渲染→聚焦→开面板）。URL 只存 personId，相机状态不存。

- **Surprise me 算法**（`src/lib/surprise.ts`，纯函数、单测覆盖）：shuffle\-bag 队列保证一轮内不重复且全员被访问，队列耗尽重洗；末 3 次历史软排除跨轮紧邻重复；选中议题 chip 时该议题权重 ×3（roulette 加权抽样）。

### 2\.4 3D 地球交互与性能（关键实现点）

- **初始化一次、命令式更新**：`useRef` 持 globe 实例；React 状态变化经 `globe.pointsData()/arcsData()/pointOfView()` 命令式下发，Canvas 永不参与 React 重渲染。

- **点击 vs 拖拽**：pointerdown/up 位移 \>8px 视为拖拽，丢弃 click（防 OrbitControls 误触）。

- **弧线策略**：默认全部弧线 0\.15 透明度（保留"星座"整体意象）；选中人物时相关弧线升至 1\.0 并开启 `arcDashAnimate` 流动动画（只动画选中联结，避免全量视觉噪音与 GPU 消耗）。

- **相机聚焦**：选中光点 → `pointOfView({lat,lng,altitude:1.6}, 900)`；选中点 `pointAltitude` 抬高形成"浮起"强调。

- **自动旋转**：`autoRotate=0.35`；拖拽即暂停、8 秒无操作恢复；选中人物/打开面板时暂停，关闭后恢复。

- **移动端手势**：地球容器 `touch-action:none`，单指旋转/双指缩放；页面滚动由抽屉内部承载（`overscroll-behavior:contain`）——彻底消除"旋转 vs 滚动"冲突。

- **WebGL 降级**：`getContext('webgl2'|'webgl')` 失败或 `webglcontextlost` → 渲染 d3\-geo SVG 星图；`usePersonSelection` hook 封装选中/聚焦逻辑，3D 与 2D 共享同一 hook——**降级只换渲染实现，不改业务逻辑**。

- **性能预算**：首屏 LCP \<2\.5s（桌面）/ \<3s（移动 4G）；three 系（\~600KB gzip）走 `React.lazy` 独立 chunk，首屏只渲染星空骨架；纹理桌面 2048 / 移动 1024；`pixelRatio ≤2`（移动 1\.5）；不引入 post\-processing；`visibilitychange` 切后台暂停渲染循环。

### 2\.5 Agent 分层方案（预留，MVP 不实现）

**L0（MVP）**：零运行时 AI。Surprise me 为纯随机算法。全部内容人工策展。

**L1 构建期内容策展管线**（`scripts/curate/`，Node/TS \+ Anthropic SDK，可选引入）：

- 流程：选人清单 → 逐人四步：①**检索验证**（Claude 用 web 检索工具产出 sources 候选，人审验证链接可访问与权威性）→ ②**起草**（structured outputs 按 zod 转 JSON Schema 强制输出合法人物 JSON；提示要求"每条事实可追溯至 sources，不确定处标 \[需核实\]"）→ ③**联结提案**（主题聚类后的人物对生成 Connection 草案）→ ④**人审质量门（硬性）**：AI 产出进 `drafts/` 目录，编辑审校后以 PR 合入 `data/`，草稿永不直接进数据目录。

- 模型与成本：起草/联结用 claude\-opus\-5（离线批处理、质量优先）；用 Message Batches API（半价）后 **50 人全量策展一次性 \<$5**。

**L2 运行时问答架构**（未来，零重构接入）：

- **服务**：Vercel Functions `api/chat.ts`；服务端直接 import 构建期数据产物（`data/` 即知识库，**无数据库**）。

- **模型**：默认 **claude\-sonnet\-5**——全目录（50 人×800 字中文 ≈80K tokens）可整体注入上下文（1M context 余量充足；200K 的 haiku\-4\-5 在目录扩容到 100 人\+ 时先触顶），且性别压迫/抗争史等敏感议题上措辞与引用严谨度更稳；**claude\-haiku\-4\-5 作为路由降级**（简单问候/纯目录查询类请求），兼顾成本与延迟。

- **检索**：50 人规模**不需要向量库**——全目录进上下文 \+ 结构化 tool 过滤（query\_catalog）即最优解（引用可控、成本可算）；\>200 人或引入 UGC 时，构建期生成 `embeddings.json`（按 `${personId}#p{n}` 切片）或 keywords\+aliases 的 BM25 hybrid——数据模型已预留，无需改源数据。

- **Tools 草案**（strict schema）：`query_catalog({theme?,era?,region?,field?,limit})` / `get_person({person_id})` / `get_connection({person_id})` / `list_sources({person_id})` / `surprise_person()`。

- **引用协议**：系统提示强制"每条人物/事实陈述必须附 person\_id 与 source\.url"；structured outputs 约束响应为 `{answer_md, citations:[{person_id, source_url, quote}]}`；前端渲染引用卡（MVP 的 SourcesList 即其雏形）。

- **护栏**：仅基于数据集回答；数据集外 →"这个人物/议题我还没收录"\+反馈入口；敏感话题语气准则（事实性、不煽情、不加戏）；无依据时明确说"数据中没有依据"；声明不替代专业建议。

- **流式**：SDK stream → Web Streams 转发 SSE → 前端逐字渲染；引用卡流末统一渲染（流中 `[P:person_id]` 占位）。可先上线非流式（单轮 2\-5s 可接受）。

- **成本（按次）**：目录置于 cache\_control 断点（前缀字节稳定、无时间戳、固定排序）——冷启动 ≈$0\.25，热轮 ≈$0\.03；**1000 次问答/月 ≈$25\-35**。

- **零重构原因**：`id` 稳定 slug（引用协议）、`story` 纯文本块（可切片）、`sources` 三要素（引用卡）、`summary`/`keywords`/`aliases`（检索元数据）——**L2 只新增代码，不动一条数据**。

### 2\.6 项目结构与部署

```Plain Text
data/           schema.ts（zod 单一事实源）+ themes/fields/regions.json
                + people/*.json（一人一档，12 档起步）+ connections.json
scripts/        validate-data.ts（CI 与 prebuild）；curate/（L1 预留）
src/
  components/globe/   GlobeScene / LightPoint / ConnectionArc / FallbackMap2D
  components/ui/      SummaryCard / DetailPanel / ThemeChips / SurpriseMe /
                      SourcesList / ConnectionsList
  hooks/usePersonSelection.ts   # 3D/2D 共享选择逻辑
  lib/            surprise.ts / geo.ts / i18n.ts / api-client.ts（L2 空接口）
  state/store.ts  locales/zh.ts（en.ts 预留）  styles/
api/             # L2 预留 chat.ts（Vercel 自动识别为 Function）
tests/unit/  tests/e2e/   public/（地球纹理、favicon）
```

- **npm scripts**：`dev` / `build`（validate\-data 前置）/ `preview` / `test`（Vitest）/ `test:e2e`（Playwright）/ `validate-data` / `typecheck` / `deploy`

- **CI**（\.github/workflows/ci\.yml）：validate\-data → typecheck → unit → build → e2e → deploy

- **风险**：globe\.gl 为单人维护库（vasturiano，活跃，需锁定版本）；敏感人物内容需在 L1 人审环节建立编辑准则；若深链分享是核心体验，直接选 Vercel（GitHub Pages 有 404 刷新限制）。

---

## 三、UI 与响应式设计方案

### 3\.1 设计概念与视觉语言

- **隐喻**：星座。"她们是散落在时间与地理里的星星，我们要做的只是把它们连成星座，让今天的你抬头时能找到方向。" 整个产品是深色夜空，不是"数据看板"。

- **色彩系统**（深色主题，单一主题不设浅色）：

    - 深空背景 `#070B14`（近黑蓝）；地球暗蓝底 \+ 大陆轮廓微光

    - 光点：暖金 `#F2C14E` → 星光白 `#FFF6E0` 呼吸渐变；选中态放大 \+ 外圈光晕；未选中态略暗（约 70% 亮度）

    - 联结弧线：紫罗兰 `#B79CFF` → 暖金渐变，细线（1\-2px）\+ 柔和辉光，象征"跨越时空的呼应"

    - 议题标签：低饱和系统色，每议题一 hue（教育=青绿、科学=蓝紫、权利=暖金、艺术=粉珊瑚、和平=灰绿……），共 6\-8 个，避免彩虹感

    - 文字：主 `#EDEFF5` / 次 `#9AA3B2`

- **字体**：标题用衬线（中文 Noto Serif SC / 英文 Fraunces），营造"历史叙事"感；正文无衬线（Noto Sans SC / Inter）保证可读性。

- **动效语言**：光点呼吸（2\-4s 周期、±15% 亮度）；弧线生长动画（约 0\.8s，从 A 端长到 B 端）；面板滑入 300ms spring；地球自动慢旋（约 1°/s，用户拖拽后暂停、5s 无操作恢复）。`prefers-reduced-motion` 时全部降级为淡入。

- **无障碍**：正文对比度 AA；光点点击热区 ≥28px；键盘 Tab 导航 \+ Enter 打开摘要卡；Surprise me 与详情打开时 aria\-live 播报人物名。

### 3\.2 桌面端布局（≥1024px）

- **背景层**：全屏 3D 地球（可拖拽旋转、滚轮缩放），光点 \+ 弧线均在其上。

- **左上**：品牌徽标（星形 ✦ \+ "Her Constellation"）\+ tagline。

- **顶部**：议题 chips（Should 功能时出现）；**右上**：Surprise me 主按钮（发光脉冲）。

- **左下**：轻声的图例与计数——"已点亮 N 位 · M 条呼应"。

- **摘要卡**：右下侧滑出（约 360px 卡片）。

- **详情面板**：右侧覆盖层（40% 宽，min 420px / max 560px），纵向滚动；打开时地球镜头左移 15% 并聚焦人物坐标，关闭后复位。

- **联结呈现**：详情内联结列表 hover 时，地球上对应弧线高亮；点击跳转执行"弧线生长 \+ 镜头飞行"。

### 3\.3 移动端布局（\<768px）

- **地球**：占视口上部约 55%（100dvh），可单指旋转、双指缩放（容器 `touch-action:none`，页面滚动由抽屉内部承载，`overscroll-behavior:contain`——彻底消除"旋转 vs 滚动"冲突）；轻点光点即选中（命中半径扩大至约 36px）。

- **摘要卡**：折叠进底部抽屉的"摘要态"（名字/年代/领域/一句话简介 \+ "阅读她的故事"按钮），点击后才展开全文，不另起浮层。

- **详情**：底部抽屉（最高 85vh、顶部圆角 24px、可下拉关闭、内容独立滚动）；地球在背景自动聚焦对应区域但不抢手势。

- **Surprise me**：右下角 FAB（56px 圆形、星形图标）。

- **议题 chips**：顶部下方横向滚动条。

- **联结**：移动端不画全屏弧线，改用"呼应卡片"列表（主题色左边条 \+ 对方头像点 \+ 理由摘要），点击同样跳转。

- **平板（768\-1023px）**：桌面布局 \+ 面板约 60% 宽，地球可拖拽。

### 3\.4 降级与性能

- **WebGL 不可用** → 2D 星图地图（SVG equirectangular 投影 \+ 光点脉冲 \+ 弧线，与 3D 共享同一数据源与组件接口）。

- **性能预算**：首屏 LCP \< 2\.5s；three\.js 与人物数据懒加载；移动端降配（关 shader 特效、降纹理分辨率、纹理 ≤2MB）。

- **加载态**：CSS 星空渐变 \+ 品牌闪现，掩盖地球初始化（星空意象贯穿加载全程，不出现白屏）。

### 3\.5 关键界面组件规格（每个 1\-2 句）

- **LightPoint**：光点 \+ 呼吸动画 \+ 选中态光晕 \+ 名字 hover tooltip。

- **SummaryCard**：名字/年代/领域/一句话简介/议题 chips/两个动作按钮。

- **DetailPanel**：故事 → 时代地域 → 与你的关系 → 联结 → 来源 的固定叙事顺序。

- **RelevanceCard**：星芒装饰的强调卡，视觉上是详情页的情感高点。

- **ConnectionArc**（桌面 3D）：发光生长弧线；**ConnectionCard**（移动端）：呼应卡片列表。

- **SurpriseMe**：桌面按钮 / 移动 FAB 两形态。

- **ThemeChips**：议题过滤标签条（桌面居中 / 移动横滚）。

- **FallbackMap2D**：WebGL 降级星图。

- **Loading**：星空加载屏。

---

## 四、内容与数据策略

- **占位阶段**：12 位**真实知名女性** \+ 简化占位正文（`placeholder: true` 标记，待 L1 管线替换）\+ **真实可访问来源 URL**（Demo 要点开来源，URL 必须能打开）。用真实人物而非纯虚构，保证演示可信：

- **占位联结示例**（约 10 条，每条含 rationale \+ sources \+ relevanceText，保证 Demo 第 4 步完整可演示）：

    - 阿达·洛芙莱斯 ↔ 格蕾丝·霍珀（跨时代，科学）："第一个程序员"与"编译器之母"跨越一个世纪的计算领域思想接力

    - 萨福 ↔ 弗吉尼亚·伍尔夫（跨时代，艺术）：伍尔夫《一间自己的房间》援引的女性书写传统，萨福是其精神源头

    - 秋瑾 ↔ 马拉拉（跨时代，勇气/教育）：相距百年、相隔万里，以教育与抗争为武器

    - 苏珊·B·安东尼 ↔ 埃米琳·潘克赫斯特（同代，权利）：美英选举权运动的同期呼应

    - 王贞仪 ↔ 屠呦呦（跨时代\+地域身份，科学）：中国女性科学探索的跨代传承

    - 罗莎·帕克斯 ↔ 秋瑾（跨时代，勇气）：不同时空个体勇气的同构

    - 其余补齐：每个议题 ≥1 条、地域身份共鸣 ≥2 条

- **真实阶段**（后续）：20\-50 位；建议混合策略 **30% 认知锚点 \+ 70% "未被看见"**——锚点（如居里、洛夫莱斯）降低冷启动，主体是大众知名度低但资料可靠的女性（如吴健雄、Savitribai Phule、Kate Sheppard……）；全图连通无孤点。

- **内容质量门**：来源可查证；叙事反刻板化（不神化，呈现选择与代价）；"与你的关系"文本克制、不煽情。

---

## 五、里程碑与验证

**端到端验证方式（开发启动后）**：

- Playwright 关键路径：打开首页 → 地球渲染 → 点击光点 → 摘要卡 → Surprise me → 深链直达\+刷新 → 联结跳转；三档视口 ×（有/无 WebGL）全跑。

- Demo 剧本走查：按 1\.3 节六步在桌面与真机各走一遍，计时"1 分钟内完成 发现→联结→与我的关系"。

- 性能：Lighthouse 移动模拟，LCP \<3s、无白屏（加载屏全程覆盖）。

**本次交付的验证**：方案评审——本文件与产品文档逐条对照（MVP Must 全覆盖、Won't 无混入、数据字段支撑联结可解释性、L1/L2 预留字段完备）。

---

## 六、交付与后续

- 本次交付 = 本方案文档（产品 / 技术 / UI 三部分）。

- 批准后：将方案整理为仓库 docs/ 文档（可选步骤，按用户意愿）。

- 开发：待用户明确启动指令后另行规划执行。

Add Comment

