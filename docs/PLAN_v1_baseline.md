# HerConstellation（她的星群）— 产品与技术方案

**Baseline v1（用户上传版本，原封保留作为基线）**

> 本文件即本次交付的方案文档（产品 + 技术 + UI 三部分）。用户明确要求"先出方案、不进入开发"：批准后仅将方案整理入库（docs/），开发待用户另行指令启动。

## Context

全新项目（仓库为空，仅初始提交）。产品愿景：以全球女性故事为"光点"的可视化探索产品，让更多被忽视的女性被看见，发现跨地域、跨时代女性在共同议题上的思想呼应，以及这些故事与"此刻的我"的联系。核心价值 = **发现**（可视化探索）+ **连接**（关系图谱）。

**已确认的关键决策**（用户拍板）：

- 数据：先用占位假数据（8-12 位示例人物），最终 20-50 位真实策展故事；数据结构从第一天按真实标准设计
- 运行时 AI：MVP 零运行时 AI、纯静态站点、零后端依赖；Agent 方案仅作分层架构预留（L0/L1/L2）
- 语言：中文为主，人物名与来源保留原文，预留未来双语
- 视觉：3D 暗色地球全端（桌面+移动），WebGL 不可用时降级 2D 星图地图

---

## 一、产品整体功能方案

### 1.1 产品目标

- **使命**：她们一直都在，只是没人点亮。把散落在时间与地理中的女性故事连成"星座"，让今天的年轻女性抬头就能找到方向。
- **Demo 体验目标**：新用户在 1 分钟内完成"打开 → 发现一位女性 → 通过联结走到第二位 → 读到'与今天的你有什么关系'并停留"的完整路径。
- **Demo 可观测指标**：人均点击光点 ≥3 次；联结跳转率 ≥30%（打开详情的人中有三成点击了联结）；详情页停留 ≥20s；Surprise me 使用率 ≥50%。
- **内容目标**（真实数据阶段）：20-50 位资料可靠、联结设计清晰的故事；每人 ≥2 条可查证来源；全图连通（无孤点，任意两人 ≤3 跳可达）。

### 1.2 用户与任务

### 1.3 核心流程（Demo 剧本细化）

1. **进入**：加载（星空底图 + 品牌闪现）→ 暗色 3D 地球缓慢自转，光点呼吸闪烁；顶部引导文案"点击任意光点，遇见一位女性"；Surprise me 按钮发光脉冲，引导冷启动。
2. **发现**：点击光点 → 摘要卡滑出（名字/年代/领域/一句话简介/议题 chips + 两个动作：**阅读她的故事**、**随机另一位**）。
3. **深入**：详情面板展开，地球镜头自动聚焦该人物所在区域；内容顺序：故事正文 → 时代与地域 → **"与今天的你有什么关系"**（星芒强调卡）→ 她的联结 → 来源列表。
4. **连接**：详情内每条联结显示"她与 X 在「教育」上呼应" + 2-3 句可解释理由 + 来源；点击 → 地球在两个光点间生长出发光弧线 → 镜头飞向 X → 打开 X 的详情。这是产品的**核心差异化体验**。
5. **随机**：任意时刻 Surprise me → 随机人物摘要卡（算法避免近期重复）；卡内可连续随机。
6. **分享**：/person/:id 深链直接打开人物详情，可复制链接。
7. （Should）**议题过滤**：顶部议题 chips 筛选——非该议题光点变暗，该议题光点变亮，保留全图语境。

### 1.4 功能范围（MoSCoW）

**Must（必做，Demo 成败判断）**

1. 3D 暗光地球 + 光点人物分布（真实经纬度）
2. 点击光点 → 摘要卡（名字、年代、领域、一句话简介）
3. Surprise me → 随机摘要卡
4. 详情视图：故事、时代、地域、议题、来源
5. 人物联结：从 A 到 B，每条联结有可解释理由 + 来源 + "与今天的你有什么关系"文本
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

- 完整 AI + RAG 聊天产品；用户注册/账号/社交/评论/社区；复杂检索系统与专业研究数据库；用户上传故事/众包/CMS；"大而全"人物数量。

---

## 二、前后端与 Agent 技术方案

### 2.1 总体架构

一句话架构：**纯静态 Vite SPA + 本地 JSON 数据集（zod 单一事实源）+ globe.gl 3D 地球 + React Router 深链**。数据模型从第一天按"可被 AI 引用、可切片、可双语"标准设计，为 L1（构建期策展）与 L2（运行时问答）预留接口而不预留任何运行时依赖。

### 2.2 数据模型（zod schema 草案，`data/schema.ts`）

```typescript
LocalizedText = { zh: string, en?: string }
Era = enum['ancient','earlyModern','modern','contemporary']
Source = { title, url, type: enum[book|article|academic|archive|media|database],
           lang?, accessedAt, quote?: LocalizedText }
RegionRef = { region, role?('birth'|'activity'|'residence'|'legacy'),
              coordinates: { lat: -90..90, lng: -180..180 } }
Person = {
  id: /^[a-z0-9-]+$/          // 稳定 slug 永不变 —— L2 引用协议 person_id
  nameZh, nameEn, nameNative?, aliases[]
  born: string, died?, isLiving?
  era: Era, fields[]≥1, regions[]≥1, themes[]≥1
  summary: LocalizedText
  story: LocalizedText
  relevance: LocalizedText
  sources: Source[]≥2, keywords[], imageUrl?, updatedAt, curatorNotes?
}
Connection = { id, from, to, theme,
               type: enum[crossEra|sameEra|regionalIdentity],
               rationale: LocalizedText,
               sources: Source[]≥1,
               relevanceText: LocalizedText }
Theme = { id, nameZh, nameEn, color: #hex, description, order }
```

**为未来 RAG/embedding 预留的字段**：（略，详见原文）

### 2.3 前端组件架构

```
App（路由 + 状态 Provider）
├─ DataGate              # zod 校验通过才渲染；失败显示错误屏（不静默）
├─ GlobeScene            # WebGL 检测：可用→3D / 不可用→FallbackMap2D
│  └─ GlobeCanvas
│     ├─ LightPoint
│     ├─ ConnectionArc
│     ├─ HoverTooltip
│     └─ FallbackMap2D
└─ UIOverlay
   ├─ TopBar             # 品牌 + SurpriseMe（桌面按钮）
   ├─ ThemeChips
   ├─ SummaryCard
   ├─ DetailPanel
   │  ├─ PersonHeader / StoryBody / RelevanceBlock
   │  ├─ ConnectionsList
   │  └─ SourcesList
   └─ SurpriseMe         # 桌面按钮 / 移动 FAB
```

- **数据加载**：`import.meta.glob('../data/people/*.json', { eager: true })` 构建期打进静态产物。
- **深链与历史**：`selectedPersonId` 变化即 pushState `/person/:id`。
- **Surprise me 算法**（`src/lib/surprise.ts`）：shuffle-bag 队列保证一轮内不重复；末 3 次历史软排除；选中议题 chip 时该议题权重 ×3。

### 2.4 3D 地球交互与性能

- **初始化一次、命令式更新**：`useRef` 持 globe 实例。
- **点击 vs 拖拽**：pointerdown/up 位移 >8px 视为拖拽。
- **弧线策略**：默认全部弧线 0.15 透明度；选中人物相关弧线升至 1.0 + `arcDashAnimate`。
- **相机聚焦**：`pointOfView({lat,lng,altitude:1.6}, 900)`。
- **自动旋转**：`autoRotate=0.35`；拖拽即暂停、8 秒无操作恢复。
- **移动端手势**：地球容器 `touch-action:none`；抽屉内部承载滚动。
- **WebGL 降级**：失败 → d3-geo SVG 星图；`usePersonSelection` hook 共享。
- **性能预算**：首屏 LCP <2.5s（桌面）/ <3s（移动 4G）；three 系 ~600KB gzip 独立 chunk。

### 2.5 Agent 分层方案（预留，MVP 不实现）

**L0（MVP）**：零运行时 AI。Surprise me 纯随机算法。全部内容人工策展。

**L1 构建期内容策展管线**（`scripts/curate/`）：
- 流程：选人清单 → ①检索验证 ②起草 ③联结提案 ④人审质量门（硬性）
- 模型：claude-opus-5 + Message Batches API；50 人 <$5

**L2 运行时问答架构**（未来）：
- **服务**：Vercel Functions `api/chat.ts`
- **模型**：默认 claude-sonnet-5（1M context，全目录注入）；haiku-4-5 路由降级
- **检索**：50 人规模不需向量库，全目录进上下文 + tool 过滤
- **Tools**：`query_catalog / get_person / get_connection / list_sources / surprise_person`
- **引用协议**：`{answer_md, citations:[{person_id, source_url, quote}]}`
- **护栏**：仅基于数据集回答；数据集外明确说"我没收录"；敏感话题语气准则
- **流式**：SSE + 引用卡流末渲染
- **成本**：1000 次问答/月 ≈$25-35
- **零重构**：`id` 稳定 slug + `story` 纯文本 + `sources` 三要素 + `summary/keywords/aliases`

### 2.6 项目结构与部署

```
data/           schema.ts + themes/fields/regions.json + people/*.json + connections.json
scripts/        validate-data.ts ; curate/（L1 预留）
src/
  components/globe/   GlobeScene / LightPoint / ConnectionArc / FallbackMap2D
  components/ui/      SummaryCard / DetailPanel / ThemeChips / SurpriseMe / SourcesList / ConnectionsList
  hooks/usePersonSelection.ts
  lib/            surprise.ts / geo.ts / i18n.ts / api-client.ts
  state/store.ts  locales/zh.ts  styles/
api/             # L2 预留 chat.ts
tests/unit/  tests/e2e/   public/
```

- npm scripts：`dev / build / preview / test / test:e2e / validate-data / typecheck / deploy`
- CI：validate-data → typecheck → unit → build → e2e → deploy
- 风险：globe.gl 单人维护库需锁版本；敏感人物内容需编辑准则；深链分享选 Vercel。

---

## 三、UI 与响应式设计方案

### 3.1 设计概念与视觉语言

- **隐喻**：星座。"她们是散落在时间与地理里的星星，我们要做的只是把它们连成星座。"
- **色彩**：深空背景 `#070B14`；光点暖金 `#F2C14E` → 星光白 `#FFF6E0` 呼吸；联结弧线紫罗兰 `#B79CFF` → 暖金渐变；文字主 `#EDEFF5` / 次 `#9AA3B2`。
- **字体**：标题衬线（Noto Serif SC / Fraunces），正文无衬线（Noto Sans SC / Inter）。
- **动效**：光点呼吸 2-4s；弧线生长 0.8s；面板滑入 300ms spring；`prefers-reduced-motion` 降级。
- **无障碍**：AA 对比度；点击热区 ≥28px；键盘导航；aria-live 播报。

### 3.2 桌面端布局（≥1024px）

- 全屏 3D 地球；左上品牌；顶部 chips；右上 Surprise me；左下图例计数；右下摘要卡；右侧详情面板（40%，min 420 / max 560）。

### 3.3 移动端布局（<768px）

- 地球占上部 55%；摘要卡折叠进底部抽屉；详情底部抽屉（85vh、圆角 24、下拉关闭）；Surprise me FAB；chips 横滚；联结改为"呼应卡片"。

### 3.4 降级与性能

- WebGL 不可用 → 2D 星图；LCP < 2.5s；加载态全程星空。

### 3.5 关键组件规格

- LightPoint / SummaryCard / DetailPanel / RelevanceCard / ConnectionArc(桌面) / ConnectionCard(移动) / SurpriseMe / ThemeChips / FallbackMap2D / Loading

---

## 四、内容与数据策略

- **占位阶段**：12 位真实知名女性 + 简化占位正文（`placeholder: true`）+ 真实可访问来源 URL。
- **占位联结示例**：阿达 ↔ 霍珀 / 萨福 ↔ 伍尔夫 / 秋瑾 ↔ 马拉拉 / 安东尼 ↔ 潘克赫斯特 / 王贞仪 ↔ 屠呦呦 / 罗莎·帕克斯 ↔ 秋瑾 等。
- **真实阶段**：20-50 位；30% 认知锚点 + 70% "未被看见"；全图连通无孤点。
- **质量门**：来源可查证；反刻板化；克制不煽情。

---

## 五、里程碑与验证

- Playwright 关键路径；Demo 剧本走查；Lighthouse 性能。
- 本次交付 = 方案评审：MVP Must 全覆盖、Won't 无混入、L1/L2 预留完备。

---

## 六、交付与后续

- 本次交付 = 本方案文档。
- 批准后整理为仓库 docs/ 文档。
- 开发待用户明确启动指令。
