---
# app-tf2i
title: 'Fix: coge --pull models gemini fails with ''trim is not a function'''
status: completed
type: bug
priority: normal
created_at: 2026-02-22T17:11:33Z
updated_at: 2026-02-22T17:16:53Z
---

## Bug

Running `coge --pull models gemini` fails with:

```
Fetching models page: https://ai.google.dev/gemini-api/docs/models/gemini-v2
Failed to extract model list: data.choices?.[0]?.message?.content?.trim is not a function
```

## Analysis

The implementation of model fetching for Gemini is likely incorrect. Possible hypotheses:

1. **Wrong API approach**: The code may be scraping a docs page and using an LLM to extract model names, instead of using a proper API endpoint
2. **Missing API integration**: Gemini likely has a dedicated API to list available models (e.g. `models.list` endpoint) that should be used instead of parsing HTML
3. **Incorrect response parsing**: If an LLM call is involved, the response format doesn't match the expected OpenAI-compatible shape (`data.choices[0].message.content`)

## Implementation Notes

- Find official Gemini API documentation for listing available models
- Use the proper API endpoint instead of scraping/LLM extraction if possible
- Follow the pattern of other providers that correctly implement model listing

## TODO

- [ ] Identify which provider/code path handles the LLM call during `--pull models`
- [ ] Check the response format and fix the content extraction logic
- [ ] Test `coge --pull models gemini` after the fix

## Summary of Changes

Added fetchModels() to gemini.js using the official models.list API endpoint (generativelanguage.googleapis.com/v1beta/models). Filters to models supporting generateContent method. Registered in PROVIDER_FETCH_MODELS. No more fallback to page scraping + LLM extraction.
