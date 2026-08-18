// 列表数据（排行榜 / 最新 / 连载中 / 分类）→ 统一映射为 ComicListItem
import type { ComicListItem } from "breeze-plugin-kit";
import { PLUGIN_ID } from "./common";
import { ToomicsComicCard } from "./toomics-html";

export async function toComicListItem(card: ToomicsComicCard): Promise<ComicListItem> {
  const path = `toomics/${card.toonId}/cover.jpg`;
  return {
    source: PLUGIN_ID,
    id: card.toonId,
    title: card.title,
    subtitle: card.writer,
    finished: card.finished,
    likesCount: 0,
    viewsCount: card.remainEpisodes,
    updatedAt: "",
    cover: {
      id: card.toonId,
      url: card.coverUrl || "https://httpstat.us/200?identifier=toomics",
      path,
      name: "",
      extern: { path },
    },
    metadata: card.categories.map((c) => ({
      type: "categories",
      name: "分类",
      value: [{ name: c, onTap: {}, extern: {} }],
    })),
    raw: {
      id: card.toonId,
      title: card.title,
      writer: card.writer,
      description: card.description,
      image: card.coverUrl,
      finished: card.finished,
    },
    extern: {},
  } satisfies ComicListItem;
}
