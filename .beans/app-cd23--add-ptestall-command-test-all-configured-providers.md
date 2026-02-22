---
# app-cd23
title: 'Add --ptestall command: test all configured providers'
status: completed
type: feature
priority: normal
created_at: 2026-02-22T22:38:59Z
updated_at: 2026-02-22T22:57:32Z
---

## Description

Add a `coge --ptestall` command that tests all providers with configured API keys by sending a standard test prompt and reporting results.

## Behavior

1. Find all providers that have their environment variable set
2. Send the same test prompt `"list of files"` to each provider
3. Validate that the response starts with `ls` (case-insensitive)
4. Print a summary report at the end

## Expected output

```
Testing all configured providers...

  gemini (gemini-2.5-flash)         ✓  312ms  "ls -la"
  groq (llama-3.3-70b)              ✓  198ms  "ls -la"
  github-models (gpt-4o-mini)       ✗  400 unknown_model
  cohere (command-r-plus)           ✓  520ms  "ls -alh" (warning: does not start with "ls")
  cloudflare (...)                  ✗  timeout

Results: 3/5 passed
```

## Tasks

- [ ] Add `--ptestall` flag parsing in CLI
- [ ] Iterate over all providers with configured env vars
- [ ] Send test prompt `"list of files"` to each, capture response and timing
- [ ] Validate response starts with `ls`
- [ ] Print summary report with status, time, response preview, and pass/fail count
