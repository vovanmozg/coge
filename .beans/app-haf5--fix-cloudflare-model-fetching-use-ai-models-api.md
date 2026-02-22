---
# app-haf5
title: 'Fix cloudflare model fetching: use AI models API'
status: completed
type: bug
priority: normal
created_at: 2026-02-22T14:57:18Z
updated_at: 2026-02-22T15:00:55Z
---

## Problem

`coge --pull models cloudflare` fails because there's no `fetchModels()` for cloudflare. It falls back to page scraping of https://developers.cloudflare.com/workers-ai/models/ which fails with JSON parse error:

```
Failed to extract model list: Unterminated string in JSON at position 533
```

## Solution

Cloudflare has a proper API for listing AI models:

```
GET https://api.cloudflare.com/client/v4/accounts/{account_id}/ai/models/search
Authorization: Bearer {api_key}
```

This requires `COGE_CLOUDFLARE_ACCOUNT_ID` and `COGE_CLOUDFLARE_API_KEY` (both already used by the provider).

## Plan
- [ ] Add `fetchModels()` to `providers/cloudflare.js` using the models search API
- [ ] Register it in `PROVIDER_FETCH_MODELS` in `providers/index.js`
- [ ] Filter results to text-generation / chat models only
- [ ] Classify models with `classifyModel()`
- [ ] Test with `coge --pull models cloudflare`

## API reference
https://developers.cloudflare.com/api/resources/ai/subresources/models/methods/list/

## Summary of Changes

- Added fetchModels() to cloudflare.js using the /ai/models/search API with task=Text Generation filter
- Registered cloudflare in PROVIDER_FETCH_MODELS
- Updated cerebras default from llama-3.3-70b (no longer available) to qwen-3-235b-a22b-instruct-2507
- Removed llama-3.3-70b from topModels (no provider uses it anymore)
