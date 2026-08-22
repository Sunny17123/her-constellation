/**
 * 分享纯函数（无 JSX，便于复用与测试）
 *
 * 平台现实：
 * - 微博 / X 支持 URL intent，直接新窗口打开
 * - 微信 / 抖音无网页分享 intent（需官方号 SDK / 扫码），兜底 = 保存图片 + 复制链接
 * - 移动端优先走 Web Share API（Level 2 支持带图片文件）
 */

export function buildPersonShareLink(personId: string): string {
  return `${window.location.origin}/person/${personId}`;
}

export function buildPersonShareTitle(nameZh: string): string {
  return `遇见${nameZh} · 她的星群`;
}

export const FEELING_SHARE_TITLE = "今天，我想说 —— 来自她的星群";

export function weiboUrl(title: string, url: string): string {
  return `https://service.weibo.com/share/share.php?url=${encodeURIComponent(
    url
  )}&title=${encodeURIComponent(title)}`;
}

export function xUrl(title: string, url: string): string {
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    `${title} ${url}`
  )}`;
}

export function openShareIntent(url: string): void {
  window.open(url, "_blank", "noopener,noreferrer");
}

/** 复制文本：优先 Clipboard API，兜底 execCommand */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // 继续走兜底
  }
  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}

/**
 * Web Share API（移动端）
 * 优先带图片文件分享（Level 2），不支持/失败回退纯链接分享；用户取消返回 false
 */
export async function webShare(opts: {
  title: string;
  text: string;
  url: string;
  blob?: Blob;
}): Promise<boolean> {
  if (typeof navigator === "undefined" || !("share" in navigator)) return false;
  try {
    if (opts.blob && "canShare" in navigator) {
      const file = new File([opts.blob], "her-constellation.png", {
        type: "image/png",
      });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: opts.title,
          text: opts.text,
          files: [file],
        });
        return true;
      }
    }
    await navigator.share({ title: opts.title, text: opts.text, url: opts.url });
    return true;
  } catch {
    return false; // 用户取消 / 不支持
  }
}

/** 触发浏览器下载（<a download> 对 blob URL） */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // 延迟回收，确保下载已开始
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
