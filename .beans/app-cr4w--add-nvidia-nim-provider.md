---
# app-cr4w
title: Add NVIDIA NIM provider
status: completed
type: feature
priority: normal
tags:
    - feature
    - provider
created_at: 2026-02-21T21:31:56Z
updated_at: 2026-02-21T21:45:17Z
---

## Context
Add support for NVIDIA NIM API. Provides access to various open-source models with fast inference.

## Scope
1. Create `providers/nvidia-nim.js`:
   - Endpoint: `https://integrate.api.nvidia.com/v1/chat/completions` (OpenAI-compatible)
   - API key from env `COGE_NVIDIA_NIM_API_KEY`
   - Use native `fetch` (same pattern as openrouter.js)

2. Register in `providers/index.js`:
   - Add to provider factory
   - Add `COGE_NVIDIA_NIM_API_KEY` to `PROVIDER_ENV_KEYS`

3. Add to `defaultConfig.models` in `lib/config.js`:
   - Default model: `meta/llama-3.3-70b-instruct` or similar

4. Add `nvidia-nim` to `PROVIDERS` list in `coge.js` for `--configure`.

## Notes
- Phone verification required for API key
- Rate limit: 40 req/min
- Context window may be limited compared to other providers
- Details: https://github.com/cheahjs/free-llm-api-resources?tab=readme-ov-file

## Key Files
- `providers/nvidia-nim.js` (new)
- `providers/index.js`
- `lib/config.js`
- `coge.js`

## Acceptance Criteria
- `coge` works with NVIDIA NIM when configured and API key set
- `--configure` lists nvidia-nim as an option
- Throws clear error when API key is missing
- Error handling for API failures

## Summary of Changes
- Created `providers/nvidia-nim.js` using `makeOpenAICompatible` helper
- Endpoint: `https://integrate.api.nvidia.com/v1/chat/completions`
- Registered with `COGE_NVIDIA_NIM_API_KEY`
- Default model: `meta/llama-3.3-70b-instruct`
- Tests in `test/simple-providers.test.js`
