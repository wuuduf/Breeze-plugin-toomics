// Toomics Breeze 插件入口
import { getComicDetail } from "./detail";
import { PLUGIN_ID } from "./common";
import { buildPluginInfo } from "./get-info";
import { getRankingData } from "./lists";
import { getChapter, getReadSnapshot } from "./read";
import { getComicListSceneBundle, getRankingFilterBundle } from "./scenes";
import { searchComic } from "./search";
import {
  clearPluginCache,
  getCapabilitiesBundle,
  getSettingsBundle,
  onCookieChanged,
} from "./settings";
import { fetchImageBytes } from "./toomics-request";

export { PLUGIN_ID } from "./common";

async function getInfo(): Promise<ReturnType<typeof buildPluginInfo>> {
  return buildPluginInfo();
}

async function init(): Promise<{ source: string; data: { ok: boolean } }> {
  console.log("[toomics] 插件初始化");
  return { source: PLUGIN_ID, data: { ok: true } };
}

export default {
  init,
  getInfo,
  searchComic,
  getComicDetail,
  getReadSnapshot,
  getChapter,
  fetchImageBytes,
  getComicListSceneBundle,
  getRankingData,
  getRankingFilterBundle,
  getSettingsBundle,
  getCapabilitiesBundle,
  onCookieChanged,
  clearPluginCache,
};
