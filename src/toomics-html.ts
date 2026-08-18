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
  // 章节条目: <li class="normal_ep"> <a onclick="...detail/code/{code}/ep/{ep}/toon/{toon}" data-e data-c data-v>
  //   状态: coin-type1 FFREE(免费) / coin-type5 VVIP(付费)
  const epRe =
    /<li class="normal_ep[^"]*"[^>]*>[\s\S]*?detail\/code\/(\d+)\/ep\/(\d+)\/toon\/(\d+)[\s\S]*?cell-title[\s\S]*?<strong[^>]*>([\s\S]*?)<\/strong>[\s\S]*?(FFREE|VIP ONLY|VVIP|FREE|VIP)/g;
  let m: RegExpExecArray | null;
  while ((m = epRe.exec(html)) !== null) {
    const flag = m[5];
    episodes.push({
      codeId: m[1],
      epNum: m[2],
      toonId: m[3],
      title: decodeHtml(m[4].trim()),
      isFree: flag === "FFREE" || flag === "FREE",
      isVip: flag === "VIP ONLY" || flag === "VVIP" || flag === "VIP",
      rating: "",
      date: "",
    });
  }
  // 宽松回退：只匹配 code/ep/toon + 附近 FFREE/VIP
  if (!episodes.length) {
    const looseRe =
      /detail\/code\/(\d+)\/ep\/(\d+)\/toon\/(\d+)[\s\S]{0,1500}?(FFREE|VIP ONLY|VVIP|FREE|VIP)/g;
    while ((m = looseRe.exec(html)) !== null) {
      episodes.push({
        codeId: m[1],
        epNum: m[2],
        toonId: m[3],
        title: `Episode ${m[2]}`,
        isFree: m[4] === "FFREE" || m[4] === "FREE",
        isVip: m[4] === "VIP ONLY" || m[4] === "VVIP" || m[4] === "VIP",
        rating: "",
        date: "",
      });
    }
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
