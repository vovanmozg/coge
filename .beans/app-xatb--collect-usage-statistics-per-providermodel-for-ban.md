---
# app-xatb
title: Collect usage statistics per provider/model for bandit algorithm
status: completed
type: feature
priority: normal
created_at: 2026-02-22T22:31:08Z
updated_at: 2026-02-22T23:14:36Z
---

## Description

Track user actions after receiving a generated command — what the user chose to do:

- **Execute** (Enter)
- **Copy** (c)
- **Cancel** (Esc)

Store per provider/model pair. This data can feed into the multi-armed bandit algorithm to improve provider/model selection — not just by speed, but by actual user satisfaction (execute/copy = good, cancel = bad).

## Tasks

- [ ] Design stats storage format (e.g. in `~/.config/coge/stats.json`)
- [ ] Record user action (execute / copy / cancel) along with provider and model after each interaction
- [ ] Expose stats for the bandit algorithm to consume
- [ ] Consider a `coge --stats` command to view aggregated statistics
