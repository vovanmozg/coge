---
# app-cj33
title: Add code-review agent rule in .claude
status: completed
type: task
priority: normal
tags:
    - chore
    - dx
created_at: 2026-02-21T21:14:12Z
updated_at: 2026-02-21T21:45:24Z
---

## Context
Add a code-review agent/rule for Claude Code that enforces project quality standards during reviews.

## Scope
1. Create `.claude/rules/code-review.mdc` with a rule that instructs the AI to:
   - Focus on correctness and security
   - Check consistency with project conventions (e.g. English-only messages per existing rule)
   - Suggest concrete edits, not vague advice
   - Look for common issues: error handling, input validation, edge cases
   - Verify new code follows existing patterns (provider factory, config structure)

## Key Files
- `.claude/rules/code-review.mdc` (new)

## Acceptance Criteria
- Rule file exists and is valid MDC format
- Rule covers: correctness, security, consistency, concrete suggestions
- Compatible with existing `.claude/rules/english-messages.mdc`

## Summary of Changes
- Created `.claude/rules/code-review.mdc` with MDC frontmatter
- Covers: correctness, security, consistency, concrete suggestions
- References project conventions: provider factory pattern, `COGE_` env var naming, English messages, `openai-compatible.js` helper usage
- Compatible with existing `english-messages.mdc` rule
