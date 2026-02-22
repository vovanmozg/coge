---
# app-xdys
title: Add Cerebras provider
status: completed
type: feature
priority: normal
tags:
    - feature
    - provider
created_at: 2026-02-21T21:32:40Z
updated_at: 2026-02-21T21:44:59Z
---

## Context
Add support for Cerebras Cloud API. Known for extremely fast inference on select models.

## Scope
1. Create `providers/cerebras.js`:
   - Endpoint: `https://api.cerebras.ai/v1/chat/completions` (OpenAI-compatible)
   - API key from env `COGE_CEREBRAS_API_KEY`
   - Use native `fetch` (same pattern as openrouter.js)

2. Register in `providers/index.js`:
   - Add to provider factory
   - Add `COGE_CEREBRAS_API_KEY` to `PROVIDER_ENV_KEYS`

3. Add to `defaultConfig.models` in `lib/config.js`:
   - Default model: `llama-3.3-70b` or similar

4. Add `cerebras` to `PROVIDERS` list in `coge.js` for `--configure`.

## Notes
- Rate limits: 30 req/min, 1M tokens/day
- Models: GPT-OSS-120B, Qwen 3, Llama 3.3 70B, Llama 3.1 8B
- Details: https://github.com/cheahjs/free-llm-api-resources?tab=readme-ov-file

## Key Files
- `providers/cerebras.js` (new)
- `providers/index.js`
- `lib/config.js`
- `coge.js`

## Acceptance Criteria
- `coge` works with Cerebras when configured and API key set
- `--configure` lists cerebras as an option
- Throws clear error when API key is missing
- Error handling for API failures

## Summary of Changes
- Created `providers/cerebras.js` using `makeOpenAICompatible` helper
- Endpoint: `https://api.cerebras.ai/v1/chat/completions`
- Registered in `providers/index.js` with `COGE_CEREBRAS_API_KEY`
- Default model: `llama-3.3-70b`
- Tests in `test/simple-providers.test.js`
