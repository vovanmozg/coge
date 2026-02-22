---
# app-6woz
title: Add Groq provider
status: completed
type: feature
priority: normal
tags:
    - feature
    - provider
created_at: 2026-02-21T21:32:50Z
updated_at: 2026-02-21T21:45:10Z
---

## Context
Add support for Groq API. Offers fast inference with 18+ models including Llama, Qwen, and Whisper.

## Scope
1. Create `providers/groq.js`:
   - Endpoint: `https://api.groq.com/openai/v1/chat/completions` (OpenAI-compatible)
   - API key from env `COGE_GROQ_API_KEY`
   - Use native `fetch` (same pattern as openrouter.js)

2. Register in `providers/index.js`:
   - Add to provider factory
   - Add `COGE_GROQ_API_KEY` to `PROVIDER_ENV_KEYS`

3. Add to `defaultConfig.models` in `lib/config.js`:
   - Default model: `llama-3.3-70b-versatile` or similar

4. Add `groq` to `PROVIDERS` list in `coge.js` for `--configure`.

## Notes
- Rate limits: 1K-14.4K req/day, 6K-30K tokens/min (varies per model)
- 18+ models available
- Details: https://github.com/cheahjs/free-llm-api-resources?tab=readme-ov-file

## Key Files
- `providers/groq.js` (new)
- `providers/index.js`
- `lib/config.js`
- `coge.js`

## Acceptance Criteria
- `coge` works with Groq when configured and API key set
- `--configure` lists groq as an option
- Throws clear error when API key is missing
- Error handling for API failures

## Summary of Changes
- Created `providers/groq.js` using `makeOpenAICompatible` helper
- Endpoint: `https://api.groq.com/openai/v1/chat/completions`
- Registered with `COGE_GROQ_API_KEY`
- Default model: `llama-3.3-70b-versatile`
- Tests in `test/simple-providers.test.js`
