// Toomics 阅读：章节图片（免费章节直接解析，VIP 章节提示登录）
import type {
  ChapterContentContract,
  ChapterWithPages,
  ReadSnapshotContract,
} from "breeze-plugin-kit";
import { PLUGIN_ID, toStringMap } from "./common";
import type { StringMap } from "breeze-plugin-kit";
import { parseViewerPage } from "./toomics-html";
import { toomicsFetch } from "./toomics-request";

function buildPages(images: string[], comicId: string, codeId: string) {
  return images.map((url, i) => ({
    id: `${codeId}-p${i + 1}`,
    name: `${i + 1}.jpg`,
    path: `toomics/${comicId}/${codeId}/${i + 1}.jpg`,
    url,
    extern: {},
  }));
}

async function fetchChapterContent(comicId: string, codeId: string) {
  const html = await toomicsFetch(`/webtoon/detail/code/${codeId}/ep/1/toon/${comicId}`);
  const parsed = parseViewerPage(html);
  const epNum = (html.match(/\/ep\/(\d+)\/toon/) ?? [null, "1"])[1];
  return { ...parsed, epNum };
}

export async function getReadSnapshot(
  payload: Record<string, unknown> = {},
): Promise<ReadSnapshotContract> {
  const extern = toStringMap(payload.extern);
  const comicId = String(payload.comicId ?? "").trim();
  const codeId = String(payload.chapterId ?? extern.codeId ?? "").trim();
  if (!comicId || !codeId) throw new Error("comicId/chapterId 不能为空");

  const { images, epTitle, epNum, isVip } = await fetchChapterContent(comicId, codeId);
  const pages = buildPages(images, comicId, codeId);

  const chapter: ChapterWithPages = {
    id: codeId,
    requestId: codeId,
    logicalKey: codeId,
    storageChapterId: `${comicId}-${epNum}`,
    name: epTitle || `Episode ${epNum}`,
    order: Number(epNum),
    pages,
    extern: { free: !isVip },
  };

  return {
    source: PLUGIN_ID,
    extern: (payload.extern ?? null) as StringMap | null,
    data: {
      comic: { id: comicId, source: PLUGIN_ID, title: "", extern: {} },
      chapter,
      chapters: [],
    },
  };
}

export async function getChapter(
  payload: Record<string, unknown> = {},
): Promise<ChapterContentContract> {
  const extern = toStringMap(payload.extern);
  const comicId = String(payload.comicId ?? "").trim();
  const codeId = String(payload.chapterId ?? extern.codeId ?? "").trim();
  if (!comicId || !codeId) throw new Error("comicId/chapterId 不能为空");

  const { images, epTitle, epNum, isVip } = await fetchChapterContent(comicId, codeId);
  const pages = buildPages(images, comicId, codeId);

  return {
    source: PLUGIN_ID,
    comicId,
    chapterId: codeId,
    extern: (payload.extern ?? null) as StringMap | null,
    scheme: {
      version: "1.0.0" as const,
      type: "chapterContent" as const,
      source: PLUGIN_ID,
    },
    data: {
      comic: { id: comicId, source: PLUGIN_ID, title: epTitle, extern: {} },
      chapter: {
        id: codeId,
        requestId: codeId,
        logicalKey: codeId,
        storageChapterId: `${comicId}-${epNum}`,
        name: epTitle || `Episode ${epNum}`,
        order: Number(epNum),
        pages,
        extern: { free: !isVip },
      },
      chapters: [],
    },
  };
}
