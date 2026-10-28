#!/usr/bin/env bash
# 組建 Cloudflare Worker 要上傳的公開賓客頁
# Cloudflare Workers Builds 的建置指令會跑這支；本機也可以跑來檢查。
#
# 用法：bash scripts/build-public.sh       → .deploy-build/（hswedding，現行首頁 index.html）
#       bash scripts/build-public.sh red   → .deploy-red/  （hsweddingred，赤金登機首頁 index-red.html）
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

case "${1:-main}" in
  main) BUILD="$ROOT/.deploy-build"; HOME_PAGE="index.html" ;;
  red)  BUILD="$ROOT/.deploy-red";   HOME_PAGE="index-red.html" ;;
  *)    echo "✗ 未知版本：$1（可用：main、red）"; exit 1 ;;
esac

# ── 1. 組建：只放白名單內的東西 ───────────────────────────────
rm -rf "$BUILD"
mkdir -p "$BUILD"
cp "$HOME_PAGE" "$BUILD/index.html"
cp robots.txt share.jpg "$BUILD/"
cp -R checkin photos taiwan travel "$BUILD/"

# ── 2. 安全檢查：組建結果只能有這幾個檔案 ────────────────────
# 新增或換照片時，記得同步改這份清單。
EXPECTED=$'checkin/index.html\nindex.html\nphotos/01.jpg\nphotos/02.jpg\nphotos/03.jpg\nrobots.txt\nshare.jpg\ntaiwan/index.html\ntravel/index.html'
find "$BUILD" -name '.DS_Store' -delete
ACTUAL="$(cd "$BUILD" && find . -type f | sed 's|^\./||' | LC_ALL=C sort)"
if [ "$ACTUAL" != "$EXPECTED" ]; then
  echo "✗ 組建內容與白名單不符，中止部署。實際內容："
  echo "$ACTUAL"
  exit 1
fi
echo "✓ 組建內容（首頁來自 $HOME_PAGE）："
echo "$ACTUAL" | sed 's/^/    /'
