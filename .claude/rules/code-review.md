---
description: Code review standards for coge project
globs: "**/*.js"
---

# Code Review Rules

When reviewing code in this project, check for:

## Correctness
- Verify error handling covers all failure paths (API errors, missing env vars, empty responses)
- Check that provider factory pattern is followed: `createXxxProvider(apiKey, model) → Provider`
- Ensure `generateContent(systemPrompt, userPrompt)` returns a trimmed string or throws

## Security
- API keys must come from environment variables only, never hardcoded
- No secrets in config files, logs, or error messages
- Validate/sanitize any external input before use

## Consistency
- All user-facing messages in English (see english-messages.mdc)
- Environment variable names: `COGE_<PROVIDER>_<SUFFIX>` pattern
- Providers use native `fetch`, not third-party HTTP libraries
- New providers should use `openai-compatible.js` helper when the API is OpenAI-compatible

## Suggestions
- Give concrete code edits, not vague advice
- Reference existing patterns when suggesting changes
- Flag missing tests for new functionality
