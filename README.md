# Harry & Sincer · 婚禮網站

2027.05.15（週六・晚宴）廣州婚宴邀請頁，**場地確認中**。目前這版的目的是先收出席意願與人數，場地定案後再發正式喜帖。

> **這是 `red` 分支：赤金登機版。** 現行版（三語、首頁內含 RSVP）在 [`main` 分支](https://github.com/sqsqsqlll/hswedding/tree/main)，兩邊分開維護。

- 首頁 `index.html`：視覺來自 Claude Design 畫布「婚宴主視覺方案」的「邀請網頁 · 赤金登機」，繁中＋英文並排。
- `checkin/`：值機櫃台 RSVP 表單（畫布「值機表單 · 送祝福」），台灣賓客頁與行程頁的 RSVP 連結都指向它。

線上網址：<https://hsweddingred.beyondtravelworld.com/>（Cloudflare Worker `hsweddingred`，待建立）

---

## 目錄結構

```
.
├── index.html          赤金登機首頁：主視覺、航線圖、四時照片、登機證
├── checkin/
│   └── index.html      值機櫃台：RSVP 表單（送到 /api/rsvp）
├── taiwan/
│   └── index.html      台灣賓客須知：台胞證、航班、張家界 B 團、注意事項
├── travel/
│   └── index.html      延伸旅遊每日行程
├── photos/             婚紗照
├── scripts/
│   └── build-public.sh 組建 Cloudflare 要上傳的公開頁（含白名單檢查）
├── wrangler.jsonc      Cloudflare Worker `hsweddingred` 設定
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
| Cloudflare Worker `hsweddingred` | <https://hsweddingred.beyondtravelworld.com/> | 推上 `red` 後由 Cloudflare Workers Builds 自動部署（約 1 分鐘） |

GitHub Pages 每個 repo 只能發布一個分支，目前發布的是 `main`（現行版），所以這個分支不在 GitHub Pages 上。

### 建立 `hsweddingred` Worker（只需做一次）

Cloudflare 後台 → Workers & Pages → Create → Import a repository → `sqsqsqlll/hswedding`：

| 項目 | 填寫 |
| --- | --- |
| Project name | `hsweddingred`（必須與 `wrangler.jsonc` 的 `name` 一致） |
| Branch | `red` |
| Build command | `bash scripts/build-public.sh` |
| Deploy command | `npx wrangler@4 deploy` |
| Root directory | `/` |

`wrangler.jsonc` 已寫好自訂網域，第一次部署時會自動建立子網域的 DNS 與憑證。

- 這個分支的 `wrangler.jsonc` 只指向 `hsweddingred`，**不會**動到現行版的 `hswedding`。
- RSVP 送到 `hswedding.beyondtravelworld.com/api/rsvp`（`hs-rsvp` Worker，已允許跨網域），與現行版共用同一張試算表。
- 新增公開檔案（例如換照片）時，要同步改 `scripts/build-public.sh` 裡的白名單，否則自動部署會失敗。
- 出問題時到 Cloudflare 後台 `hsweddingred` → Deployments 點上一版 Rollback。

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
