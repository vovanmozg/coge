---
# app-axb5
title: Add GitHub Models provider
status: completed
type: feature
priority: normal
tags:
    - feature
    - provider
created_at: 2026-02-21T21:32:52Z
updated_at: 2026-02-21T21:45:05Z
---

## Context
Add support for GitHub Models API. Provides access to 30+ models from OpenAI, DeepSeek, Meta, Cohere, Mistral through GitHub.

## Scope
1. Create `providers/github-models.js`:
   - Endpoint: `https://models.inference.ai.azure.com/chat/completions` (OpenAI-compatible)
   - API key from env `COGE_GITHUB_MODELS_TOKEN` (GitHub PAT)
   - Use native `fetch` (same pattern as openrouter.js)

2. Register in `providers/index.js`:
   - Add to provider factory
   - Add `COGE_GITHUB_MODELS_TOKEN` to `PROVIDER_ENV_KEYS`

3. Add to `defaultConfig.models` in `lib/config.js`:
   - Default model: `Meta-Llama-3.1-70B-Instruct` or similar

4. Add `github-models` to `PROVIDERS` list in `coge.js` for `--configure`.

## Notes
- Requires GitHub PAT (Personal Access Token)
- Limits depend on Copilot subscription tier
- Restricted input/output token limits
- Details: https://github.com/cheahjs/free-llm-api-resources?tab=readme-ov-file

## Key Files
- `providers/github-models.js` (new)
- `providers/index.js`
- `lib/config.js`
- `coge.js`

## Acceptance Criteria
- `coge` works with GitHub Models when configured and token set
- `--configure` lists github-models as an option
- Throws clear error when token is missing
- Error handling for API failures

## Summary of Changes
- Created `providers/github-models.js` using `makeOpenAICompatible` helper
- Endpoint: `https://models.inference.ai.azure.com/chat/completions`
- Registered with `COGE_GITHUB_MODELS_TOKEN`
- Default model: `Meta-Llama-3.1-70B-Instruct`
- Tests in `test/simple-providers.test.js`
