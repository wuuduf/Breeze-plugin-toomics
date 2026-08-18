// Toomics 搜索
import type {
  ComicListItem,
  SearchResultContract,
} from "breeze-plugin-kit";
import { PLUGIN_ID, toStringMap } from "./common";
import type { StringMap } from "breeze-plugin-kit";
import { parseComicList, ToomicsComicCard } from "./toomics-html";
import { toomicsFetch } from "./toomics-request";
import { toComicListItem } from "./toomics-mapper";

export async function searchComic(
  payload: Record<string, unknown> = {},
): Promise<SearchResultContract> {
  const extern = toStringMap(payload.extern);
  const page = Math.max(1, Number(payload.page ?? extern.page ?? 1) || 1);
  const keyword = String(
    payload.keyword ?? extern.keyword ?? "",
  ).trim();
  if (!keyword) {
    throw new Error("搜索关键词不能为空");
  }
  const html = await toomicsFetch(
    `/webtoon/search_v2?keyword=${encodeURIComponent(keyword)}&page=${page}`,
  );
  const cards: ToomicsComicCard[] = parseComicList(html);
  const items: ComicListItem[] = await Promise.all(
    cards.map(async (c) => toComicListItem(c)),
  );
  const hasMore = html.includes("paging") && /next|下一页|>/.test(html) && cards.length > 0;
  return {
    source: PLUGIN_ID,
    extern: (payload.extern ?? null) as StringMap | null,
    scheme: {
      version: "1.0.0" as const,
      type: "searchResult" as const,
      source: PLUGIN_ID,
      list: "comicGrid",
    },
    data: {
      paging: {
        page,
        pages: page,
        total: cards.length,
        hasReachedMax: !hasMore,
      },
      items,
    },
    paging: {
      page,
      pages: page,
      total: cards.length,
      hasReachedMax: !hasMore,
    },
    items,
  };
}
