#!/usr/bin/env bash
# 組建 hswedding Worker 要上傳的公開賓客頁到 .deploy-build/
# Cloudflare Workers Builds 的建置指令會跑這支；本機也可以跑來檢查。
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BUILD="$ROOT/.deploy-build"
cd "$ROOT"

# ── 1. 組建：只放白名單內的東西 ───────────────────────────────
rm -rf "$BUILD"
mkdir -p "$BUILD"
cp index.html robots.txt share.jpg "$BUILD/"
cp -R checkin photos taiwan travel "$BUILD/"

# ── 2. 安全檢查：組建結果只能有這幾個檔案 ────────────────────
# 新增或換照片時，記得同步改這份清單。
EXPECTED=$'checkin/index.html\nindex.html\nphotos/alley.jpg\nphotos/campus.jpg\nphotos/court.jpg\nphotos/gate.jpg\nphotos/hero.jpg\nphotos/shutter.jpg\nphotos/stairs.jpg\nphotos/street.jpg\nrobots.txt\nshare.jpg\ntaiwan/index.html\ntravel/index.html'
find "$BUILD" -name '.DS_Store' -delete
ACTUAL="$(cd "$BUILD" && find . -type f | sed 's|^\./||' | LC_ALL=C sort)"
if [ "$ACTUAL" != "$EXPECTED" ]; then
  echo "✗ 組建內容與白名單不符，中止部署。實際內容："
  echo "$ACTUAL"
  exit 1
fi
echo "✓ 組建內容："
echo "$ACTUAL" | sed 's/^/    /'
