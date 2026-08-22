import type { Person } from "@/data/schema";
import { getThemeColor } from "@/data/load";
import { getThemeZh } from "../../../data/themes";

/**
 * 统一格式分享卡片生成（手写 canvas，零新依赖）
 *
 * - 输出 1080×1440 PNG（3:4 竖版，微博/微信友好）
 * - 纯文字图形卡片（public/images/ 暂无人物照片，卡片不引用图片）
 * - 字体回退栈：index.html 未加载 webfont，实际渲染以演示机系统 CJK 衬线字体为准
 */

const CARD_W = 1080;
const CARD_H = 1440;
const BG = "#070B14";
const GOLD = "#F2C14E";
const TEXT_MAIN = "#F5F3EE";
const TEXT_MUTED = "#8B93A7";
const TAGLINE = "她们一直都在，只是没人点亮";
const FONT_SERIF = "'Noto Serif SC', 'STSong', 'SimSun', serif";

// 固定装饰星点（确定性，保证每次生成的卡片一致）
const STARS: [number, number, number][] = [
  [90, 140, 2],
  [180, 330, 1.5],
  [950, 260, 2],
  [1020, 520, 1.5],
  [70, 900, 1.5],
  [990, 1100, 2],
  [140, 1260, 1.5],
  [900, 1320, 1],
];

function createCanvas(): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement("canvas");
  canvas.width = CARD_W;
  canvas.height = CARD_H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("无法创建 canvas 2d 上下文");
  return [canvas, ctx];
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** 逐字换行（CJK 友好） */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const lines: string[] = [];
  let line = "";
  for (const ch of text) {
    const test = line + ch;
    if (ctx.measureText(test).width > maxWidth && line.length > 0) {
      lines.push(line);
      line = ch;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/** 居中文本：超宽自动缩小字号 */
function drawCenteredText(
  ctx: CanvasRenderingContext2D,
  text: string,
  y: number,
  font: string,
  fill: string,
  maxWidth = 900
): void {
  ctx.font = font;
  ctx.fillStyle = fill;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  const sizeMatch = /(\d+)px/.exec(font);
  let size = sizeMatch ? parseInt(sizeMatch[1], 10) : 32;
  while (ctx.measureText(text).width > maxWidth && size > 16) {
    size -= 2;
    ctx.font = font.replace(/(\d+)px/, `${size}px`);
  }
  ctx.fillText(text, CARD_W / 2, y);
}

/** 深空底色 + 装饰星点 + 顶部光晕 + 品牌行 */
function drawBase(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  const glow = ctx.createRadialGradient(540, 160, 0, 540, 160, 720);
  glow.addColorStop(0, "rgba(242, 193, 78, 0.10)");
  glow.addColorStop(1, "rgba(242, 193, 78, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  ctx.fillStyle = "rgba(255, 255, 255, 0.55)";
  for (const [x, y, r] of STARS) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  drawCenteredText(ctx, "✦ Her Constellation", 120, `400 40px ${FONT_SERIF}`, GOLD);
}

/** 议题胶囊徽章（主题色填充 + 深色文字） */
function drawThemeChips(
  ctx: CanvasRenderingContext2D,
  themes: string[],
  centerY: number
): void {
  const labels = themes.map((t) => getThemeZh(t));
  ctx.font = `400 28px ${FONT_SERIF}`;
  ctx.textBaseline = "middle";
  const widths = labels.map((l) => ctx.measureText(l).width + 56);
  const gap = 20;
  const total = widths.reduce((a, b) => a + b, 0) + gap * (labels.length - 1);
  let x = (CARD_W - total) / 2;
  labels.forEach((label, i) => {
    const w = widths[i];
    roundRect(ctx, x, centerY - 28, w, 56, 28);
    ctx.fillStyle = getThemeColor(themes[i]);
    ctx.fill();
    ctx.fillStyle = BG;
    ctx.textAlign = "center";
    ctx.fillText(label, x + w / 2, centerY + 1);
    x += w + gap;
  });
}

/** 金色分隔短线 */
function drawDivider(ctx: CanvasRenderingContext2D, y: number): void {
  ctx.strokeStyle = "rgba(242, 193, 78, 0.45)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(CARD_W / 2 - 60, y);
  ctx.lineTo(CARD_W / 2 + 60, y);
  ctx.stroke();
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("canvas 生成失败"))),
      "image/png"
    );
  });
}

/**
 * 单人卡片：品牌 + 姓名 + 年代地域 + 议题徽章 + 故事首句 + 深链 + tagline
 */
export async function renderPersonCard(
  person: Person,
  linkUrl?: string
): Promise<Blob> {
  const [canvas, ctx] = createCanvas();
  drawBase(ctx);

  drawCenteredText(ctx, person.name_zh, 310, `600 96px ${FONT_SERIF}`, TEXT_MAIN);
  drawCenteredText(ctx, person.name_en, 392, `400 36px ${FONT_SERIF}`, TEXT_MUTED);
  drawCenteredText(
    ctx,
    `${person.time_period} · ${person.region_zh}`,
    462,
    `400 30px ${FONT_SERIF}`,
    TEXT_MUTED
  );

  drawThemeChips(ctx, person.themes, 560);
  drawDivider(ctx, 680);

  // 故事首句（最多 8 行，超出截断）
  const firstSentence = person.short_story.split(/[。！？；]/)[0] ?? "";
  ctx.font = `400 34px ${FONT_SERIF}`;
  const lines = wrapText(ctx, firstSentence, 860).slice(0, 8);
  ctx.fillStyle = "rgba(245, 243, 238, 0.9)";
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  lines.forEach((line, i) => {
    ctx.fillText(line, CARD_W / 2, 800 + i * 58);
  });

  drawCenteredText(ctx, TAGLINE, 1300, `400 30px ${FONT_SERIF}`, GOLD);
  if (linkUrl) {
    drawCenteredText(
      ctx,
      linkUrl.replace(/^https?:\/\//, ""),
      1358,
      `400 26px ${FONT_SERIF}`,
      TEXT_MUTED
    );
  }

  return canvasToBlob(canvas);
}

/**
 * 感受卡片：品牌 + 「今天，我想说」 + 日期 + 用户感想 + tagline
 */
export async function renderFeelingCard(text: string): Promise<Blob> {
  const [canvas, ctx] = createCanvas();
  drawBase(ctx);

  drawCenteredText(ctx, "今天，我想说", 300, `600 88px ${FONT_SERIF}`, TEXT_MAIN);
  const date = new Date().toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  drawCenteredText(ctx, date, 380, `400 32px ${FONT_SERIF}`, TEXT_MUTED);
  drawDivider(ctx, 470);

  // 用户感想（输入已限 120 字，最多 10 行兜底）
  ctx.font = `400 36px ${FONT_SERIF}`;
  const lines = wrapText(ctx, text, 840).slice(0, 10);
  ctx.fillStyle = "rgba(245, 243, 238, 0.92)";
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  lines.forEach((line, i) => {
    ctx.fillText(line, CARD_W / 2, 580 + i * 62);
  });

  drawCenteredText(ctx, TAGLINE, 1300, `400 30px ${FONT_SERIF}`, GOLD);
  drawCenteredText(
    ctx,
    "✦ 她的星群 Her Constellation",
    1358,
    `400 26px ${FONT_SERIF}`,
    TEXT_MUTED
  );

  return canvasToBlob(canvas);
}
