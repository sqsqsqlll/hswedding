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
├── functions/          Cloudflare Pages Functions（必須在根目錄）
│   └── api/rsvp.js     RSVP 中繼 → /api/rsvp
├── robots.txt          不希望被搜尋引擎收錄
├── .nojekyll           關閉 GitHub Pages 的 Jekyll 處理
└── README.md
```

**本版本庫只放「給賓客看」的公開頁面，外加 RSVP 的後端中繼。**
家庭內部文件與內部頁面**不要**放進來——這是公開版本庫，任何人都看得到。

那些檔案留在本機工作目錄（`docs/`、`site/`、`CLAUDE.md`），已列入 `.gitignore`，
不會被誤推上來。要看內部頁就本機起一個 server：

```bash
python3 -m http.server 8000   # → http://localhost:8000/site/family/
```

## 部署

推上 `main` 之後兩邊各自自動部署，約 1 分鐘上線。

| 平台 | 來源 | 產出 |
| --- | --- | --- |
| GitHub Pages | `main` 分支根目錄 | <https://sqsqsqlll.github.io/hswedding/> |
| Cloudflare Pages | 同一個 repo、同一個分支 | <https://hswedding.beyondtravelworld.com/>＋`/api/rsvp` |

兩邊內容一樣。同時掛兩個不是多餘的：`github.io` 在大陸常常連不上，
廣州親友走 Cloudflare 那個網域比較穩，而 RSVP 的端點本來就指著它。

### Cloudflare Pages 建置設定

| 欄位 | 值 |
| --- | --- |
| Production branch | `main` |
| Framework preset | None |
| Build command | 留空 |
| Build output directory | `/` |
| Root directory | 留空 |

**`functions/` 必須留在 repo 根目錄。** Cloudflare 只在 root directory 底下找它；
放進別的子目錄不會生效。

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

### 現在有兩套實作，同時只有一套在跑

| | Worker `hs-rsvp` | Pages Function `functions/api/rsvp.js` |
| --- | --- | --- |
| 位置 | Cloudflare 後台，不在版本庫 | 本版本庫 |
| 端點設定 | 後台編輯器改 `GOOGLE_ENDPOINT` 後重新 Deploy | Pages 環境變數 |
| 狀態 | **現行** | 待驗證後接手 |

**Worker 路由的優先序高於 Pages Function**，兩者並存時實際跑的是 Worker。
要驗證 Function 通不通，必須先停掉 Worker 路由；沒測到試算表真的多一列之前
不要刪 Worker，否則 RSVP 會斷。

### Function 的 Apps Script 網址走環境變數

**不寫在程式碼裡**——這是公開版本庫，寫進來等於開放任何人往 RSVP 試算表灌資料。

Pages 專案 → Settings → Environment variables → 新增 `GOOGLE_ENDPOINT`
＝ Apps Script 網頁應用程式網址（`/exec` 結尾），型別選 **Secret**，
Production 與 Preview 都要設。Apps Script 重新部署換網址時改這裡即可。

Worker 已設定 `Access-Control-Allow-Origin: *`，跨網域呼叫沒有問題。

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
