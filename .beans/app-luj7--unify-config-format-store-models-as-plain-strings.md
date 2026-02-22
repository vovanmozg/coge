---
# app-luj7
title: 'Unify config format: store models as plain strings everywhere'
status: completed
type: task
priority: normal
created_at: 2026-02-22T14:23:27Z
updated_at: 2026-02-22T14:30:27Z
---

Both config.json and default-config.json should use the same format for the available arrays — plain string IDs.

Currently config.json stores models as objects {id, category} after --pull models, while default-config.json stores plain strings. This inconsistency complicates sync-defaults and makes the formats confusing.

## Plan
- [ ] Change --pull models (runPullModels in coge.js) to save only string IDs, not {id, category} objects
- [ ] Remove normalizeAvailableEntry() usage from config writing path
- [ ] Move classifyModel() call to --configure time (where it's already used for display)
- [ ] Update sync-defaults script to remove extractIds — just copy arrays directly
- [ ] Verify --configure still shows correct color-coded categories
- [ ] Run tests

## Summary of Changes

Most work was already done in app-7lzo. Remaining change: cleaned up sync-defaults.js — removed extractIds helper, use plain string arrays directly, and sort by category when syncing. All 174 tests pass.
