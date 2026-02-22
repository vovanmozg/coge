---
# app-gbey
title: Color-code models in --configure based on category
status: completed
type: feature
priority: normal
created_at: 2026-02-22T12:02:39Z
updated_at: 2026-02-22T12:05:27Z
---

Classify models at pull time (API metadata + name heuristics) and color-code in --configure: dim for irrelevant (audio/embed/image), green for small/fast, normal for large.

## Problem

When running `coge --configure`, the available models list includes irrelevant models (audio, embedding, image generation, etc.) alongside text generation models. All displayed the same way — hard to pick the right one.

## Solution

Color-code models in the `--configure` model selection step:
- **Dark gray** (dim): irrelevant models (audio, TTS, embedding, image, vision-only)
- **Green**: small/fast models (good for command generation)
- **Normal/white**: large models

## Implementation

### 1. Classify models at `--pull` time

Change `fetchModels()` return type from `string[]` to `Array<{ id, category }>`.

Classification approach: **API metadata + name heuristics**
- Parse metadata from API response where available (model type, description, capabilities)
- Apply name-based heuristics as fallback:
  - irrelevant: `whisper`, `tts`, `dall-e`, `embed`, `moderation`, `audio`, `image`
  - small: `mini`, `small`, `nano`, `8b`, `7b`, `3b`, `1b`, `tiny`, `fast`
  - large: everything else

Shared heuristic function in a new `lib/model-classify.js`.

### 2. Update config storage

Change `providers.<name>.available` from `string[]` to `Array<{ id, category }>`.
Backward compat: plain strings treated as `category: "large"`.

### 3. Color output in `--configure`

- dim for irrelevant
- green for small
- normal for large

## Tasks

- [x] Create shared `classifyModel(id, metadata?)` function
- [x] Update `fetchModels()` in each provider to return `{ id, category }[]`
- [x] Update `fetchOpenAIModelIds()` to return classified results
- [x] Update config read/write to handle new available format
- [x] Backward compat: handle plain string arrays in available
- [x] Color-code model list in `runConfigure()`
- [x] Update tests

## Summary of Changes

- New lib/model-classify.js with classifyModel() and normalizeAvailableEntry()
- fetchOpenAIModelIds() and all custom fetchModels() now return { id, category }[]
- runConfigure() shows color-coded models (dim/green/normal)
- runPullModels output is also color-coded
- Backward compat: plain string arrays auto-classified via normalizeAvailableEntry()
- 9 new tests for classification logic
