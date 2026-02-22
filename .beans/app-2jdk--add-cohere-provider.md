---
# app-2jdk
title: Add Cohere provider
status: completed
type: feature
priority: normal
tags:
    - feature
    - provider
created_at: 2026-02-21T21:32:52Z
updated_at: 2026-02-21T21:45:04Z
---

## Context
Add support for Cohere API. Free tier with Command A, Aya, and Jamba models.

## Scope
1. Create `providers/cohere.js`:
   - Endpoint: `https://api.cohere.com/v2/chat` (Cohere native API)
   - API key from env `COGE_COHERE_API_KEY`
   - Use native `fetch` (same pattern as openrouter.js)
   - Note: Cohere API differs from OpenAI format — needs response mapping

2. Register in `providers/index.js`:
   - Add to provider factory
   - Add `COGE_COHERE_API_KEY` to `PROVIDER_ENV_KEYS`

3. Add to `defaultConfig.models` in `lib/config.js`:
   - Default model: `command-a-03-2025` or similar

4. Add `cohere` to `PROVIDERS` list in `coge.js` for `--configure`.

## Notes
- Rate limits: 20 req/min, 1000 req/month (shared across models)
- API format differs from OpenAI — needs adapter layer
- Details: https://github.com/cheahjs/free-llm-api-resources?tab=readme-ov-file

## Key Files
- `providers/cohere.js` (new)
- `providers/index.js`
- `lib/config.js`
- `coge.js`

## Acceptance Criteria
- `coge` works with Cohere when configured and API key set
- `--configure` lists cohere as an option
- Throws clear error when API key is missing
- Error handling for API failures

## Summary of Changes
- Created `providers/cohere.js` with native Cohere v2 API format
- Response parsing: `message.content[0].text` with OpenAI-style fallback
- Registered in `providers/index.js` with `COGE_COHERE_API_KEY`
- Default model: `command-a-03-2025`
- Tests in `test/cohere.test.js` including both response formats
