// Toomics SSR 页面解析：列表 / 详情 / 章节 / 阅读页
import {
  decodeHtml,
  extractViewerImages,
  IMAGE_CDN_RE,
  PLUGIN_ID,
} from "./common";

/** 列表页漫画卡片 */
export interface ToomicsComicCard {
  toonId: string;
  title: string;
  writer: string;
  categories: string[];
  coverUrl: string;
  finished: boolean;
  remainEpisodes: number;
  description: string;
}

/** 解析列表页（ranking / recent / ongoing_all / genre / search）→ 漫画卡片 */
export function parseComicList(html: string): ToomicsComicCard[] {
  const cards: ToomicsComicCard[] = [];
  // 卡片: <li> <div class="visual"> <a href="...toon/{id}"> ...
  const liRe = /<li>[\s\S]*?<div class="visual">[\s\S]*?<\/li>/g;
  let m: RegExpExecArray | null;
  while ((m = liRe.exec(html)) !== null) {
    const li = m[0];
    const toonM = li.match(/toon\/(\d+)/);
    if (!toonM) continue;
    const titleM = li.match(/<h4[^>]*class="title"[^>]*>([\s\S]*?)<\/h4>/);
    const writerM = li.match(/<p[^>]*class="writer"[^>]*>([\s\S]*?)<\/p>/);
    // 封面懒加载：真实 URL 在 data-original（src 是 base64 占位）
    const imgM =
      li.match(/data-original="([^"]*thumb[^"]*)"/) ||
      li.match(/<img[^>]*src="([^"]*thumb[^"]*)"[^>]*>/);
    const descM = li.match(/<div class="text"><!--([\s\S]*?)--><\/div>/);
    const finM = li.match(/ico_fin[^>]*>\s*(End|完)/);
    const remainM = li.match(/section_remai[^>]*>([\d.]+)</);
    const catM = [...li.matchAll(/class="type\d+"[^>]*>([\s\S]*?)<\/span>/g)];
    cards.push({
      toonId: toonM[1],
      title: decodeHtml((titleM?.[1] ?? "").trim()),
      writer: decodeHtml((writerM?.[1] ?? "").trim()),
      categories: catM.map((c) => decodeHtml(c[1].trim())).filter(Boolean),
      coverUrl: imgM?.[1] ?? "",
      finished: Boolean(finM),
      remainEpisodes: remainM ? Number(remainM[1]) : 0,
      description: decodeHtml((descM?.[1] ?? "").replace(/<br\s*\/?>/g, " ").trim()),
    });
  }
  return cards;
}

/** 章节条目 */
export interface ToomicsEpisode {
  codeId: string;
  epNum: string;
  toonId: string;
  title: string;
  isFree: boolean; // FFREE = 免费
  isVip: boolean; // VVIP
  rating: string;
  date: string;
}

/** 解析详情页（toon 页）→ 漫画信息 + 章节列表 */
export function parseToonPage(html: string): {
  title: string;
  description: string;
  coverUrl: string;
  writer: string;
  categories: string[];
  episodes: ToomicsEpisode[];
  totalViews: string;
  rating: string;
  finished: boolean;
} {
  const titleM = html.match(/<meta property="og:title" content="([^"]*)"/);
  const descM = html.match(/<meta name="description" content="([^"]*)"/);
  const coverM = html.match(/<meta property="og:image" content="([^"]*)"/);
  const writerM = html.match(/keyword=([^"&]*author[^"&]*)"[^>]*>\s*([\s\S]*?)</) ?? html.match(/<p class="writer"[^>]*>([\s\S]*?)<\/p>/);
  const catM = [...html.matchAll(/class="type\d+"[^>]*>([\s\S]*?)<\/span>/g)];

  const episodes: ToomicsEpisode[] = [];
  // 章节条目: detail/code/{code}/ep/{ep}/toon/{toon}
  // 注意不能用带 <li ...> 锚定（swc 正则 bug），用无尖括号全局匹配 + 窗口
  // 免费/VIP 判定：coin-type1/cointype01 = 免费，coin-type5/cointype05 = VIP
  const epRe = /detail\/code\/(\d+)\/ep\/(\d+)\/toon\/(\d+)/g;
  const seen = new Set<string>();
  let em: RegExpExecArray | null;
  while ((em = epRe.exec(html)) !== null) {
    const codeId = em[1];
    const epNum = em[2];
    const toonId = em[3];
    const key = `${codeId}-${epNum}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const win = html.slice(em.index, em.index + 2600);
    // 免费：cointype01/coin-type1；VIP：cointype05/coin-type5（取章节范围内第一个）
    const cm1 = win.match(/cointype0[15]/)?.[0];
    const isFree = cm1 === "cointype01";
    const isVip = cm1 === "cointype05" || /VIP ONLY|VVIP/.test(win);
    episodes.push({
      codeId,
      epNum,
      toonId,
      title: `第 ${epNum} 话`,
      isFree,
      isVip: isVip || !isFree,
      rating: "",
      date: "",
    });
  }

  return {
    title: decodeHtml(titleM?.[1] ?? ""),
    description: decodeHtml(descM?.[1] ?? ""),
    coverUrl: coverM?.[1] ?? "",
    writer: writerM ? decodeHtml((writerM[2] ?? "").trim()) : "",
    categories: catM.map((c) => decodeHtml(c[1].trim())).filter(Boolean),
    episodes,
    totalViews: "",
    rating: "",
    finished: html.includes("ico_fin"),
  };
}

/** 解析阅读页（detail/code/ep/toon）→ 图片 URL 列表 */
export function parseViewerPage(html: string): {
  images: string[];
  epTitle: string;
  epCount: number;
  isVip: boolean;
} {
  const images = extractViewerImages(html);
  const epTitleM = html.match(/<title>([^<]*)<\/title>/);
  const vipM = html.match(/VVIP|Purchase Episode|purchase_coin/);
  return {
    images,
    epTitle: decodeHtml(epTitleM?.[1] ?? ""),
    epCount: images.length,
    isVip: Boolean(vipM) && images.length === 0,
  };
}

export { IMAGE_CDN_RE };
