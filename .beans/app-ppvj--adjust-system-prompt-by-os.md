---
# app-ppvj
title: Adjust system prompt by OS
status: completed
type: feature
priority: normal
tags:
    - feature
    - ux
created_at: 2026-02-21T21:14:19Z
updated_at: 2026-02-21T21:45:20Z
---

## Context
Currently the system prompt hardcodes "Linux command-line assistant" and "bash". On Windows this is incorrect — users need PowerShell commands instead.

## Scope
1. Detect OS via `process.platform`:
   - `darwin` → macOS (bash/zsh)
   - `win32` → Windows (PowerShell)
   - `linux` → Linux (bash)

2. Adjust system prompt in `coge.js`:
   - Linux/macOS: keep current wording — "bash command", "chain with && or |"
   - Windows: mention "PowerShell command" instead of "bash", adapt chaining syntax

3. Preserve core semantics across all platforms:
   - "one line only"
   - "no markdown"
   - Command chaining (adapted per shell)

## Key Files
- `coge.js` (system prompt logic)

## Acceptance Criteria
- On Linux/macOS: prompt mentions bash, behavior unchanged
- On Windows: prompt mentions PowerShell, no bash references
- System prompt remains concise and effective

## Summary of Changes
- Extracted system prompt into `buildSystemPrompt()` function in `coge.js`
- Detects OS via `process.platform`:
  - `win32` → PowerShell, `;` chaining
  - `darwin` → macOS + zsh
  - `linux` → Linux + bash
- Core semantics preserved: one line only, no markdown, no backticks
