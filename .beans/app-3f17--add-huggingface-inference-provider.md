---
# app-3f17
title: Add HuggingFace Inference provider
status: completed
type: feature
priority: normal
tags:
    - feature
    - provider
created_at: 2026-02-21T21:32:32Z
updated_at: 2026-02-21T21:45:12Z
---

## Context
Add support for HuggingFace Inference API. Provides serverless access to open models under 10GB.

## Scope
1. Create `providers/huggingface.js`:
   - Endpoint: `https://api-inference.huggingface.co/models/{model}/v1/chat/completions` (OpenAI-compatible)
   - API key from env `COGE_HUGGINGFACE_API_KEY`
   - Use native `fetch` (same pattern as openrouter.js)

2. Register in `providers/index.js`:
   - Add to provider factory
   - Add `COGE_HUGGINGFACE_API_KEY` to `PROVIDER_ENV_KEYS`

3. Add to `defaultConfig.models` in `lib/config.js`:
   - Default model: `meta-llama/Llama-3.1-8B-Instruct` or similar

4. Add `huggingface` to `PROVIDERS` list in `coge.js` for `--configure`.

## Notes
- Free tier: $0.10/month in credits
- Only models under 10GB available on serverless
- Model ID format includes org/name
- Details: https://github.com/cheahjs/free-llm-api-resources?tab=readme-ov-file

## Key Files
- `providers/huggingface.js` (new)
- `providers/index.js`
- `lib/config.js`
- `coge.js`

## Acceptance Criteria
- `coge` works with HuggingFace when configured and API key set
- `--configure` lists huggingface as an option
- Throws clear error when API key is missing
- Error handling for API failures

## Summary of Changes
- Created `providers/huggingface.js` with custom factory (model name in URL path)
- URL pattern: `https://api-inference.huggingface.co/models/{model}/v1/chat/completions`
- Registered with `COGE_HUGGINGFACE_API_KEY`
- Default model: `meta-llama/Llama-3.1-8B-Instruct`
- Tests in `test/huggingface.test.js` verifying model in URL
