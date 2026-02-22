---
# app-tbak
title: Add 'pull models' command
status: completed
type: task
priority: normal
created_at: 2026-02-22T10:33:05Z
updated_at: 2026-02-22T11:30:05Z
parent: app-x03k
blocked_by:
    - app-p1hm
---

## Description

Add `coge pull models <provider>` CLI command that fetches the provider's models documentation page and uses the current LLM to extract available model IDs, then saves them to config.

## Flow

1. Accept provider name: `coge pull models cerebras`
2. Look up `modelsPageUrl` from provider definition
3. Fetch the page content
4. Send content to current default model with prompt to extract model IDs as JSON array
5. Update `config.providers.<name>.available` with extracted list
6. Keep the rest of config unchanged

## Acceptance criteria

- [x] Each provider exports optional `modelsPageUrl`
- [x] CLI parses `pull models <provider>` command
- [x] Fetches page and extracts model list via LLM
- [x] Updates config `providers.<name>.available` on success
- [x] On fetch/extraction failure: keeps existing model list, prints error

## Summary of Changes

- Added `modelsPageUrl` to all 14 provider `models` exports
- Added `runPullModels()` function in `coge.js`: fetches models page, strips HTML, sends to LLM for extraction, updates config
- Added `pull models <provider>` CLI branch with proper error handling for missing provider, unknown provider, fetch failure, and LLM extraction failure

## Updated approach\n\nReworked from modelsApiUrl to per-provider fetchModels() functions. Each provider handles its own auth and response parsing. Shared fetchOpenAIModelIds() helper for OpenAI-compatible providers.
