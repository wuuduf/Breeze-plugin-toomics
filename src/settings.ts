// Toomics 插件设置：账号 cookie（用于阅读 VIP / 等待解锁章节）
import type {
  CapabilitiesBundleContract,
  SettingsBundleContract,
} from "breeze-plugin-kit";
import { PLUGIN_ID } from "./common";
import { setCookie } from "./toomics-request";
import { cache, flutterTools, pluginConfig } from "breeze-plugin-kit";

export async function getSettingsBundle(): Promise<SettingsBundleContract> {
  let savedCookie = "";
  try {
    const raw = await pluginConfig.load("account.cookie", "");
    savedCookie = JSON.parse(raw)?.value ?? "";
  } catch {}
  return {
    source: PLUGIN_ID,
    scheme: {
      version: "1.0.0" as const,
      type: "settings" as const,
      sections: [
        {
          title: "账号",
          fields: [
            {
              key: "account.cookie",
              kind: "text" as const,
              label: "登录 Cookie（可选）",
              fnPath: "onCookieChanged",
              persist: true,
            },
          ],
        },
        {
          title: "说明",
          fields: [
            {
              key: "info.tip",
              kind: "text" as const,
              label: "提示",
              persist: false,
            },
          ],
        },
      ],
    },
    data: {
      canShowUserInfo: false,
      values: {
        "account.cookie": savedCookie,
        "info.tip": "",
      },
    },
  };
}

export async function onCookieChanged(
  payload: Record<string, unknown> = {},
): Promise<Record<string, unknown>> {
  const value = String((payload as any).value ?? "");
  setCookie(value);
  await pluginConfig.save(
    "account.cookie",
    JSON.stringify({ value }),
  );
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
