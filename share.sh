#!/bin/sh
# Starts the demo and gives you a public https link (Cloudflare quick tunnel, no account needed).
# The link works as long as this script keeps running on this Mac.
cd "$(dirname "$0")"
[ -f .env ] || { echo "Create .env first: cp .env.example .env, then add APP_KEY."; exit 1; }
node server.js &
SERVER=$!
trap 'kill $SERVER 2>/dev/null' EXIT INT TERM
sleep 1
cloudflared tunnel --protocol http2 --url "http://localhost:${PORT:-8787}" 2>&1 | grep --line-buffered -E "https://[a-z0-9-]+\.trycloudflare\.com|ERR"
