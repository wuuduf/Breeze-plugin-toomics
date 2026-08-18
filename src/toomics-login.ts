// Toomics 账号密码登录
import { pluginConfig, flutterTools } from "breeze-plugin-kit";
import { BASE } from "./common";
import { setCookie, getCookie } from "./toomics-request";

// 登录接口（邮箱账号密码）
export async function loginWithPassword(payload: Record<string, unknown> = {}): Promise<Record<string, unknown>> {
  let uid = String(payload?.userId ?? "").trim();
  let upw = String(payload?.userPw ?? "").trim();
  if (!uid || !upw) {
    const getV = async (k: string) => { try { const r = await pluginConfig.load(k, ""); return JSON.parse(r)?.value ?? ""; } catch { return ""; } };
    uid = await getV("account.user_id");
    upw = await getV("account.user_pw");
  }
  uid = uid.trim(); upw = upw.trim();
  if (!uid || !upw) {
    await flutterTools.showToast({ message: "请先填写账号密码", level: "warning", seconds: 2 });
    return { ok: false, message: "缺少账号或密码" };
  }

  const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/137.0.0.0";
  const existing = await getCookie();

  // 1) 先 GET 首页建立会话（若宿主自动管理 cookie，这步写入 GTOOMICScisession）
  try {
    await fetch(`${BASE}/en`, {
      headers: { "User-Agent": UA, Accept: "text/html", ...(existing ? { Cookie: existing } : {}) },
      signal: AbortSignal.timeout(15000),
    });
  } catch (e) {
    // 忽略 GET 失败，继续尝试登录
  }

  // 2) POST layer_login
  const bodyStr =
    `user_id=${encodeURIComponent(uid)}&user_pw=${encodeURIComponent(upw)}` +
    `&keep_cookie=Y&access_term=1&private_term=1`;

  let res;
  try {
    res = await fetch(`${BASE}/en/auth/layer_login`, {
      method: "POST",
      headers: {
        "User-Agent": UA,
        "Content-Type": "application/x-www-form-urlencoded",
        "X-Requested-With": "XMLHttpRequest",
        Referer: `${BASE}/en`,
        Accept: "application/json, text/javascript, */*; q=0.01",
        ...(existing ? { Cookie: existing } : {}),
      },
      body: bodyStr,
      signal: AbortSignal.timeout(15000),
    });
  } catch (e) {
    const msg = "网络异常: " + String((e as any)?.message ?? e).slice(0, 120);
    await flutterTools.showToast({ message: "❌ " + msg, level: "error", seconds: 4 });
    return { ok: false, message: msg };
  }

  const status = res.status;
  const rawText = await res.text().catch(() => "");
  let code = "";
  let ret = "";
  let isJson = false;
  try {
    const j = JSON.parse(rawText);
    isJson = true;
    code = String(j?.code ?? "");
    ret = String(j?.ret ?? "");
  } catch {}

  if (code === "200") {
    // 尝试存登录 cookie（若宿主未自动管理，这里把响应 set-cookie 手动存）
    try {
      const sc = res.headers.get("set-cookie") ?? "";
      if (sc) {
        const first = sc.split(";")[0];
        setCookie(existing ? existing + "; " + first : first);
      }
    } catch {}
    await flutterTools.showToast({ message: "✅ 登录成功", level: "success", seconds: 2 });
    return { ok: true, message: "登录成功", userId: ret, status, isJson };
  }

  const detail = ret || rawText.slice(0, 160).replace(/\s+/g, " ") || String(status);
  const msg = `登录失败 (HTTP ${status}${isJson ? "" : " 非JSON"})`;
  await flutterTools.showToast({ message: "❌ " + msg + "\n" + detail.slice(0, 120), level: "error", seconds: 5 });
  return { ok: false, message: msg, detail, status, isJson, raw: rawText.slice(0, 200) };
}

/** 设置字段变更回调 */
export async function onAuthChanged(payload: Record<string, unknown> = {}): Promise<Record<string, unknown>> {
  const p = (payload ?? {}) as any;
  const key = String(p.key ?? "");
  const value = p.value ?? "";
  if (key) {
    await pluginConfig.save(key, JSON.stringify({ value }));
    const getV = async (k: string) => { try { const r = await pluginConfig.load(k, ""); return JSON.parse(r)?.value ?? ""; } catch { return ""; } };
    const uid = await getV("account.user_id");
    const upw = await getV("account.user_pw");
    if (uid && upw) {
      await new Promise((r) => setTimeout(r, 800));
      return loginWithPassword({ userId: uid, userPw: upw });
    }
  }
  return { ok: true };
}

export async function logoutLogin(): Promise<Record<string, unknown>> {
  setCookie("");
  await pluginConfig.save("account.user_id", JSON.stringify({ value: "" }));
  await pluginConfig.save("account.user_pw", JSON.stringify({ value: "" }));
  await pluginConfig.save("account.cookie", JSON.stringify({ value: "" }));
  await flutterTools.showToast({ message: "已退出登录", level: "info", seconds: 2 });
  return { ok: true };
}
