---
# app-dtfa
title: 'Fix: coge --pull models codestral — wrong API endpoint (404)'
status: completed
type: bug
priority: normal
created_at: 2026-02-22T17:17:31Z
updated_at: 2026-02-22T17:18:34Z
---

## Bug

Running `coge --pull models codestral` fails with:

```
Fetching models for codestral...
Failed to fetch models: HTTP 404: {
  "message":"no Route matched with those values",
  "request_id":"8f1d09101f75287b56e5f65a84a5d512"
}
```

## Context

Codestral uses a separate base URL from the main Mistral API:

- **Completion**: `https://codestral.mistral.ai/v1/fim/completions`
- **Chat**: `https://codestral.mistral.ai/v1/chat/completions`

The model listing likely hits the wrong host or path (e.g. `api.mistral.ai` instead of `codestral.mistral.ai`).

API key env var: `COGE_CODESTRAL_API_KEY`

## Implementation Notes

- Find the correct endpoint for listing Codestral models (likely `https://codestral.mistral.ai/v1/models`)
- Ensure the Codestral provider uses `codestral.mistral.ai` as base URL for all API calls
- Check Codestral/Mistral docs for the models list endpoint

## TODO

- [ ] Identify the correct base URL and models endpoint for Codestral
- [ ] Fix the provider to use the correct endpoint
- [ ] Test `coge --pull models codestral`

## Summary of Changes

Fixed fetchModels() to use api.mistral.ai/v1/models (which supports model listing) instead of codestral.mistral.ai/v1/models (which returns 404). Results are filtered to codestral models only.
