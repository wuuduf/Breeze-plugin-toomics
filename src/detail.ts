// Toomics 详情 + 章节
import type {
  ChapterSummary,
  ComicDetailContract,
} from "breeze-plugin-kit";
import { PLUGIN_ID, toStringMap } from "./common";
import type { StringMap } from "breeze-plugin-kit";
import { parseToonPage, ToomicsEpisode } from "./toomics-html";
import { toomicsFetch } from "./toomics-request";

export async function getComicDetail(
  payload: Record<string, unknown> = {},
): Promise<ComicDetailContract> {
  const comicId = String(payload.comicId ?? "").trim();
  if (!comicId) throw new Error("comicId 不能为空");

  const html = await toomicsFetch(`/webtoon/episode/toon/${comicId}`);
  const info = parseToonPage(html);

  const eps: ChapterSummary[] = info.episodes.map((ep: ToomicsEpisode, i) => ({
    id: `${ep.codeId}-${ep.epNum}`,
    requestId: ep.codeId,
    logicalKey: ep.codeId,
    storageChapterId: `${comicId}-${ep.epNum}`,
    name: `${ep.isFree ? "[免费] " : "[VIP] "}${ep.title || `第 ${ep.epNum} 话`}`,
    order: i + 1,
    extern: { epNum: ep.epNum, codeId: ep.codeId, free: ep.isFree },
  }));

  const coverUrl =
    info.coverUrl || "https://httpstat.us/200?identifier=toomics-cover";

  return {
    source: PLUGIN_ID,
    comicId,
    extern: (payload.extern ?? null) as StringMap | null,
    scheme: {
      version: "1.0.0" as const,
      type: "comicDetail" as const,
      source: PLUGIN_ID,
    },
    data: {
      normal: {
        comicInfo: {
          id: comicId,
          title: info.title || `Toomics #${comicId}`,
          titleMeta: [
            { name: `章节数: ${eps.length}`, onTap: {}, extern: {} },
            ...(info.rating ? [{ name: `评分: ${info.rating}`, onTap: {}, extern: {} }] : []),
          ],
          creator: {
            id: "toomics",
            name: info.writer || "Toomics",
            avatar: {
              id: "toomics-avatar",
              url: coverUrl,
              name: "avatar",
              path: "toomics/avatar.jpg",
              extern: {},
            },
            onTap: {},
            extern: {},
          },
          description: info.description,
          cover: {
            id: comicId,
            url: coverUrl,
            name: `${comicId}.jpg`,
            path: `toomics/${comicId}/cover.jpg`,
            extern: {},
          },
          metadata: [
            ...info.categories.map((c) => ({
              type: "categories" as const,
              name: "分类",
              value: [{ name: c, onTap: {}, extern: {} }],
            })),
            {
              type: "status" as const,
              name: "状态",
              value: [
                {
                  name: info.finished ? "已完结" : "连载中",
                  onTap: {},
                  extern: {},
                },
              ],
            },
          ],
          extern: {},
        },
        eps,
        recommend: [],
        totalViews: 0,
        totalLikes: 0,
        totalComments: 0,
        isFavourite: false,
        isLiked: false,
        allowComments: false,
        allowLike: false,
        allowCollected: false,
        allowDownload: true,
        extern: {},
      },
      raw: { info },
    },
  };
}
