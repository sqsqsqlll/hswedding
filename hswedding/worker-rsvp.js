/**
 * Cloudflare Worker — RSVP 中繼站（Worker 版）
 *
 * 為什麼用這個檔而不是 functions/api/rsvp.js？
 *   因為用「後台拖曳上傳」部署的 Pages 不支援 functions/ 資料夾，
 *   所以改用獨立 Worker ＋ 路由的方式提供 /api/rsvp。
 *
 * ── 設定步驟（全程在 Cloudflare 後台，約 5 分鐘）──
 * 1. Cloudflare 後台 → Workers & Pages → Create → Worker
 *    範本選最基本的 Hello World，名稱取 hs-rsvp → Deploy
 * 2. 進入該 Worker → Edit code → 刪掉預設程式，貼上「本檔全部內容」→ Deploy
 * 3. 回 Worker 頁 → Settings → Domains & Routes → Add → Route
 *      Zone：beyondtravelworld.com
 *      Route：hswedding.beyondtravelworld.com/api/rsvp*
 *    儲存
 * 4. 到婚禮網站送一筆測試表單 → 應顯示「✓ 已收到」，試算表多一列
 *
 * ★ 若日後 Apps Script 重新部署換了網址，改下面 GOOGLE_ENDPOINT 後
 *   在 Worker 編輯器重新 Deploy 即可。
 */

const GOOGLE_ENDPOINT =
  "https://script.google.com/macros/s/AKfycbwzzjFo2tWGOi1GMf_bjGxwuWwHhTOpSetW1Aax-Tr-QktTNYZCuKD6dNK8nTWvyTmm/exec";

export default {
  async fetch(request) {
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }
    if (request.method !== "POST") {
      return json({ ok: false, error: "Method not allowed" }, 405);
    }
    try {
      const body = await request.text(); // 原封不動轉發賓客送來的 JSON
      const resp = await fetch(GOOGLE_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body,
      });
      // 檢查 Google 實際回傳內容，避免試算表沒寫進去卻回報成功
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
  },
};

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
