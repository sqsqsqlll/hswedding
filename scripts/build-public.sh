#!/usr/bin/env bash
# 組建 Cloudflare Worker 要上傳的公開賓客頁
# Cloudflare Workers Builds 的建置指令會跑這支；本機也可以跑來檢查。
#
# portra 分支：首頁 index.html 是 Portra 北歐極簡版，GitHub Pages 上的網址是 /portra/。
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

BUILD="$ROOT/.deploy-build"

# ── 1. 組建：只放白名單內的東西 ───────────────────────────────
rm -rf "$BUILD"
mkdir -p "$BUILD"
cp index.html robots.txt share.jpg "$BUILD/"
cp -R checkin photos taiwan travel "$BUILD/"

# ── 2. 安全檢查：組建結果只能有這幾個檔案 ────────────────────
# 新增或換照片時，記得同步改這份清單。
EXPECTED=$'checkin/index.html\nindex.html\nphotos/alley.jpg\nphotos/cai-desert-silhouette.jpg\nphotos/cai-gem-sunset.jpg\nphotos/cai-pyramids.jpg\nphotos/cai-white-desert-couple.jpg\nphotos/campus.jpg\nphotos/can-canton-night.jpg\nphotos/can-canton-wheel.jpg\nphotos/can-laugh.jpg\nphotos/can-tower-window.jpg\nphotos/court.jpg\nphotos/gate.jpg\nphotos/hero.jpg\nphotos/shutter.jpg\nphotos/stairs.jpg\nphotos/street.jpg\nphotos/tyo-fuji.jpg\nphotos/tyo-jingumae.jpg\nphotos/tyo-meiji.jpg\nphotos/tyo-nikko.jpg\nrobots.txt\nshare.jpg\ntaiwan/index.html\ntravel/index.html'
find "$BUILD" -name '.DS_Store' -delete
ACTUAL="$(cd "$BUILD" && find . -type f | sed 's|^\./||' | LC_ALL=C sort)"
if [ "$ACTUAL" != "$EXPECTED" ]; then
  echo "✗ 組建內容與白名單不符，中止部署。實際內容："
  echo "$ACTUAL"
  exit 1
fi
echo "✓ 組建內容："
echo "$ACTUAL" | sed 's/^/    /'
