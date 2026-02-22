#!/bin/bash
set -e

if [ -f /app/package.json ]; then
  if [ ! -d /app/node_modules/.package-lock.json ] && [ -z "$(ls -A /app/node_modules 2>/dev/null)" ]; then
    echo "Installing dependencies..."
    corepack enable 2>/dev/null
    if [ -f /app/pnpm-lock.yaml ]; then
      pnpm install
    elif [ -f /app/yarn.lock ]; then
      yarn install
    else
      npm install
    fi
  fi
fi

exec "$@"
