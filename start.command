#!/bin/bash
# Double-click this file from Finder to start the CS Metrics Dashboard.

cd "$(dirname "$0")"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  CS Metrics Dashboard"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ── First-time setup ─────────────────────────────────────
if [ ! -f .env.local ]; then
  cp .env.local.example .env.local

  echo ""
  echo "  FIRST-TIME SETUP"
  echo ""
  echo "  Your credentials file (.env.local) has been created."
  echo "  TextEdit will open it now."
  echo ""
  echo "  Fill in these three lines with your Talkdesk values:"
  echo "    TALKDESK_ACCOUNT    → your login subdomain (e.g. acme)"
  echo "    TALKDESK_CLIENT_ID  → from Talkdesk Admin → API Clients"
  echo "    TALKDESK_CLIENT_SECRET → same place, shown once on creation"
  echo ""
  echo "  Then change:  USE_MOCK_DATA=true"
  echo "           to:  USE_MOCK_DATA=false"
  echo ""
  echo "  Save the file in TextEdit, then come back here"
  echo "  and press Enter to start the app."
  echo ""

  open -e .env.local

  read -p "  ▶  Press Enter when you've saved your credentials... "
  echo ""
fi

# ── Install dependencies (first run only) ────────────────
if [ ! -d node_modules ]; then
  echo "  Installing dependencies — this takes about a minute and only happens once."
  echo ""
  npm install --silent
fi

# ── Open browser after server warms up ───────────────────
(sleep 4 && open http://localhost:3000) &

echo ""
echo "  Starting the app…"
echo "  Your browser will open automatically at http://localhost:3000"
echo ""
echo "  To stop the server, close this window."
echo ""

npm run dev
