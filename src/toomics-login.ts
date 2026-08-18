// Toomics 账号密码登录
import { pluginConfig, flutterTools } from "breeze-plugin-kit";
import { BASE } from "./common";
import { setCookie, getCookie } from "./toomics-request";

// 登录接口（邮箱账号密码）
export async function loginWithPassword(payload: Record<string, unknown> = {}): Promise<Record<string, unknown>> {
  const userId = String(payload?.userId ?? "").trim();
  const userPw = String(payload?.userPw ?? "").trim();

  // 尝试从设置读票据（onAuthChanged 已存则用）
  let uid = userId;
  let upw = userPw;
  if (!uid || !upw) {
    const r1 = await pluginConfig.load("account.user_id", "");
    const r2 = await pluginConfig.load("account.user_pw", "");
    try { uid = JSON.parse(r1)?.value ?? ""; } catch {}
    try { upw = JSON.parse(r2)?.value ?? ""; } catch {}
  }
  uid = String(uid).trim();
  upw = String(upw).trim();
  if (!uid || !upw) {
    await flutterTools.showToast({ message: "请先填写账号密码", level: "warning", seconds: 2 });
    return { ok: false, message: "缺少账号或密码" };
  }

  const headers: Record<string, string> = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/137.0.0.0",
    "Content-Type": "application/x-www-form-urlencoded",
    "X-Requested-With": "XMLHttpRequest",
    Referer: `${BASE}/en`,
    Accept: "application/json, text/javascript, */*; q=0.01",
  };
  // 带上已存 cookie（若宿主未自动管理）
  const existing = await getCookie();
  if (existing) headers.Cookie = existing;

  const body = new URLSearchParams({
    user_id: uid,
    user_pw: upw,
    keep_cookie: "Y",
    access_term: "1",
    private_term: "1",
  }).toString();

  const res = await fetch(`${BASE}/en/auth/layer_login`, {
    method: "POST",
    headers,
    body,
    signal: AbortSignal.timeout(15000),
  });

  let json: Record<string, unknown> = {};
  try { json = await res.json(); } catch { /* 非 JSON */ }

  const code = String(json?.code ?? "");
  const ret = String(json?.ret ?? "");

  if (code === "200") {
    // 尝试把登录产生的 cookie 存起来（若宿主未自动管理）
    let setCookies = "";
    try { setCookies = res.headers.get("set-cookie") ?? ""; } catch {}
    if (setCookies) {
      setCookie(existing ? existing + "; " + setCookies.split(";")[0] : setCookies.split(";")[0]);
    }
    await flutterTools.showToast({ message: "✅ 登录成功", level: "success", seconds: 2 });
    return { ok: true, message: "登录成功", userId: ret };
  }

  const msg = ret || "登录失败";
  await flutterTools.showToast({ message: "❌ " + msg, level: "error", seconds: 3 });
  return { ok: false, message: msg };
}

/** 设置字段变更回调：账号/密码任一变化后保存并触发登录 */
export async function onAuthChanged(payload: Record<string, unknown> = {}): Promise<Record<string, unknown>> {
  const p = (payload ?? {}) as any;
  const key = String(p.key ?? "");
  const value = p.value ?? "";
  if (key) {
    await pluginConfig.save(key, JSON.stringify({ value }));
    // 账号或密码都填了 → 尝试登录
    const r1 = await pluginConfig.load("account.user_id", "");
    const r2 = await pluginConfig.load("account.user_pw", "");
    let uid = "", upw = "";
    try { uid = JSON.parse(r1)?.value ?? ""; } catch {}
    try { upw = JSON.parse(r2)?.value ?? ""; } catch {}
    if (uid && upw) {
      // 防抖：等另一个字段也填完
      await new Promise((r) => setTimeout(r, 800));
      return loginWithPassword({ userId: uid, userPw: upw });
    }
  }
  return { ok: true };
}

/** 退出登录（清会话） */
export async function logoutLogin(): Promise<Record<string, unknown>> {
  setCookie("");
  await pluginConfig.save("account.user_id", JSON.stringify({ value: "" }));
  await pluginConfig.save("account.user_pw", JSON.stringify({ value: "" }));
  await pluginConfig.save("account.cookie", JSON.stringify({ value: "" }));
  await flutterTools.showToast({ message: "已退出登录", level: "info", seconds: 2 });
  return { ok: true };
}
