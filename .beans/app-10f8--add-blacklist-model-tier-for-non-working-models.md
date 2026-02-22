---
# app-10f8
title: Add "blacklist" model tier for non-working models
status: completed
type: feature
priority: normal
created_at: 2026-02-22T22:40:58Z
updated_at: 2026-02-22T22:54:16Z
---

## Problem

Some models returned by `--pull models` do not actually work (e.g. return errors, require special access, or are deprecated). Currently there is no way to mark them as unusable — they can still be selected by the bandit algorithm or by the user.

## Solution

Add a new model tier `blacklist` alongside existing tiers (`top`, `small`, `normal`, `unavailable`). Blacklisted models:

- Are never selected by the bandit algorithm or race mode
- Are excluded from `--configure` model selection
- Can still be seen with a flag (e.g. `--pull models <provider> --all`)
- Are populated manually in config (not auto-detected)

## Tasks

- [ ] Add `blacklist` tier to the model tier system
- [ ] Ensure blacklisted models are excluded from provider selection / race
- [ ] Ensure blacklisted models are excluded from `--configure` model list
- [ ] Allow manual editing of blacklist in config.json
- [ ] Consider: auto-blacklist models that fail in `--ptestall`
