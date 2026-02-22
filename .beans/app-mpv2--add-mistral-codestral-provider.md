---
# app-mpv2
title: Add Mistral Codestral provider
status: completed
type: feature
priority: normal
tags:
    - feature
    - provider
created_at: 2026-02-21T21:32:23Z
updated_at: 2026-02-21T21:45:13Z
---

## Context
Add support for Mistral Codestral — a code-specialized model with a dedicated free endpoint.

## Scope
1. Create `providers/codestral.js`:
   - Endpoint: `https://codestral.mistral.ai/v1/chat/completions` (OpenAI-compatible)
   - API key from env `COGE_CODESTRAL_API_KEY`
   - Use native `fetch` (same pattern as openrouter.js)

2. Register in `providers/index.js`:
   - Add to provider factory
   - Add `COGE_CODESTRAL_API_KEY` to `PROVIDER_ENV_KEYS`

3. Add to `defaultConfig.models` in `lib/config.js`:
   - Default model: `codestral-latest`

4. Add `codestral` to `PROVIDERS` list in `coge.js` for `--configure`.

## Notes
- Separate API key from Mistral La Plateforme
- Phone verification required
- Rate limits: 30 req/min, 2000 req/day
- Currently free but may become subscription-based
- Details: https://github.com/cheahjs/free-llm-api-resources?tab=readme-ov-file

## Key Files
- `providers/codestral.js` (new)
- `providers/index.js`
- `lib/config.js`
- `coge.js`

## Acceptance Criteria
- `coge` works with Codestral when configured and API key set
- `--configure` lists codestral as an option
- Throws clear error when API key is missing
- Error handling for API failures

## Summary of Changes
- Created `providers/codestral.js` using `makeOpenAICompatible` helper
- Endpoint: `https://codestral.mistral.ai/v1/chat/completions`
- Registered with `COGE_CODESTRAL_API_KEY`
- Default model: `codestral-latest`
- Tests in `test/simple-providers.test.js`
