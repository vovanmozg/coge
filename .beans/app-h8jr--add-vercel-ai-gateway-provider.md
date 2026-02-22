---
# app-h8jr
title: Add Vercel AI Gateway provider
status: completed
type: feature
priority: low
tags:
    - feature
    - provider
created_at: 2026-02-21T21:32:37Z
updated_at: 2026-02-21T21:45:18Z
---

## Context
Add support for Vercel AI Gateway — an aggregation service that routes to multiple LLM providers through a unified API.

## Scope
1. Create `providers/vercel-ai.js`:
   - Endpoint: Vercel AI SDK gateway (OpenAI-compatible)
   - API key from env `COGE_VERCEL_API_KEY`
   - Use native `fetch` (same pattern as openrouter.js)

2. Register in `providers/index.js`:
   - Add to provider factory
   - Add `COGE_VERCEL_API_KEY` to `PROVIDER_ENV_KEYS`

3. Add to `defaultConfig.models` in `lib/config.js`:
   - Default model: TBD (depends on available routes)

4. Add `vercel-ai` to `PROVIDERS` list in `coge.js` for `--configure`.

## Notes
- Aggregation service across multiple providers
- Free tier: $5/month
- Details: https://github.com/cheahjs/free-llm-api-resources?tab=readme-ov-file

## Key Files
- `providers/vercel-ai.js` (new)
- `providers/index.js`
- `lib/config.js`
- `coge.js`

## Acceptance Criteria
- `coge` works with Vercel AI Gateway when configured and API key set
- `--configure` lists vercel-ai as an option
- Throws clear error when API key is missing
- Error handling for API failures

## Summary of Changes
- Created `providers/vercel-ai.js` using `makeOpenAICompatible` helper
- Endpoint: `https://api.vercel.ai/v1/chat/completions`
- Registered with `COGE_VERCEL_API_KEY`
- Default model: `gpt-4o-mini`
- Tests in `test/simple-providers.test.js`
