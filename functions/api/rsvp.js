/**
 * Cloudflare Pages Function — RSVP 中繼站
 * 路徑：部署後會自動變成  https://你的網域/api/rsvp
 *
 * 作用：接收表單送來的資料，在「伺服器端」轉發到 Google Apps Script，
 *       再寫進同一張 Google 試算表。
 *
 * 為什麼要這一層？
 *   中國大陸的防火牆會擋掉「使用者 → Google」的直接連線，
 *   但擋不掉「Cloudflare → Google」（Cloudflare 的伺服器不在牆內）。
 *   所以中國親友先把資料送到 Cloudflare（連得上），
 *   再由 Cloudflare 幫忙轉交給 Google，資料就進得了同一張表。
 *
 * 設定：Apps Script 網址不寫在這個檔案裡（這是公開版本庫，寫進來等於公開，
 *       任何人都能直接往 RSVP 試算表塞資料）。改放 Cloudflare Pages 的環境變數：
 *
 *         Pages 專案 → Settings → Environment variables
 *         Variable name：GOOGLE_ENDPOINT
 *         Value：你的 Apps Script 網頁應用程式網址（/exec 結尾）
 *         型別選 Secret（加密），Production 與 Preview 都要設
 *
 *       Apps Script 日後重新部署換了網址，改那個環境變數即可，不用動程式碼。
 */

export async function onRequestPost(context) {
  try {
    const GOOGLE_ENDPOINT = context.env.GOOGLE_ENDPOINT;
    if (!GOOGLE_ENDPOINT) {
      return json({ ok: false, error: "伺服器未設定 GOOGLE_ENDPOINT 環境變數" }, 500);
    }
    const body = await context.request.text(); // 原封不動轉發賓客送來的 JSON
    const resp = await fetch(GOOGLE_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body,
    });
    // Apps Script 會 302 轉址到實際回應，fetch 會自動跟隨。
    // 必須檢查 Google 實際回傳的內容，避免試算表沒寫進去卻回報成功。
    const text = await resp.text().catch(() => "");
    let g = null;
    try { g = JSON.parse(text); } catch (_) {}
    if (!resp.ok || !g || g.ok !== true) {
      return json({ ok: false, error: (g && g.error) || ("Google 端回應異常 HTTP " + resp.status) }, 502);
    }
    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: String(err) }, 502);
  }
}

// 讓瀏覽器（含跨網域情況）能正常呼叫
export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
