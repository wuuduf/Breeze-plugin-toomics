// 插件信息与功能入口
import { PLUGIN_ID } from "./common";

export function buildPluginInfo() {
  const scene = (title: string, source: string) => ({
    title,
    source: PLUGIN_ID,
    body: {
      type: "pluginPagedComicList" as const,
      request: {
        fnPath: "getRankingData",
        core: {},
        extern: { source },
      },
    },
    filter: {
      fnPath: "getRankingFilterBundle",
      extern: { source },
    },
  });

  return {
    name: "Toomics",
    uuid: PLUGIN_ID,
    iconUrl:
      "https://raw.githubusercontent.com/wuuduf/Breeze-plugin-toomics/main/assets/logo.png",
    creator: {
      name: "jelly",
      describe: "Toomics 漫画插件",
    },
    describe: "Toomics 全球漫画（排行榜/最新/连载中/分类/搜索/阅读）",
    version: "0.3.0",
    updateUrl:
      "https://api.github.com/repos/wuuduf/Breeze-plugin-toomics/releases/latest",
    home: "https://github.com/wuuduf/Breeze-plugin-toomics",
    function: [
      {
        id: "ranking",
        title: "排行榜",
        action: { type: "openComicList" as const, payload: { scene: scene("排行榜", "ranking") } },
      },
      {
        id: "recent",
        title: "最新更新",
        action: { type: "openComicList" as const, payload: { scene: scene("最新更新", "recent") } },
      },
      {
        id: "ongoing",
        title: "连载中",
        action: { type: "openComicList" as const, payload: { scene: scene("连载中", "ongoing") } },
      },
      {
        id: "new",
        title: "新作上架",
        action: { type: "openComicList" as const, payload: { scene: scene("新作上架", "new") } },
      },
      {
        id: "search",
        title: "搜索",
        action: {
          type: "openSearch" as const,
          payload: { source: PLUGIN_ID, keyword: "" },
        },
      },
    ],
  };
}
export const buildManifestInfo = buildPluginInfo;
