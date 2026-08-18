// 列表数据源（发现页入口）：排行榜 / 最新 / 连载中 / 分类
import type { ComicPagedListContract } from "breeze-plugin-kit";
import { PLUGIN_ID, toStringMap } from "./common";
import { parseComicList, ToomicsComicCard } from "./toomics-html";
import { toomicsFetch } from "./toomics-request";
import { toComicListItem } from "./toomics-mapper";

// 分类 id → 列表路由（toomics 分类 URL）
const GENRE_ROUTES: Record<string, string> = {
  school: "school-life",
  romance: "romance",
  fantasy: "fantasy",
  action: "action",
  drama: "drama",
  comedy: "comedy",
  thriller: "thriller",
  horror: "horror",
  sciFi: "sci-fi",
  sports: "sports",
  mystery: "mystery",
  mature: "mature",
};

export async function getRankingData(
  payload: Record<string, unknown> = {},
): Promise<ComicPagedListContract> {
  const extern = toStringMap(payload.extern);
  const source = String(extern.source ?? "ranking");
  const page = Math.max(1, Number(payload.page ?? 1) || 1);

  let path = "/webtoon/ranking";
  if (source === "recent") path = "/webtoon/recent";
  else if (source === "ongoing") path = "/webtoon/ongoing_all";
  else if (source === "genre") {
    const genre = String(extern.genre ?? "");
    path = GENRE_ROUTES[genre]
      ? `/webtoon/genre/${GENRE_ROUTES[genre]}`
      : "/webtoon/recent";
  } else if (source === "new") path = "/webtoon/new_all";
  if (page > 1) path += `?page=${page}`;

  const html = await toomicsFetch(path);
  const cards: ToomicsComicCard[] = parseComicList(html);
  const items = await Promise.all(cards.map(async (c) => toComicListItem(c)));

  return {
    source: PLUGIN_ID,
    scheme: {
      version: "1.0.0" as const,
      type: "rankingFeed" as const,
    },
    data: {
      hasReachedMax: items.length < 24,
      items,
    },
  };
}
