#!/usr/bin/env bash
# Rebuild OE Flex SAMPLE demo. If preview+tunnel already running, same Cloudflare URL
# keeps serving the new dist after rebuild (hard-refresh browser). Tunnel restart = new URL.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
npm run build
if ! curl -sf -o /dev/null http://127.0.0.1:4173/; then
  pkill -f 'vite preview' 2>/dev/null || true
  nohup npm run preview -- --host 127.0.0.1 --port 4173 > /tmp/oe-flex-preview.log 2>&1 &
  sleep 2
fi
if ! pgrep -f 'cloudflared tunnel --url' >/dev/null; then
  nohup cloudflared tunnel --url http://127.0.0.1:4173 --no-autoupdate > /tmp/oe-flex-tunnel.log 2>&1 &
  sleep 8
fi
echo "Demo URL:"
rg -o 'https://[a-zA-Z0-9.-]+\.trycloudflare\.com' /tmp/oe-flex-tunnel.log | tail -1
