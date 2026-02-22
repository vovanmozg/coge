---
# app-e0tj
title: Add OpenAI provider
status: completed
type: feature
priority: high
tags:
    - feature
    - provider
created_at: 2026-02-21T21:14:18Z
updated_at: 2026-02-21T21:44:55Z
---

## Context
Add support for OpenAI API (GPT models) as a provider. This is one of the most popular LLM APIs and many users will expect it.

## Scope
1. Create `providers/openai.js`:
   - Use OpenAI-compatible API (standard chat completions endpoint)
   - Model from config, API key from env `COGE_OPENAI_API_KEY`
   - Use native `fetch` (same pattern as openrouter.js)
   - Endpoint: `https://api.openai.com/v1/chat/completions`

2. Register in `providers/index.js`:
   - Add to provider factory
   - Add `COGE_OPENAI_API_KEY` to `PROVIDER_ENV_KEYS`

3. Add to `defaultConfig.models` in `lib/config.js`:
   - Default model: `gpt-4o-mini` or similar

4. Add `openai` to `PROVIDERS` list in `coge.js` for `--configure`.

## Key Files
- `providers/openai.js` (new)
- `providers/index.js`
- `lib/config.js`
- `coge.js`

## Notes
- Details: https://github.com/cheahjs/free-llm-api-resources?tab=readme-ov-file

## Acceptance Criteria
- `coge` works with OpenAI when configured and API key set
- `--configure` lists openai as an option
- Throws clear error when API key is missing
- Error handling for API failures

## Summary of Changes
- Created `providers/openai.js` using shared `makeOpenAICompatible` helper
- Registered in `providers/index.js` with factory and `COGE_OPENAI_API_KEY` env key
- Added default model `gpt-4o-mini` in `lib/config.js`
- Added `openai` to PROVIDERS list in `coge.js`
- Added unit tests in `test/openai.test.js`
