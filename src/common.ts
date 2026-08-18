// Toomics 插件公共常量与工具
export const PLUGIN_ID = "7c3f9a2e-5b1d-4e8a-9c4f-1d2e3f4a5b6c";

export const NOT_FOUND_IMAGE_URL =
  "https://httpstat.us/200?identifier=toomics-placeholder";

export const PLACEHOLDER_IMAGE_PATH = "placeholder/image-404.png";

export const BASE = "https://global.toomics.com";
export const IMAGE_CDN_RE = /https:\/\/toon-g\d?\.toomics\.com\/[^\s"'<>]+/g;

// 列表页语言路由（en 英语 / sc 简中 / tc 繁中 等）
export const LANG = "en";

export function toStringMap(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return value as Record<string, unknown>;
}

export function toNum(value: unknown, fallback = 0): number {
  const n = Number(value ?? fallback);
  return Number.isFinite(n) ? n : fallback;
}

/** 从 HTML 中提取所有正片图片 URL（toon-g CDN） */
export function extractViewerImages(html: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  let m: RegExpExecArray | null;
  const re = /https:\/\/toon-g\d?\.toomics\.com\/[^\s"'<>]+/g;
  while ((m = re.exec(html)) !== null) {
    const url = m[0];
    if (!seen.has(url)) {
      seen.add(url);
      out.push(url);
    }
  }
  return out;
}

/** HTML 解码实体 */
export function decodeHtml(input: string): string {
  return String(input ?? "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}
