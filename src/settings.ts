// Toomics 插件设置：账号密码登录（或 cookie 可选）
import type {
  CapabilitiesBundleContract,
  SettingsBundleContract,
} from "breeze-plugin-kit";
import { PLUGIN_ID } from "./common";
import { setCookie, resetLangCache } from "./toomics-request";
import { cache, flutterTools, pluginConfig } from "breeze-plugin-kit";

export async function getSettingsBundle(): Promise<SettingsBundleContract> {
  let savedUid = "", savedUpw = "", savedCookie = "", savedLang = "";
  const getV = async (k: string): Promise<string> => {
    try { const r = await pluginConfig.load(k, ""); return JSON.parse(r)?.value ?? ""; } catch { return ""; }
  };
  savedUid = await getV("account.user_id");
  savedUpw = await getV("account.user_pw");
  savedCookie = await getV("account.cookie");
  savedLang = await getV("prefs.language");
  return {
    source: PLUGIN_ID,
    scheme: {
      version: "1.0.0" as const,
      type: "settings" as const,
      sections: [
        {
          title: "显示偏好",
          fields: [
            {
              key: "prefs.language",
              kind: "select" as const,
              label: "全局显示语言",
              options: [
                { label: "跟随系统（默认英文）", value: "" },
                { label: "英文 (English)", value: "en" },
                { label: "简体中文", value: "sc" },
                { label: "繁體中文", value: "tc" },
                { label: "日本語", value: "ja" },
                { label: "한국어", value: "ko" },
              ],
              fnPath: "onLangChanged",
              persist: true,
            },
          ],
        },
        {
          title: "账号",
          fields: [
            {
              key: "account.user_id",
              kind: "text" as const,
              label: "账号（邮箱）",
              fnPath: "onAuthChanged",
              persist: true,
            },
            {
              key: "account.user_pw",
              kind: "password" as const,
              label: "密码",
              fnPath: "onAuthChanged",
              persist: true,
            },
          ],
        },
        {
          title: "高级",
          fields: [
            {
              key: "account.cookie",
              kind: "text" as const,
              label: "登录 Cookie（可选，自动登录失败时用）",
              fnPath: "onCookieChanged",
              persist: true,
            },
          ],
        },
      ],
    },
    data: {
      canShowUserInfo: true,
      values: {
        "account.user_id": savedUid,
        "account.user_pw": savedUpw,
        "account.cookie": savedCookie,
        "prefs.language": savedLang,
      },
    },
  };
}

export async function onLangChanged(
  payload: Record<string, unknown> = {},
): Promise<Record<string, unknown>> {
  const value = String((payload as any).value ?? "");
  await pluginConfig.save("prefs.language", JSON.stringify({ value }));
  resetLangCache();
  await flutterTools.showToast({
    message: value ? `语言已切换（${value}）` : "语言已设为跟随系统",
    level: "success",
    seconds: 2,
  });
  return { ok: true };
}

export async function onCookieChanged(
  payload: Record<string, unknown> = {},
): Promise<Record<string, unknown>> {
  const value = String((payload as any).value ?? "");
  setCookie(value);
  await pluginConfig.save("account.cookie", JSON.stringify({ value }));
  await flutterTools.showToast({
    message: value ? "Cookie 已保存" : "Cookie 已清除",
    level: "success",
    seconds: 2,
  });
  return { ok: true };
}

export async function getCapabilitiesBundle(): Promise<CapabilitiesBundleContract> {
  return {
    source: PLUGIN_ID,
    scheme: {
      version: "1.0.0" as const,
      type: "capabilities" as const,
      actions: [
        { key: "logout", title: "退出登录", fnPath: "logoutLogin" },
        { key: "clear", title: "清理缓存", fnPath: "clearPluginCache" },
      ],
    },
    data: {},
  };
}

export async function clearPluginCache(): Promise<Record<string, unknown>> {
  await cache.set("toomics:*", null);
  await flutterTools.showToast({
    message: "缓存已清理",
    level: "success",
    seconds: 2,
  });
  return { ok: true };
}
