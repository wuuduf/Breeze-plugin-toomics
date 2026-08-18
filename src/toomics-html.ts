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
    const imgM = li.match(/<img[^>]*src="([^"]*thumb[^"]*)"[^>]*>/);
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
  // 注意：不能用带 <li ...> 锚定的正则（swc 编译会吃掉 < 开头的字面量），
  // 这里用无尖括号的全局匹配 + 从该位置向后取窗口判断 免费/VIP + 标题
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
    // 取该匹配位置向后的窗口（~800 字符）判断免费/VIP + 标题
    const win = html.slice(em.index, em.index + 900);
    const flagM = win.match(/FFREE|VIP ONLY|VVIP|VIP|FREE/);
    const flag = flagM ? flagM[0] : "VIP";
    const titleM = win.match(/>([^<>]{1,80})<\//);
    const title = titleM ? decodeHtml(titleM[1].trim()) : `Episode ${epNum}`;
    const isFree = flag === "FFREE" || flag === "FREE";
    episodes.push({
      codeId,
      epNum,
      toonId,
      title: title && title !== `Episode ${epNum}` ? title : `Episode ${epNum}`,
      isFree,
      isVip: !isFree,
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
