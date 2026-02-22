#!/usr/bin/env bash
set -euo pipefail

# Publish cogeai to npm
# Usage: ./bin/publish.sh [--dry-run]

DRY_RUN=""
if [[ "${1:-}" == "--dry-run" ]]; then
  DRY_RUN="--dry-run"
  echo "==> Dry run mode"
fi

echo "==> Running tests..."
npm test

echo "==> Checking package contents..."
npm pack --dry-run

echo ""
read -rp "Publish cogeai@$(node -p "require('./package.json').version") to npm? [y/N] " confirm
if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
  echo "Aborted."
  exit 0
fi

npm publish $DRY_RUN
echo "==> Done."
