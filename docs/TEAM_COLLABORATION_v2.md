# HerConstellation 团队分工 v2

> 4 人 × 48 小时 · 2026-08-20

---

## 角色与任务

### yuqing — 3D 核心 + 集成

**前端-3D：**
- Globe 视觉增强（纹理、光点动画、光点样式、相机）
  > 相机 = 3D 地球里的视角位置。`globe.pointOfView({lat, lng, altitude}, ms)` 控制"你从哪个角度、什么高度看地球"。用户点击光点时，相机平滑飞到该人物所在经纬度，形成"地球旋转到那个人面前"的效果。
- ConnectionArc 弧线渲染 + 生长动画
  > 弧线 = 地球表面上方连接两个光点的发光曲线。选中 A 人物时，A 与所有关联人物之间出现弧线；选中的那条高亮 + 生长动画（从 A 端长到 B 端），视觉上表达"跨越时空的呼应"。
- 组件集成 + 最终联调
- 性能优化（pixelRatio、帧率、加载态）

---

### ruofan — 后端 + 前端-架构

**后端（核心）：**
- Vercel Functions `api/chat.ts`：L2 运行时问答 endpoint
  > L2 是 v1 方案里预留的三层 AI 架构的最高层（L0=零运行时 AI，L1=构建期 AI 辅助策展，L2=运行时问答）。`api/chat.ts` 是一个 Vercel 云函数，用户输入问题后，后端根据人物数据调用 Claude 生成回答。角色对话功能就是基于这个实现的。
- Persona prompt API：`/api/persona/:id` 返回完整 persona prompt
  > 为每个女性人物提供"角色扮演提示词"，让前端调用后实现"与她对话"的功能。模板参考 `docs/PERSONA_PROMPT_EXAMPLE_qiu_jin.md`。
- 数据校验 CI：GitHub Actions 跑 `npm run validate-data`
  > 每次有人提交数据文件时，自动跑校验脚本，发现 id 重复、theme 非法、来源不足等问题立刻报错。

**前端（架构向）：**
- 深链 `/person/:id`：URL 同步选中状态，刷新可恢复，可分享
  > 当前"选中人物"只存在 React state 里，刷新就丢了。改为 URL 路由 `/person/savitribai_phule`，这样用户可以把链接发给朋友，刷新后也能恢复到同一个人物。
- 收藏功能：localStorage + Context 状态持久化
  > 用户点"收藏"后，该人物存入浏览器 localStorage，下次打开还在。地图上已收藏的光点显示特殊标记（如星形边框）。
- 数据加载优化：懒加载、错误边界、DataGate 组件
  > 目前数据是同步 import 的，后续人物多了可以按需加载。错误边界 = 数据格式出错时不白屏，而是显示友好提示。

**文件所有权：** `api/`、`src/hooks/useFavorites.ts`、`src/data/` 中的加载逻辑

---

### xinlu — 前端-数据可视化

一半是数据，一半是前端呈现——思考数据形态如何决定前端叙事形式。

**任务：**
- ThemeChips 恢复 + 增强：把已写好的议题筛选组件重新接入，加议题计数
  > 每个议题标签旁边显示"该议题下有多少位女性"，让用户一眼看到议题的覆盖密度。点击标签后，地球光点按议题高亮/变暗。
- 2D 星群网络图优化：在现有 NetworkGraph 基础上，从用户角度优化呈现方式，让节点和连线更易读、更有叙事感
  > 当前网络图是基础力导向图。需要优化的方向：节点大小如何表达人物重要性？连线颜色如何表达联结类型？hover 时显示什么信息？如何让用户不觉得"这是一团乱麻"？
- 故事面板的叙事呈现：从用户角度梳理"一个故事应该用什么顺序、什么视觉节奏呈现给用户"，设计并实现
  > 当前详情面板是固定的字段顺序（故事→why→relevance→联结→来源）。思考：用户第一眼最想看到什么？"与我的关系"放在什么位置最有冲击力？联结列表应该在故事前还是后？xinlu 直接修改 DetailPanel.tsx 实现。
- 数据统计面板：左下角计数升级。简洁优先——如果做出来不够简洁，则改为点击后弹出统计面板，或者不做
  > 当前左下角只显示"已点亮 3 位 · 3 条呼应"。可尝试显示议题分布小条、时代跨度、地域覆盖的迷你图表。如果放不下，就做成点击后弹出的浮层。

**文件所有权：** `src/components/ui/ThemeChips.tsx`、`src/components/ui/DetailPanel.tsx`、`src/components/globe/NetworkGraph.tsx`、`src/components/layout/Layout.tsx`（计数面板部分）、`src/pages/PersonPage.tsx`

---

### zhuqian — 数据 + AI Prompt

**数据（核心）：**
- 候选池 + 筛选：列 60 人 → 筛到 40-50 人
  > 覆盖要求：7 个议题每个 ≥5 人、6 大洲至少各 2 人、时代从古代到当代都有覆盖、领域（科学/艺术/政治/教育/劳工/和平/身体自主）各 ≥3 人。确保全图连通，无孤岛人物。
- 填 30-40 人 stories：每人 300 字 + why_visible + ≥2 来源
  > 每篇故事三段式：她面对的问题 → 她的行动与贡献 → 她的影响与遗产。
- 设计 40-60 条联结：基于 themes 共现 + 人工判断
  > 联结数随人物数同步增加，确保每人至少 2 条联结，任意两人最远 3 跳可达。
- 交叉审核：和 xinlu 一起审（xinlu 从数据呈现角度审）

**AI Prompt（核心）：**
- 调 relevance_today prompt：基于 docs/PERSONA_PROMPT_EXAMPLE_qiu_jin.md 模板
  > 用示例中的 prompt 模板，根据每位女性的 short_story 批量生成 150 字"与今天的你有什么关系"文本，AI 生成后人工审核。
- 批量生成 relevance_today：AI 生成 + 人审
- 调 connection_explanation prompt：同上
  > 用示例中的模板，根据双方 short_story + shared_theme 批量生成 200 字联结解释，AI 生成后人工审核。
- 批量生成 connection_explanation：AI 生成 + 人审
- 预设问答 3-5 人：每人 3 个 Q&A，Demo 主路径用
  > 为 Demo 主路径上的人物准备人工精修的问答对，确保现场演示不翻车。参考 `docs/PERSONA_PROMPT_EXAMPLE_qiu_jin.md` 的预设问答格式。

**⚠️ relevance_today 是静态预生成，而非运行时动态生成。** 文本写法上做到"伪个性化"——好的文本不需要知道用户是谁，而是让用户觉得"这就是在说我"。秋瑾示例中"当你在职场或家庭中被规训'女孩子不要太激进'时"就是这种写法。**Demo 不依赖用户身份采集，不依赖 L2 后端。** 如果 Demo 后有余力，可在详情面板底部加一个很小的入口（"这段话是为你写的吗？"），让用户选择身份标签（学生/职场人/创作者），走 L2 动态生成一份个性化版本——这是可选增强，不影响 Demo 主路径。

**文件所有权：** `data/stories.json`、`data/connections.json`、`docs/` 中的 prompt 文档

---

## 文件所有权矩阵（避免冲突）

| 目录/文件 | 所有者 |
|-----------|--------|
| `src/components/globe/GlobeScene.tsx` | yuqing |
| `src/components/globe/NetworkGraph.tsx` | xinlu |
| `src/components/globe/ConnectionArc.tsx` | yuqing |
| `src/hooks/useGlobeSelection.tsx` | yuqing |
| `src/pages/HomePage.tsx` | yuqing |
| `src/components/ui/SummaryCard.tsx` | yuqing |
| `src/components/ui/DetailPanel.tsx` | xinlu |
| `src/components/ui/SurpriseMe.tsx` | yuqing |
| `src/components/ui/ThemeChips.tsx` | xinlu |
| `src/components/ui/DetailPanel.tsx` | xinlu |
| `src/pages/PersonPage.tsx` | xinlu |
| `src/components/layout/Layout.tsx` | xinlu（计数面板部分） |
| `api/chat.ts` | ruofan |
| `api/persona/[id].ts` | ruofan |
| `src/hooks/useFavorites.ts` | ruofan |
| `src/data/load.ts` | ruofan |
| `src/App.tsx` | ruofan |
| `.github/workflows/ci.yml` | ruofan |
| `data/stories.json` | zhuqian |
| `data/connections.json` | zhuqian |
| `docs/prompts/` | zhuqian |

---

## 需要配合协调的部分（⚠️ 不是完全零冲突）

以下标记了文件所有权矩阵中**隐藏的依赖关系**，以及需要两人配合才能完成的工作。

### 协调点 1：`useGlobeSelection.tsx`（yuqing）← 被 ruofan 和 xinlu 依赖

**yuqing 拥有**这个 hook，但它是全队最重要的接口契约：

| 谁用 | 怎么用 | 协调方式 |
|------|--------|---------|
| yuqing | GlobeScene 通过它读写选中状态 | 自己维护 |
| ruofan | 深链 `/person/:id` 需要调用 `selectPerson(id)` 来同步 URL → 选中状态 | ruofan 看完 hook 接口后，和 yuqing 确认调用方式，不修改 hook 源码 |
| xinlu | ThemeChips 需要 `setHighlightTheme()`，NetworkGraph 需要 `selectPerson()` | 同上 |

**协调动作：** yuqing 先把 hook 的接口文档（类型签名 + 每个方法的一句话说明）发给 ruofan 和 xinlu。

### 协调点 2：`App.tsx`（ruofan）← 三人都可能改

**ruofan 拥有** App.tsx（路由配置），但所有人都可能需要在里面加路由：

| 场景 | 谁需要 | 协调方式 |
|------|--------|---------|
| yuqing 或 xinlu 新增页面（如网络图独立路由） | yuqing / xinlu | 在群聊里说"我要加一个 `/network` 路由"，ruofan 来改，或者 ruofan 同意后自己改并立刻 PR 合入 |
| ruofan 加深链 `/person/:id` | ruofan | 自己改 |
| ruofan 加 DataGate 错误边界 | ruofan | 自己改 |

**协调动作：** ruofan 在 Day0 晚先把 App.tsx 的基础路由结构搭好，之后任何人需要改路由都在群聊里说一声。

### 协调点 3：`Layout.tsx`（yuqing 基础布局 + xinlu 计数面板）

**文件属于 yuqing**，但左下角计数面板是 xinlu 的任务。两个人改同一个文件。

| 谁 | 改什么 |
|----|--------|
| yuqing | 顶部品牌、SurpriseMe 按钮位置、整体布局结构 |
| xinlu | 左下角计数面板（"已点亮 N 位 · M 条呼应"的升级） |

**协调动作：** xinlu 把计数面板写成独立组件（如 `<StatsPanel />`），yuqing 在 Layout.tsx 里只加一行 `<StatsPanel />`。这样 xinlu 不需要改 Layout.tsx。

### 协调点 4：`data/schema.ts`（已定型，不要改）← 全队契约

**这个文件是数据契约，四个人都依赖它，但任何人都不应该改它。**

| 谁 | 依赖方式 |
|----|---------|
| zhuqian | 按 schema 填 stories.json 和 connections.json |
| yuqing | GlobeScene 读取 Person 和 Connection 类型 |
| xinlu | ThemeChips / NetworkGraph 读取 Person 类型 |
| ruofan | load.ts 用 zod schema 校验数据 |

**协调动作：** 如果任何人发现 schema 不够用（如需要加字段），先在群聊里提出来，全队确认后再改，改完立刻通知所有人。

### 协调点 5：zhuqian（数据）← → xinlu（数据呈现角度审核）

**交叉审核**是双向的：

| 方向 | 内容 |
|------|------|
| zhuqian → xinlu | zhuqian 填完一批 stories 后，发给 xinlu 看。xinlu 从"这个数据在页面上看起来会是什么样"的角度提反馈。比如："这个人的 short_story 太长了，在详情面板里会撑爆"、"这个人的 themes 只有 1 个，在筛选条里会显得很孤单" |
| xinlu → zhuqian | xinlu 做完 ThemeChips 或统计面板后，发现数据覆盖有问题（如"教育议题才 2 个人，筛选条上这个标签会很空"），反馈给 zhuqian 补数据 |

**协调动作：** Day1 晚和 Day2 上午各安排一次 15 分钟的交叉审核。

### 协调点 6：ruofan（后端 API）← → zhuqian（prompt 模板）

ruofan 的 `api/chat.ts` 和 `api/persona/[id].ts` 需要依赖 zhuqian 的 prompt 模板：

| ruofan 需要 | zhuqian 提供 | 时间 |
|------------|-------------|------|
| persona prompt 模板 | 基于 `docs/PERSONA_PROMPT_EXAMPLE_qiu_jin.md` 调整后的通用模板 | Day1 上午 |
| 预设问答数据 | 3-5 位人物的 Q&A 对 | Day1 晚 |

**协调动作：** zhuqian 在 Day1 上午先把 prompt 模板定稿发给 ruofan，ruofan 用这个模板写 `api/persona/[id].ts`。

### 协调点 7：`NetworkGraph.tsx`（xinlu）← 初始版本由 yuqing 写了

**xinlu 拥有**这个文件，但 yuqing 已经写了一个基础版本。xinlu 接手后：

- 可以自由修改，不需要问 yuqing
- 如果改坏了，可以从 git 历史恢复 yuqing 的版本
- 如果发现需要 GlobeScene 配合（如从网络图点击节点回到地球的某个状态），和 yuqing 沟通 `useGlobeSelection` 的接口

### 协调点 8：useFavorites（ruofan）→ 光点收藏标记（yuqing）

**ruofan 写收藏 hook，但地球上显示收藏标记的光点样式是 yuqing 的 GlobeScene。**

| 谁 | 做什么 |
|----|--------|
| ruofan | 写 `src/hooks/useFavorites.ts`，暴露 `{ favorites: Set<string>, toggleFavorite(id), isFavorite(id) }` 接口 |
| yuqing | 在 GlobeScene 的光点渲染中调用 `isFavorite(id)`，给已收藏的光点加特殊样式（如星形边框或额外光晕） |

**协调动作：** ruofan 先把 hook 接口写定（类型签名），发给 yuqing。yuqing 在 GlobeScene 中 import 使用。两者不修改对方的文件。

### 协调汇总表

| 协调点 | 涉及人 | 冲突类型 | 解决方式 |
|--------|--------|---------|---------|
| useGlobeSelection hook | yuqing + ruofan + xinlu | 接口依赖 | yuqing 先写文档，其他人只读不写 |
| App.tsx 路由 | ruofan + yuqing + xinlu | 同文件 | 群聊沟通 + 立刻 PR 合入 |
| Layout.tsx 计数面板 | yuqing + xinlu | 同文件 | xinlu 写独立组件，yuqing 只加一行引用 |
| data/schema.ts | 全队 | 契约 | 锁定不改，要改先全队确认 |
| 交叉审核 | zhuqian + xinlu | 流程依赖 | Day1 晚和 Day2 上午各 15 分钟 |
| API + prompt 模板 | ruofan + zhuqian | 流程依赖 | zhuqian Day1 上午交付模板 |
| NetworkGraph 初始版本 | xinlu + yuqing | 代码交接 | xinlu 自由改，git 历史可恢复 |
| useFavorites → 光点标记 | ruofan + yuqing | 接口依赖 | ruofan 先写 hook 接口，yuqing 调用 |

---

## GitHub 分支

```
main
├── feat/globe-core          ← yuqing
├── feat/backend-arch         ← ruofan
├── feat/data-viz             ← xinlu
└── data/content              ← zhuqian
```

**规则：**
- 每人只碰自己的文件
- 如果必须改别人的文件，先在群聊里说一声，改完立刻 PR 合入
- 每天至少合并一次到 main，避免最后一天大规模冲突

---

## 48 小时排期

| 时段 | yuqing | ruofan | xinlu | zhuqian |
|------|--------|--------|-------|---------|
| **Day0 晚** | 弧线流动动画 | 搭 Vercel Functions 骨架 | 读 schema.ts + load.ts，理解数据流 | 列 60 人候选池 |
| **Day1 上午** | 性能优化 + 地球纹理 | api/chat.ts 实现 + 深链接口 | ThemeChips 恢复 + 增强 | 筛到 40 人，填第一批 10 人 |
| **Day1 下午** | 加载态 + 组件联调准备 | persona prompt API + 收藏功能 | 2D 星群网络图优化 | 填第二批 10 人 |
| **Day1 晚** | 集成联调 | 数据加载优化 + CI | 叙事呈现设计 + 实现 + 数据统计面板 | 草拟 connections |
| **Day2 上午** | Demo 动线排练 | 部署 Vercel 生产版 | 交叉审核（从数据呈现角度） | 交叉审核 + AI 生成文案 |
| **Day2 下午** | 全队走查 + 录屏 | 全队走查 + 录屏 | 全队走查 + 录屏 | 全队走查 + 录屏 |

---

*文档版本：v2.0 · 2026-08-20*