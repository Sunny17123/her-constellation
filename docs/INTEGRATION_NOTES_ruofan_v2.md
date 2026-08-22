# 集成说明 v2 · ruofan 模块（RAG 检索 + 分享）

> 本文件是 ruofan 第二批交付（「我想探索一个主题」搜索 + 分享功能）的对接说明。
> 全部为**新建文件**，未改动任何队友文件；需要队友应用的挂载 diff 见 §2-§4（共 3 处，每处几行）。
>
> 分支：`feat/backend-arch`
> 新建文件：
> - `api/search.ts`、`api/lib/search-core.ts`（后端检索）
> - `src/components/search/{SearchPanel,SearchResults,PersonResultCard,useSearch}.tsx/.ts`
> - `src/components/share/{ShareSheet,ShareButton,FeelingShareFab,renderCard}.tsx/.ts`
> - `src/lib/share.ts`、`src/vite-env.d.ts`

---

## 1. 检索接口（给全员）

`POST /api/search`，请求 `{ query: string(1..100), mode?: "auto" | "deterministic" | "llm" }`：

```jsonc
// 响应
{
  "mode": "deterministic" | "llm",
  "llm_skipped_reason": "…",   // 仅当 llm 被跳过（演示友好，前端显示轻提示）
  "results": [ // 0..3 条，字段均来自现有 schema，零 schema 改动
    { "person_id": "hipatia", "name_zh": "希帕蒂亚", "name_en": "…",
      "time_period": "…", "region_zh": "…", "themes": ["science","education"],
      "starter_score": 8.2, "matched_theme": "science",
      "snippet": "故事中相关的一句话", "match_reason": "议题匹配：科学参与", "score": 10 }
  ]
}
```

- `auto`（默认）：有 `ANTHROPIC_API_KEY` 时 Claude 语义重排 + 一行理由，任何失败自动降级确定性检索，**永不报错**
- `deterministic`：纯本地关键词/议题匹配，零 AI、无 key 可用（本地 smoke 即此路径）
- `llm`：强制 Claude；错误码与 `/api/chat` 一致（`not_configured` 503 / `rate_limited` 429 / `model_output_error` 502 / `invalid_request` 400）
- 零命中自动回退 top-3 精选（match_reason =「为你推荐」）

本地验证：`npm run smoke:api`（已含 `[4/4] search 端点断言` + CORS 预检断言）。
本地联调已部署 API：设 `VITE_API_BASE=https://已部署域名`（CORS 已放开，沿用 §1 集成说明的约定）。

## 2. 协调 diff 1（给 xinlu — Layout.tsx）搜索栏 + 分享感受入口

两处都挂进 Layout（SearchPanel 组件自带「✦ 我想探索一个主题」文案，左对齐）：

```tsx
// src/components/layout/Layout.tsx
import SearchPanel from "@/components/search/SearchPanel";          // ← 新增 import
import FeelingShareFab from "@/components/share/FeelingShareFab";   // ← 新增 import

// header 改为 items-start，logo 左列下方加搜索栏（右列 SurpriseMe 不动）：
<header className="fixed top-0 left-0 right-0 z-50 p-4 md:p-6">
  <div className="flex items-start justify-between gap-4">
    <div className="min-w-0 flex-1">
      <div className="pointer-events-none">…logo 与副标题原样…</div>
      <div className="mt-3">
        <SearchPanel />                                            // ← 新增
      </div>
    </div>
    <SurpriseMe />
  </div>
</header>

// </footer> 之后（footer 内计数面板不用动）：
<FeelingShareFab />                                                // ← 新增
```

行为：输入关键词（防抖 300ms 自动搜索）→ 桌面在输入框下方显示结果，移动端弹 vaul 抽屉；
点击结果卡片 → `selectPerson(id)`（既有契约）→ 摘要卡滑入 + URL 变 `/person/:id` + 相机聚焦。
「分享感受」入口组件自定位（桌面右上 `right-6 top-24`，移动 FAB `right-5 bottom-40`，与 SurpriseMe FAB 错开）。

## 3. 协调 diff 2（给 yuqing — SummaryCard.tsx）分享按钮

建议放在头部关闭按钮旁（不挤压底部操作行）：

```tsx
// src/components/ui/SummaryCard.tsx
import ShareButton from "@/components/share/ShareButton";    // ← 新增 import

// 头部行（名字 + X 关闭按钮之间）：
<div className="flex items-start justify-between">
  <div className="flex-1">…名字…</div>
  <div className="flex items-center gap-1">
    <ShareButton variant="icon" />                            // ← 新增
    <Button variant="ghost" size="icon" onClick={handleClose} …><X …/></Button>
  </div>
</div>
```

备选：若更想放操作行，在「随机另一位」之后加 `<ShareButton />`（带文字按钮）。两处选一处即可。

## 4. 协调 diff 3（给 xinlu — DetailPanel.tsx）分享按钮

桌面头部（X 关闭按钮旁）与移动头部（返回按钮旁）各加一个：

```tsx
// src/components/ui/DetailPanel.tsx
import ShareButton from "@/components/share/ShareButton";    // ← 新增 import

// 桌面：<div className="flex items-center justify-between px-6 py-4 border-b …">
//   在 X 关闭按钮前加：
<ShareButton variant="icon" />

// 移动：DrawerHeader 内 <div className="flex items-center justify-between">
//   在「返回」按钮后加：
<ShareButton variant="icon" />
```

## 5. 分享行为说明（给全员，演示脚本用）

- 入口：卡片/详情面板的分享按钮（分享单人卡片）、「分享感受」入口（输入感想 → 生成）
- 统一格式卡片：手写 canvas 生成 **1080×1440 PNG**（纯文字图形，深空底 + 品牌 + 议题色徽章 + tagline），零新依赖
- 平台矩阵：
  | 平台 | 行为 |
  |---|---|
  | 微博 | intent URL 新窗口（service.weibo.com/share） |
  | X | intent URL 新窗口（twitter.com/intent/tweet） |
  | 微信 / 抖音 | 无网页 intent → 复制链接 + 提示保存卡片图片前往 App 发送 |
  | 移动端 | 优先 `navigator.share`（Level 2 带图片文件），不可用则回落保存图片 |
- 单人卡片底部带 `/person/:id` 深链（已有 DeepLinkSync 支持，收卡人打开即可直达）

## 6. 验证清单

```bash
npm run typecheck        # 新增文件全部过严格 TS
npm run validate-data    # 未动 schema，应保持绿
npm run smoke:api        # 含 [4/4] search 断言（无 key）+ OPTIONS 预检断言
```

手动走查（`npm run dev`，需 `VITE_API_BASE` 指向已部署 API 或部署后访问）：
1. 左上角搜「教育」→ 3 张卡片 → 点希帕蒂亚 → 摘要卡滑入、URL 变 `/person/hipatia`
2. 搜「数学」→ 有 key 走 llm 给理由；无 key 走「为你推荐」回退，永不出错
3. 摘要卡分享 → 面板 → 生成 PNG → 下载 → 微博/X 打开正确 URL；微信/抖音出复制+保存提示
4. 分享感受 → 输入 → 生成 → 图片含品牌 + 日期 → 下载/系统分享
5. devtools 375px：搜索与分享均走 vaul 抽屉，两个 FAB（bottom-40 / bottom-24）不重叠
