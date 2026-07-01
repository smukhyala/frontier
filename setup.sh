#!/usr/bin/env bash
set -euo pipefail

# ──────────────────────────────────────────────
# Frontier — Quick Setup
# ──────────────────────────────────────────────

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo ""
echo "  Frontier Setup"
echo "  ─────────────────────────────"
echo ""

# 1. Check Node.js
if ! command -v node &> /dev/null; then
  echo -e "${RED}Node.js is not installed.${NC}"
  echo "Install Node.js 20+ from https://nodejs.org or use nvm:"
  echo "  nvm install 20 && nvm use 20"
  exit 1
fi

NODE_VERSION=$(node -v | sed 's/v//' | cut -d. -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
  echo -e "${RED}Node.js v20+ is required (found v$(node -v)).${NC}"
  echo "Upgrade with: nvm install 20 && nvm use 20"
  exit 1
fi
echo -e "${GREEN}Node.js $(node -v)${NC}"

# 2. Install dependencies
echo ""
echo "Installing dependencies..."
npm install
echo -e "${GREEN}Dependencies installed.${NC}"

# 3. Set up .env.local
echo ""
if [ -f .env.local ]; then
  echo -e "${YELLOW}.env.local already exists — skipping.${NC}"
  echo "  To reset, delete it and re-run this script."
else
  cp .env.example .env.local
  echo -e "${GREEN}Created .env.local from .env.example.${NC}"
  echo ""
  echo -e "${YELLOW}You need to fill in these values in .env.local:${NC}"
  echo "  AUTH_SECRET          — run: npx auth secret"
  echo "  AUTH_GITHUB_ID       — from your GitHub OAuth App"
  echo "  AUTH_GITHUB_SECRET   — from your GitHub OAuth App"
  echo "  OPENAI_API_KEY       — from https://platform.openai.com/api-keys"
  echo ""
  echo "See README.md for how to create a GitHub OAuth App."
fi

# 4. Done
echo ""
echo "─────────────────────────────────"
echo -e "${GREEN}Setup complete.${NC} Run the dev server with:"
echo ""
echo "  npm run dev"
echo ""
echo "Then open http://localhost:3000"
echo ""
