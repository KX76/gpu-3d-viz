#!/bin/zsh
set -eu
cd "$(dirname "$0")"
if [[ ! -f dist/index.html ]]; then
  print '缺少离线页面，请先运行 pnpm build。'
  exit 1
fi
# Viewing the built app requires neither Node.js nor a local server.
exec /usr/bin/open "$PWD/dist/index.html"
