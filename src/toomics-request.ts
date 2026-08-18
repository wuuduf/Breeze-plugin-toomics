// Toomics 网络层：fetch 封装（带 Referer / cookie / UA / 动态语言）
import { BASE } from "./common";
import { pluginConfig } from "breeze-plugin-kit";

let cachedCookie = "";
let cookieLoaded = false;
let cachedLang: string | null = null;

// 语言设置 → URL 路由前缀（en 英文 / sc 简中 / tc 繁中 / ja 日文 / ko 韩文）
const LANG_MAP: Record<string, string> = {
  en: "en",
  "": "en",
  "zh_cn": "sc",
  "sc": "sc",
  "cn": "sc",
  "zh_tw": "tc",
  "tc": "tc",
  "tw": "tc",
  ja: "ja",
  jp: "ja",
  ko: "ko",
  kr: "ko",
};

async function getLangPrefix(): Promise<string> {
  if (cachedLang) return cachedLang;
  try {
    const raw = await pluginConfig.load("prefs.language", "");
    const parsed = JSON.parse(raw);
    const choice = String(parsed?.value ?? "");
    // 跟随系统：空值 → 默认英文（Breeze 未暴露系统语言时用 en）
    cachedLang = LANG_MAP[choice] ?? "en";
  } catch {
    cachedLang = "en";
  }
  return cachedLang;
}

export function resetLangCache() {
  cachedLang = null;
}

/** 读取设置中保存的登录 cookie（可选） */
export async function getCookie(): Promise<string> {
  if (!cookieLoaded) {
    cookieLoaded = true;
    try {
      const raw = await pluginConfig.load("account.cookie", "");
      const parsed = JSON.parse(raw);
      cachedCookie = String(parsed?.value ?? "");
    } catch {
      cachedCookie = "";
    }
  }
  return cachedCookie;
}

export function setCookie(value: string) {
  cachedCookie = value;
  cookieLoaded = true;
}

/**
 * 请求页面/接口
 * - html: true 时返回文本
 * - referer 默认 global.toomics.com（图片 CDN 校验）
 */
export async function toomicsFetch(
  path: string,
  opts: { referer?: string; timeoutMs?: number } = {},
): Promise<string> {
  const cookie = await getCookie();
  const lang = await getLangPrefix();
  const headers: Record<string, string> = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36",
    Referer: opts.referer ?? `${BASE}/${lang}`,
    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
  };
  if (cookie) {
    headers.Cookie = cookie;
  }
  const res = await fetch(path.startsWith("http") ? path : `${BASE}/${lang}${path}`, {
    headers,
    signal: AbortSignal.timeout(opts.timeoutMs ?? 20000),
  });
  if (!res.ok) {
    throw new Error(`请求失败: ${res.status} ${res.statusText}`);
  }
  return res.text();
}

/** 图片字节下载（带 Referer，必须加二进制透传头） */
export async function fetchImageBytes({
  url = "",
  timeoutMs = 30000,
}: {
  url?: string;
  timeoutMs?: number;
} = {}): Promise<Uint8Array<ArrayBufferLike>> {
  const targetUrl = String(url).trim();
  if (!targetUrl) throw new Error("url 不能为空");
  const cookie = await getCookie();
  const headers: Record<string, string> = {
    "x-rquickjs-host-offload-binary-v1": "1",
    Referer: `${BASE}/en`,
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36",
    Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
  };
  if (cookie) {
    headers.Cookie = cookie;
  }
  const res = await fetch(targetUrl, {
    headers,
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) {
    throw new Error(`图片下载失败: ${res.status}`);
  }
  return new Uint8Array(await res.arrayBuffer());
}
