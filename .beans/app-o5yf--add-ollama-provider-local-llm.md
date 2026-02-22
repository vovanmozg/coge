---
# app-o5yf
title: Add Ollama provider (local LLM)
status: completed
type: feature
priority: high
tags:
    - feature
    - provider
created_at: 2026-02-21T21:14:17Z
updated_at: 2026-02-21T21:44:57Z
---

## Context
Support local LLM inference via Ollama. This enables offline usage and privacy-sensitive workflows without sending data to external APIs.

## Scope
1. Create `providers/ollama.js`:
   - Call local Ollama API (`http://localhost:11434/api/chat` or `/api/generate`)
   - No API key required
   - Support optional `COGE_OLLAMA_BASE_URL` env var to override default URL
   - Use native `fetch` (same pattern as openrouter.js)

2. Register in `providers/index.js`:
   - Add to provider factory
   - No env key requirement (or optional base URL)

3. Add to `defaultConfig.models` in `lib/config.js`:
   - Default model: `llama3.2` (or another commonly available model)

4. Add `ollama` to `PROVIDERS` list in `coge.js` for `--configure` interactive flow.

## Key Files
- `providers/ollama.js` (new)
- `providers/index.js`
- `lib/config.js`
- `coge.js`

## Notes
- Details: https://github.com/cheahjs/free-llm-api-resources?tab=readme-ov-file

## Acceptance Criteria
- `coge` works with Ollama when configured as provider
- `--configure` lists ollama as an option
- Works without API key
- Graceful error when Ollama is not running

## Summary of Changes
- Created `providers/ollama.js` using shared helper with `requiresKey: false`
- Supports optional `COGE_OLLAMA_BASE_URL` env var (defaults to `http://localhost:11434`)
- Registered in `providers/index.js` with `null` env key entry
- Added default model `llama3.2` in `lib/config.js`
- Added `ollama` to PROVIDERS list in `coge.js`
- Added unit tests in `test/ollama.test.js`
