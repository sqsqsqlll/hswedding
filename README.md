# Harry & Sincer · 婚禮網站

2027.05.15（週六・晚宴）廣州婚宴邀請頁，**場地確認中**。目前這版的目的是先收出席意願與人數，場地定案後再發正式喜帖。

主頁與值機表單的視覺來自 Claude Design 畫布「婚宴主視覺方案」的「邀請網頁 · 赤金登機」與「值機表單 · 送祝福」兩個畫板（繁中＋英文並排）；台灣賓客頁、行程頁仍是繁／簡／English 三語切換。

線上網址：<https://sqsqsqlll.github.io/hswedding/>

---

## 目錄結構

```
.
├── index.html          主頁：赤金登機邀請函（主視覺、航線圖、四時照片、登機證）
├── checkin/
│   └── index.html      值機櫃台：RSVP 表單（送到 /api/rsvp）
├── taiwan/
│   └── index.html      台灣賓客須知：台胞證、航班、張家界 B 團、注意事項
├── travel/
│   └── index.html      延伸旅遊每日行程
├── photos/             婚紗照
├── scripts/
│   └── build-public.sh 組建 Cloudflare 要上傳的公開頁（含白名單檢查）
├── wrangler.jsonc      Cloudflare Worker `hswedding` 設定
├── robots.txt          不希望被搜尋引擎收錄
├── .nojekyll           關閉 GitHub Pages 的 Jekyll 處理
└── README.md
```

**本版本庫只放「給賓客看」的公開頁面。**
家庭內部文件與內部頁面**不要**放進來——這是公開版本庫，任何人都看得到。

那些檔案留在本機工作目錄（`docs/`、`site/`、`CLAUDE.md`），已列入 `.gitignore`，
不會被誤推上來。要看內部頁就本機起一個 server：

```bash
python3 -m http.server 8000   # → http://localhost:8000/site/family/
```

## 部署

| 平台 | 網址 | 更新方式 |
| --- | --- | --- |
| GitHub Pages | <https://sqsqsqlll.github.io/hswedding/> | 推上 `main` 約 1 分鐘自動上線（來源：`main` 分支根目錄） |
| Cloudflare Worker `hswedding` | <https://hswedding.beyondtravelworld.com/> | 推上 `main` 後由 Cloudflare Workers Builds 自動部署（約 1 分鐘） |

兩邊賓客頁內容一樣。

### Cloudflare 網域上的三個 Worker

| Worker | 負責路徑 | 部署方式 |
| --- | --- | --- |
| `hswedding` | 自訂網域（其餘所有路徑） | Workers Builds 連 `main`：建置 `bash scripts/build-public.sh`，部署 `npx wrangler@4 deploy`（設定見根目錄 `wrangler.jsonc`） |
| `hswedding-private` | `/family*`、`/us-2027-hs*` 路由 | 本機 `docs/deploy-private.sh`（內容來自本機 `site/`，不進 repo） |
| `hs-rsvp` | `/api/rsvp*` 路由 | Cloudflare 後台編輯 |

路由優先於自訂網域，所以三者可以共用同一個網域。

- 新增公開檔案（例如換照片）時，要同步改 `scripts/build-public.sh` 裡的白名單，否則自動部署會失敗。
- **不要**把 `site/` 的內部頁搬進 `hswedding`：這個 Worker 由公開 repo 自動部署。
- 出問題時到 Cloudflare 後台 `hswedding` → Deployments 點上一版 Rollback。同時掛兩個不是多餘的：`github.io` 在大陸常常連不上，
廣州親友走 Cloudflare 那個網域比較穩，而 RSVP 的端點本來就指著它。

兩個頁面之間一律使用**相對路徑**（主頁 → `taiwan/`；台灣頁 → `../`），
（主頁 → `checkin/`、`travel/`、`taiwan/`；子頁 → `../checkin/`）
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

端點寫在 `checkin/index.html` 的 `RSVP_ENDPOINT` 常數：

```js
const RSVP_ENDPOINT = "https://hswedding.beyondtravelworld.com/api/rsvp";
```

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

- [ ] 場地與時間定案後，更新主頁登機證的「登機」「登機口」兩格（目前是「晚宴 · 待定」「廣州 · 確認中」）
- [ ] 四時照片目前重複用三張婚紗照，之後換成春（櫻花／賽道）、夏、秋（熊野古道）、冬（雪地）各自的照片，並同步改 `scripts/build-public.sh` 白名單
