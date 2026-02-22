---
# app-y1k1
title: 'Bug: github-models provider lowercases model name causing unknown_model error'
status: completed
type: bug
priority: high
created_at: 2026-02-22T22:12:34Z
updated_at: 2026-02-22T22:24:39Z
---

## Problem

When using github-models provider, the model name is lowercased before sending to the API, causing `unknown_model` errors. For example:

- User configures `microsoft/Phi-4` → API receives `microsoft/phi-4` → 400 error
- User configures `microsoft/Phi-4-mini-instruct` → API receives `microsoft/phi-4-mini-instruct` → 400 error

GitHub Models API requires exact case-sensitive model names (e.g. `Phi-4`, not `phi-4`).

## Steps to Reproduce

```bash
coge --configure  # select github-models, model: microsoft/Phi-4
coge --debug "list of files"
# Error: unknown_model: microsoft/phi-4
```

## Expected

Model name should be sent as-is, preserving original casing.

## Root Cause

The old Azure endpoint `models.inference.ai.azure.com` has been deprecated. It lowercases
model names internally and does not support the `publisher/model` format that GitHub Models
now requires.

## Fix

Migrated github-models provider to the new GitHub-hosted API:
- Chat completions: `models.github.ai/inference/chat/completions`
- Models catalog: `models.github.ai/catalog/models`
- Added `X-GitHub-Api-Version` header
- Updated default models to `publisher/model` format (e.g. `openai/gpt-4o-mini`)
