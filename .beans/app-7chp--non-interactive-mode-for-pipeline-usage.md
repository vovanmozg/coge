---
# app-7chp
title: Non-interactive mode for pipeline usage
status: completed
type: feature
priority: normal
created_at: 2026-02-22T07:32:15Z
updated_at: 2026-02-22T09:01:32Z
---

## Description

Add a non-interactive mode to coge that outputs the generated command to stdout and exits immediately, without showing the interactive prompt ([Enter] Execute / [c] Copy / [Esc] Cancel).

This enables using coge in shell pipelines and scripts:

```bash
coge "list all docker containers" >> commands.sh
coge "find large files" | bash
result=$(coge "count lines in src/")
```

## Current behavior

coge always enters interactive mode after generating a command:
1. Prints the command
2. Shows prompt: `[Enter] Execute  [c] Copy  [Esc] Cancel`
3. Waits for keypress in raw mode
4. This blocks pipelines and non-TTY usage

## Expected behavior

When stdout is not a TTY (piped) OR when a flag is passed (e.g. `--non-interactive` or `-n`), coge should:
1. Generate the command via LLM
2. Print the command to stdout (without extra newlines or formatting)
3. Exit with code 0

## Acceptance criteria

- [x] Add flag `--non-interactive` to enable non-interactive mode
- [x] In non-interactive mode: print only the raw command, no prompt, no colors
- [x] Exit code 0 on success, non-zero on LLM/config errors
- [x] Works in pipelines: `coge "prompt" | bash`, `coge "prompt" >> file.sh`

## Summary of Changes

Added `--non-interactive` flag to `coge.js`. When passed, the tool outputs only the raw generated command to stdout (no extra newlines, no ANSI colors, no interactive prompt) and exits immediately. This enables pipeline usage like `coge --non-interactive "prompt" >> commands.sh`.
