---
name: sync-provider-models
description: "Update default model lists in default-config.json from user config"
---

<command-name>sync-provider-models</command-name>

# Sync Provider Models

Update the default model lists in `lib/default-config.json` using data from the user's config file (`~/.config/coge/config.json`).

Both files have the same JSON structure: `{ provider, model, providers: { ... } }`.

## When to Use

Use this skill when you need to refresh the default model lists that serve as defaults for users who just installed coge and haven't run `--pull models` yet.

## Instructions

### 1. Read both files

- Read `~/.config/coge/config.json` (user config with pulled models)
- Read `lib/default-config.json` (defaults shipped with the code)

### 2. Extract model IDs from user config

The config `available` array can contain either plain strings or objects with `{ id, category }`. Extract just the model ID strings from whichever format is present.

### 3. Update `available` arrays in default-config.json

For each provider present in the user config, update its `available` array in `lib/default-config.json` with the full list of model IDs. Keep them as plain strings — the `classifyModel()` function classifies them at runtime.

### 4. Skip providers not in user config

If a provider exists in `default-config.json` but not in the user config (models were never pulled for it), skip it.

### 5. Report results

List which providers were updated and how many models each now has. Also list any providers that were skipped.

## Important

- All changes go into a single file: `lib/default-config.json`
- Only update the `available` arrays, never change `default`, `provider`, or `model`
- Keep model IDs as plain strings (not objects with categories)
