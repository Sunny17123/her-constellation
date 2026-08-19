# SHESHAPES 项目初始化命令清单

> **执行顺序：从上到下，逐步粘贴到终端执行**
>
> 当前目录假设：`/Users/sunny/Claude/Projects/SHESHAPES`

---

## 第 1 步：安装依赖（~2-3 分钟）

```bash
cd /Users/sunny/Claude/Projects/SHESHAPES
npm install
```

**预期输出：**
- 下载 ~200MB 依赖
- 最后显示 `added xxx packages in xx s`
- **可能的警告**：`npm warn deprecated ...` 是正常的，不影响

**可能的错误：**
- 如果报 `ERESOLVE unable to resolve dependency tree` → 跑 `npm install --legacy-peer-deps`
- 如果网络慢 → 跑 `npm install --registry=https://registry.npmmirror.com`

---

## 第 2 步：初始化 shadcn/ui（~1 分钟）

```bash
npx shadcn@latest init
```

**交互式问答，按以下选择：**
```
✔ Which style would you like to use? › Default
✔ Which color would you like to use as base color? › Slate
✔ Would you like to use CSS variables for colors? › yes
```

**预期输出：**
- 自动更新 `tailwind.config.js`、`src/index.css`、`components.json`
- 在 `src/components/ui/` 下生成基础组件

**可能的错误：**
- 如果报 `components.json already exists` → 选择 `Overwrite`
- 如果提示 `tailwind.config.js not found` → 检查是否在当前目录

---

## 第 3 步：安装 shadcn 常用组件（~30 秒）

```bash
npx shadcn@latest add button card badge drawer dialog scroll-area
```

**预期输出：**
- 在 `src/components/ui/` 下生成 6 个组件文件

---

## 第 4 步：验证数据（~5 秒）

```bash
npm run validate-data
```

**预期输出：**
```
========== SHESHAPES 数据校验 ==========
人物数: 3
联结数: 3
议题覆盖: 4 / 7

✅ 数据全部通过校验
```

**可能的错误：**
- 如果报校验错误 → 根据提示修复 `data/stories.json` 或 `data/connections.json`

---

## 第 5 步：类型检查（~10 秒）

```bash
npm run typecheck
```

**预期输出：**
- 无输出（表示通过）
- 如果有 TS 错误，会逐个列出

---

## 第 6 步：启动开发服务器（~5 秒）

```bash
npm run dev
```

**预期输出：**
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

**验证：**
1. 浏览器打开 `http://localhost:5173/`
2. 应该看到：
   - 深色星空背景
   - 一个缓慢自转的 3D 地球
   - 地球上 3 个光点（中国、印度、埃及）
   - 顶部左侧 "✦ Her Constellation" 标题
3. 点击任一光点 → 跳转到 `/person/:id` 详情页
4. 点击 "← 返回地球" 回到主页

**可能的错误：**
- 白屏 → 打开浏览器 DevTools Console 看报错
- 地球不显示 → 可能是 WebGL 不支持，告诉我报错信息

---

## 第 7 步：Git 初始化 + 首次提交（~10 秒）

```bash
git init
git add .
git commit -m "feat: initial project setup with Vite + React + globe.gl + shadcn/ui"
```

**预期输出：**
```
Initialized empty Git repository in /Users/sunny/Claude/Projects/SHESHAPES/.git/
[main (root-commit) xxxxxxx] feat: initial project setup...
 xx files changed, xxxx insertions(+)
```

---

## 第 8 步：创建 GitHub 仓库并推送（~10 秒）

```bash
gh repo create her-constellation --public --source=. --remote=origin --push
```

**参数说明：**
- `her-constellation` → 仓库名（可改）
- `--public` → 公开仓库（改 `--private` 则私有）
- `--source=.` → 当前目录
- `--push` → 立即推送

**预期输出：**
```
✓ Created repository Sunny17123/her-constellation on GitHub
✓ Added remote origin
✓ Pushed commits to origin main
```

**验证：**
- 浏览器打开 `https://github.com/Sunny17123/her-constellation`
- 应该能看到所有文件

---

## 完成！

到这里你已经有了：
- ✅ 本地可运行的 Vite + React 项目
- ✅ 3D 地球 + 3 个人物光点
- ✅ 详情页路由
- ✅ shadcn/ui 组件库
- ✅ GitHub 远程仓库

**下一步开发：**
- 添加摘要卡（SummaryCard）
- 添加议题筛选条（ThemeChips）
- 添加 Surprise Me 按钮
- 接入联结弧线（ConnectionArc）

---

**遇到问题？** 把报错信息完整贴给我，我帮你排查。
