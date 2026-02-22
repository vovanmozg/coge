---
# app-i7kq
title: Update --configure to use model lists from config
status: completed
type: task
priority: normal
created_at: 2026-02-22T10:32:56Z
updated_at: 2026-02-22T10:52:59Z
parent: app-x03k
blocked_by:
    - app-p1hm
---

## Description

Update the `--configure` interactive flow to read available models from the config file (populated by the new config structure) instead of hardcoded provider exports.

## Acceptance criteria

- [x] `--configure` shows available models from `config.providers.<name>.available`
- [x] Falls back to hardcoded list if config has no `available` for a provider
- [x] Selected model is saved correctly in new config format

## Summary of Changes

- **coge.js**: `runConfigure()` now reads available models from `config.providers.<name>.available`, falling back to hardcoded `getAvailableModels()` when the config entry is missing.
