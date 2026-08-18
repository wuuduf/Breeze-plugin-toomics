// 发现页场景（排行榜 / 最新 / 连载中 / 分类）+ 筛选
import type {
  ComicListSceneBundleContract,
  FilterBundleContract,
} from "breeze-plugin-kit";
import { PLUGIN_ID } from "./common";

function buildScene(title: string, source: string, genre = "") {
  return {
    title,
    source: PLUGIN_ID,
    body: {
      type: "pluginPagedComicList" as const,
      request: {
        fnPath: "getRankingData",
        core: {},
        extern: { source, genre },
      },
    },
    filter: {
      fnPath: "getRankingFilterBundle",
      extern: { source },
    },
  };
}

export async function getComicListSceneBundle(): Promise<ComicListSceneBundleContract> {
  return {
    source: PLUGIN_ID,
    scheme: {
      version: "1.0.0" as const,
      type: "comicListSceneBundle" as const,
    },
    data: {
      scene: buildScene("Toomics 排行榜", "ranking"),
    },
  };
}

/** 筛选（榜单类型/分类） */
export async function getRankingFilterBundle(): Promise<FilterBundleContract> {
  return {
    source: PLUGIN_ID,
    scheme: {
      version: "1.0.0" as const,
      fields: [
        {
          key: "source",
          kind: "choice" as const,
          label: "列表",
          options: [
            { label: "排行榜", value: "ranking", result: { extern: { source: "ranking" } } },
            { label: "最新", value: "recent", result: { extern: { source: "recent" } } },
            { label: "连载中", value: "ongoing", result: { extern: { source: "ongoing" } } },
          ],
        },
        {
          key: "genre",
          kind: "choice" as const,
          label: "分类",
          options: [
            { label: "校园", value: "school", result: { extern: { source: "genre", genre: "school" } } },
            { label: "恋爱", value: "romance", result: { extern: { source: "genre", genre: "romance" } } },
            { label: "奇幻", value: "fantasy", result: { extern: { source: "genre", genre: "fantasy" } } },
            { label: "动作", value: "action", result: { extern: { source: "genre", genre: "action" } } },
            { label: "剧情", value: "drama", result: { extern: { source: "genre", genre: "drama" } } },
            { label: "搞笑", value: "comedy", result: { extern: { source: "genre", genre: "comedy" } } },
            { label: "惊悚", value: "thriller", result: { extern: { source: "genre", genre: "thriller" } } },
            { label: "恐怖", value: "horror", result: { extern: { source: "genre", genre: "horror" } } },
            { label: "科幻", value: "sciFi", result: { extern: { source: "genre", genre: "sciFi" } } },
            { label: "体育", value: "sports", result: { extern: { source: "genre", genre: "sports" } } },
            { label: "悬疑", value: "mystery", result: { extern: { source: "genre", genre: "mystery" } } },
            { label: "成人", value: "mature", result: { extern: { source: "genre", genre: "mature" } } },
          ],
        },
      ],
    },
    data: { values: { source: "ranking" } },
  };
}
