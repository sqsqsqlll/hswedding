# Harry & Sincer · 婚禮網站

2027.05.16（週日・午宴）廣州婚宴邀請頁。繁中／簡中／English 三語切換。

線上網址：<https://sqsqsqlll.github.io/hswedding/>

---

## 目錄結構

```
.
├── index.html          主頁：故事線、婚宴資訊、延伸旅遊、RSVP 表單
├── taiwan/
│   └── index.html      台灣賓客須知：台胞證、航班、張家界 B 團、注意事項
├── robots.txt          不希望被搜尋引擎收錄
├── .nojekyll           關閉 GitHub Pages 的 Jekyll 處理
└── README.md
```

**本版本庫只放「給賓客看」的公開頁面。** 婚前協議、企劃書、婚前共識總表、
family 內部頁、場地比較表、總時間表等屬於家庭內部文件，**不要**放進來——
這是公開版本庫，任何人都看得到，也會被搜尋引擎收錄。

## 部署

GitHub Pages，來源為 `main` 分支根目錄。推上 `main` 後約 1 分鐘自動上線。

兩個頁面之間一律使用**相對路徑**（主頁 → `taiwan/`；台灣頁 → `../`），
所以無論網站掛在 `sqsqsqlll.github.io/hswedding/` 這種子路徑底下，
還是掛在自訂網域的根目錄，連結都不會壞。

> 不要把站內連結改回 `/taiwan/` 或 `/` 這種絕對路徑，在子路徑部署下會失效。

## RSVP 表單

表單資料流：

```
賓客瀏覽器  →  Cloudflare Worker  →  Google Apps Script  →  Google 試算表
```

中間那層 Cloudflare 是必要的：大陸的防火牆會擋「使用者 → Google」的直連，
但擋不掉「Cloudflare → Google」，所以廣州親友的回覆才進得了同一張表。

端點寫在 `index.html` 的 `RSVP_ENDPOINT` 常數：

```js
const RSVP_ENDPOINT = "https://hswedding.beyondtravelworld.com/api/rsvp";
```

網站本身搬到 GitHub Pages 之後，這個 Worker 仍留在 Cloudflare 繼續當純 API
使用，不需要跟著搬。Worker 已設定 `Access-Control-Allow-Origin: *`，
跨網域呼叫沒有問題。

**Worker 端的維護**（程式碼在 Cloudflare 後台，不在本版本庫）：

- Worker 名稱：`hs-rsvp`
- 路由：`hswedding.beyondtravelworld.com/api/rsvp*`（Zone：`beyondtravelworld.com`）
- 若 Apps Script 重新部署換了網址，到 Worker 編輯器改 `GOOGLE_ENDPOINT` 後重新 Deploy
- **前提：`beyondtravelworld.com` 這個 Cloudflare zone 與該路由必須保留**，
  否則 RSVP 會失效。若日後要停掉 Cloudflare，需先把 Worker 改掛到
  `*.workers.dev` 網址，再回來改上面的 `RSVP_ENDPOINT`。

### 檢查表單有沒有通

送一筆測試資料，看試算表有沒有多一列：

```bash
curl -X POST https://hswedding.beyondtravelworld.com/api/rsvp \
  -H 'Content-Type: text/plain;charset=utf-8' \
  -d '{"name":"測試","attend":"出席","submitted_at":"2026-01-01T00:00:00Z"}'
```

回傳 `{"ok":true}` 即為正常。

## 本機預覽

```bash
python3 -m http.server 8000
# 開 http://localhost:8000/
```

## 搜尋引擎收錄

目前兩個頁面都帶 `<meta name="robots" content="noindex, nofollow">`，
搭配 `robots.txt` 擋收錄。若希望被搜尋得到，把 meta 拿掉並刪除 `robots.txt`。

## 待辦

- [ ] 主頁 `#photos` 三個位置仍是 `📷 Photo 1/2/3` 佔位，待換成婚紗照
- [ ] 婚宴場地未定案，`index.html` 的地點仍寫「廣州（詳細地址待定）」
