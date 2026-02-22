---
# app-wuo0
title: Cache prompt-response pairs for repeated queries
status: draft
type: feature
created_at: 2026-02-22T14:52:28Z
updated_at: 2026-02-22T14:52:28Z
---

## Problem

When the user sends the same prompt repeatedly (e.g. "show files list"), coge makes a full API call each time. This wastes tokens and adds latency for queries that would produce the same result.

## Solution

Cache prompt-response pairs locally alongside config.json (e.g. `~/.config/coge/cache/`).

Before calling the provider API, check if an identical prompt has been seen before. If so, return the cached response instantly.

## Design considerations
- Cache key: hash of (system prompt + user prompt)
- Storage: flat files or single JSON/SQLite in `~/.config/coge/cache/`
- Expiration policy: TTL-based, or max entries, or manual `coge --clear-cache`
- Cache should be provider-agnostic (same prompt to different providers = different cache entries)
- Consider including model in the cache key (same prompt, different model = different result)

## Example
```
$ coge "show files list"
# First call: API request, response cached
ls -al

$ coge "show files list"
# Second call: instant response from cache
ls -al (cached)
```

## Plan
- [ ] Design cache key format (hash of system prompt + user prompt + provider + model)
- [ ] Create cache read/write module in lib/
- [ ] Integrate cache lookup before API call in main flow
- [ ] Add cache hit indicator in output (optional)
- [ ] Add `--no-cache` flag to bypass cache
- [ ] Add `--clear-cache` command
- [ ] Consider cache size limits / eviction
