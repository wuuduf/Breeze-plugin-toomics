// Toomics 个人信息展示 + 登录引导页（bika 风格）
import type { UserInfoBundleContract } from "breeze-plugin-kit";
import { PLUGIN_ID } from "./common";
import { toomicsFetch } from "./toomics-request";

/** 从个人页解析用户信息 */
export async function getUserInfoBundle(): Promise<UserInfoBundleContract> {
  let username = "";
  let gender = "";
  let language = "";
  let hasSession = false;
  try {
    const html = await toomicsFetch("/mypage/me");
    hasSession = !html.includes("Become a member") && !html.includes(`"login"`);
    // 用户名（导航区显示邮箱 @ 或昵称）
    const m = html.match(/>([^<>@\s]+@[^<>]{2,40})<\/a>/);
    username = m ? m[1] : "";
    const gm = html.match(/性别[^<]*<\/[^>]+>\s*<[^>]*>\s*([^<\s]{2,12})/);
    gender = gm ? gm[1] : "";
    const lm = html.match(/语言[^<]*<\/[^>]+>\s*<[^>]*>\s*([^<\s]{2,12})/);
    language = lm ? lm[1] : "";
  } catch {
    // 忽略解析错误
  }

  if (!hasSession) {
    return {
      source: PLUGIN_ID,
      scheme: { version: "1.0.0" as const, type: "userInfo" as const },
      data: {
        title: "Toomics 账号",
        avatar: {
          id: "toomics-me",
          url: "https://httpstat.us/200?identifier=toomics-avatar",
          name: "avatar",
          path: "toomics/me.jpg",
          extern: {},
        },
        lines: ["未登录", "请在设置里填写账号密码登录"],
      },
    };
  }

  return {
    source: PLUGIN_ID,
    scheme: { version: "1.0.0" as const, type: "userInfo" as const },
    data: {
      title: "Toomics 账号",
      avatar: {
        id: "toomics-me",
        url: "https://httpstat.us/200?identifier=toomics-avatar",
        name: "avatar",
        path: "toomics/me.jpg",
        extern: {},
      },
      lines: [
        username || "已登录",
        gender ? `性别: ${gender}` : "",
        language ? `语言: ${language}` : "",
        "（Toomics 无每日签到，金币需购买）",
      ].filter(Boolean),
      extern: { signedIn: true },
    },
  };
}

/** 登录引导页（未登录访问需要登录的功能时弹出） */
export async function getLoginBundle() {
  return {
    source: PLUGIN_ID,
    scheme: {
      version: "1.0.0" as const,
      type: "login" as const,
      title: "Toomics 登录",
      fields: [
        { key: "account", kind: "text" as const, label: "账号（邮箱）" },
        { key: "password", kind: "password" as const, label: "密码" },
      ],
      action: {
        fnPath: "loginWithPassword",
        submitText: "登录",
      },
    },
    data: {
      account: "",
      password: "",
    },
  };
}
