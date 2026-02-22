---
# app-8y5r
title: Add --debug flag for verbose logging
status: completed
type: feature
priority: normal
created_at: 2026-02-22T09:27:00Z
updated_at: 2026-02-22T09:58:22Z
---

## Description

Add a `--debug` flag to coge that enables verbose output showing what happens during execution: which provider/model is used, the system prompt, the user prompt, API request details, and timing.

This helps troubleshoot issues with providers, API keys, and unexpected command generation.

## Expected behavior

When `--debug` is passed, print diagnostic info to **stdout**:

- Config path and loaded config
- Selected provider and model
- API request timing

## Acceptance criteria

- [x] Add `--debug` flag parsing
- [x] Print debug info to stdout
- [x] Show: provider, model, response time
- [x] Works together with `--non-interactive`
- [x] Does not affect normal output when flag is absent

## Summary of Changes

Added `--debug` flag to `coge.js`. When passed, prints config path, provider, model, and API response time to stdout. Compatible with `--non-interactive`. No effect when absent.
