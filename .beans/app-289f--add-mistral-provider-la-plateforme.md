---
# app-289f
title: Add Mistral provider (La Plateforme)
status: completed
type: feature
priority: normal
tags:
    - feature
    - provider
created_at: 2026-02-21T21:32:08Z
updated_at: 2026-02-21T21:45:15Z
---

## Context
Add support for Mistral AI API (La Plateforme). Free tier with generous token limits (1B tokens/month).

## Scope
1. Create `providers/mistral.js`:
   - Endpoint: `https://api.mistral.ai/v1/chat/completions` (OpenAI-compatible)
   - API key from env `COGE_MISTRAL_API_KEY`
   - Use native `fetch` (same pattern as openrouter.js)

2. Register in `providers/index.js`:
   - Add to provider factory
   - Add `COGE_MISTRAL_API_KEY` to `PROVIDER_ENV_KEYS`

3. Add to `defaultConfig.models` in `lib/config.js`:
   - Default model: `mistral-small-latest` or similar

4. Add `mistral` to `PROVIDERS` list in `coge.js` for `--configure`.

## Notes
- Free tier requires data training opt-in
- Phone verification required
- Rate limits: 1 req/sec, 500K tokens/min, 1B tokens/month
- Details: https://github.com/cheahjs/free-llm-api-resources?tab=readme-ov-file

## Key Files
- `providers/mistral.js` (new)
- `providers/index.js`
- `lib/config.js`
- `coge.js`

## Acceptance Criteria
- `coge` works with Mistral when configured and API key set
- `--configure` lists mistral as an option
- Throws clear error when API key is missing
- Error handling for API failures

## Summary of Changes
- Created `providers/mistral.js` using `makeOpenAICompatible` helper
- Endpoint: `https://api.mistral.ai/v1/chat/completions`
- Registered with `COGE_MISTRAL_API_KEY`
- Default model: `mistral-small-latest`
- Tests in `test/simple-providers.test.js`
