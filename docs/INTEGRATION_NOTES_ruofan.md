# 集成说明 · ruofan 模块（L2 后端 + 深链 + 收藏 + 数据加载）

> 本文件是 ruofan 模块交付给队友的对接说明。按所有权矩阵，以下文件已完成：
> `api/**`、`src/hooks/useFavorites.ts`、`src/data/load.ts`、`src/App.tsx`、
> `src/components/{DataGate,AppErrorBoundary,DeepLinkSync}.tsx`、`scripts/smoke-api.mjs`
>
> 分支：`feat/backend-arch`

---

## 1. 收藏接口（给 yuqing — 地球星标）

**接口契约**（`src/hooks/useFavorites.ts`）：

```ts
const { favorites, isFavorite, toggleFavorite } = useFavorites();
// favorites: string[]         已收藏 person id 列表
// isFavorite(id): boolean
// toggleFavorite(id): void    在 SummaryCard/DetailPanel 的收藏按钮里调用
```

> ⚠️ 与 TEAM_COLLABORATION_v2.md 协调点 8 的差异：文档写的是 `Set<string>`，
> 实际用 `string[]`（localStorage JSON 序列化友好）。如你已按 Set 编码请改用上述形状。

**Provider 已挂在 App.tsx**（FavoritesProvider 包住 GlobeSelectionProvider），
GlobeScene 内直接 `useFavorites()` 即可，无需自己管理 localStorage。

**地球星标建议实现**（GlobeScene 内，可选方案）：

```tsx
// 已收藏点：用 globe.gl 的 htmlElements 渲染星形标记（✦），
// 或者简单方案：收藏点改用金色 #F2C14E + 更大的 pointRadius。
const { isFavorite } = useFavorites();
// 在 pointsData 映射里加：
const pointsData = allPeople.map((p) => ({
  ...,
  isFavorite: isFavorite(p.id),
  // 收藏点半径放大 + 颜色改为金色
  size: p.id === selectedId ? 0.8 : isFavorite(p.id) ? 0.65 : 0.45,
  color: isFavorite(p.id) && !isSelected ? "#F2C14E" : getThemeColor(p.themes[0]),
}));
```

收藏按钮（SummaryCard/DetailPanel，yuqing/xinlu）：调 `toggleFavorite(person.id)`，
用 `isFavorite` 控制高亮态即可。

## 2. 深链行为契约（给 yuqing + xinlu）

**已实现**（App.tsx + DeepLinkSync.tsx，无需你们改代码）：

- 选中光点 → URL 变为 `/person/:id`（pushState，返回键逐级回退）
- 刷新 `/person/:id` → 地球渲染 + 选中恢复 + 镜头聚焦该人物
- 无效 id（如 `/person/xyz`）→ 自动重定向回 `/`
- `/network` 页面的选中操作不会触发 URL 跳转
- DetailPanel 内点联结 → URL 切到对方，联结高亮不受影响

**需要 yuqing 在 HomePage.tsx 应用 4 行 diff**（跨所有权改动，经群聊确认后合入）——
让深链"直接展开详情面板"而不是只恢复摘要卡：

```tsx
// src/pages/HomePage.tsx
import { useLocation, useNavigate } from "react-router-dom";
import { useGlobeSelection } from "@/hooks/useGlobeSelection";

export default function HomePage() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { selectedId } = useGlobeSelection();
  const showDetail = pathname.startsWith("/person/");        // 替代 useState(false)
  const handleOpenDetail = useCallback(() => {
    if (selectedId) navigate(`/person/${selectedId}`);
  }, [navigate, selectedId]);
  const handleCloseDetail = useCallback(() => navigate("/"), [navigate]);
  // 删除原 const [showDetail, setShowDetail] = useState(false)
  // 其余 JSX 不变
}
```

**若不接受此改动**：降级行为 = 深链刷新后只恢复摘要卡，用户点"阅读她的故事"
才开详情（功能完整，仅少一步）。

**相机聚焦**：当前 GlobeScene 的 init effect 声明在选中 effect 之前，
刷新深链时 globe 实例先就绪、聚焦正常，无需改动。若后续把 globe 初始化
改成异步（如等纹理加载），请在选中更新 effect 的依赖里加一个 globeReady
状态，否则聚焦会被静默丢弃。

## 3. PersonPage 去留（给 xinlu）

`/person/:id` 现在渲染主页地球（选中 + 详情由 DeepLinkSync 恢复），
`src/pages/PersonPage.tsx` 已从路由摘除但**文件保留在磁盘**。
你可以：删除它、改造成别的页面（如"关于"页）、或保留备用。

## 4. 后端接口（给全员）

部署后（Vercel）：

- `POST /api/chat` 请求 `{ message, persona_id? }` →
  `{ answer_md, citations: [{ person_id, source_url, quote }], model }`
  - 无 persona_id = 目录问答（第三人称）；带 persona_id = 角色对话（第一人称）
  - 错误码：`not_configured`(503，缺 ANTHROPIC_API_KEY) / `persona_not_found`(404) /
    `rate_limited`(429) / `model_output_error`(502) / `invalid_request`(400)
- `GET /api/persona/:id` → `{ persona_id, name_zh, name_en, prompt }`（纯模板、零 AI 调用）

本地验证：`npm run smoke:api`（无需 key；设 `ANTHROPIC_API_KEY` 环境变量可追加真实问答验证）。
本地联调已部署 API：CORS 已放宽（`Access-Control-Allow-Origin: *`），localhost:5173 可直接 fetch。

## 5. 部署清单（给 ruofan 后续 / 负责人）

1. **vercel.json rewrites**（深链刷新必需，functions 先于 rewrites 匹配，/api 不受影响）：
   ```json
   { "rewrites": [{ "source": "/(.*)", "destination": "/" }] }
   ```
2. Vercel 项目设置：framework 识别为 Vite（buildCommand `npm run build`，输出 `dist`）
3. 环境变量：`ANTHROPIC_API_KEY`（必需）、`MODEL`（可选，默认 claude-sonnet-5）
4. 上线后冒烟：GET `/api/persona/qiu_jin` → 200；硬刷新一个 `/person/:id` 深链 → 不 404

## 6. 数据加载契约（给 zhuqian）

- 数据加载改为懒加载 + DataGate：**数据结构无需任何改动**；
  stories.json/connections.json 现在由 Vite 拆成独立异步 chunk，改动数据后
  `npm run validate-data` 照常校验
- zod 校验仍在运行时执行：数据格式错误时用户看到友好错误屏（不再白屏）
- 未来一人一档（people/*.json）时，只需改 `src/data/load.ts` 的加载实现
