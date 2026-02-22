---
# app-t1mb
title: Add Cloudflare Workers AI provider
status: completed
type: feature
priority: normal
tags:
    - feature
    - provider
created_at: 2026-02-21T21:32:53Z
updated_at: 2026-02-21T21:45:01Z
---

## Context
Add support for Cloudflare Workers AI. Provides access to 50+ open models with free daily allocation.

## Scope
1. Create `providers/cloudflare.js`:
   - Endpoint: `https://api.cloudflare.com/client/v4/accounts/{account_id}/ai/v1/chat/completions` (OpenAI-compatible)
   - API key from env `COGE_CLOUDFLARE_API_KEY`
   - Account ID from env `COGE_CLOUDFLARE_ACCOUNT_ID`
   - Use native `fetch` (same pattern as openrouter.js)

2. Register in `providers/index.js`:
   - Add to provider factory
   - Add `COGE_CLOUDFLARE_API_KEY` and `COGE_CLOUDFLARE_ACCOUNT_ID` to `PROVIDER_ENV_KEYS`

3. Add to `defaultConfig.models` in `lib/config.js`:
   - Default model: `@cf/meta/llama-3.3-70b-instruct-fp8-fast` or similar

4. Add `cloudflare` to `PROVIDERS` list in `coge.js` for `--configure`.

## Notes
- Requires both API key and Account ID
- Free tier: 10K neurons/day
- 50+ models available (Llama, Mistral, Gemma, Qwen)
- Details: https://github.com/cheahjs/free-llm-api-resources?tab=readme-ov-file

## Key Files
- `providers/cloudflare.js` (new)
- `providers/index.js`
- `lib/config.js`
- `coge.js`

## Acceptance Criteria
- `coge` works with Cloudflare Workers AI when configured
- `--configure` lists cloudflare as an option
- Throws clear error when API key or account ID is missing
- Error handling for API failures

## Summary of Changes
- Created `providers/cloudflare.js` with custom factory (needs account ID in URL)
- Requires both `COGE_CLOUDFLARE_API_KEY` and `COGE_CLOUDFLARE_ACCOUNT_ID`
- Uses `createOpenAICompatibleProvider` internally
- Registered in `providers/index.js`
- Default model: `@cf/meta/llama-3.3-70b-instruct-fp8-fast`
- Tests in `test/cloudflare.test.js`
