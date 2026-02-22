---
# app-6vk7
title: Update Hugging Face provider to use the new router endpoint
status: completed
type: task
priority: normal
created_at: 2026-02-22T10:31:48Z
updated_at: 2026-02-22T11:29:58Z
---

## Context

Hugging Face now offers a unified OpenAI-compatible router at `https://router.huggingface.co/v1/chat/completions`.
The model is passed in the JSON body (standard OpenAI format), not in the URL path.

Current implementation uses the **old** per-model endpoint:
```
https://api-inference.huggingface.co/models/${model}/v1/chat/completions
```

New endpoint (from HF docs):
```
curl https://router.huggingface.co/v1/chat/completions \
    -H "Authorization: Bearer $HF_TOKEN" \
    -H 'Content-Type: application/json' \
    -d '{"messages": [...], "model": "openai/gpt-oss-120b:fastest", "stream": false}'
```

## Tasks

- [x] Change the URL from per-model `api-inference.huggingface.co/models/${model}/v1/chat/completions` to unified `https://router.huggingface.co/v1/chat/completions`
- [x] Simplify the provider — can now use `makeOpenAICompatible` since the URL is static
- [x] Update the default model and available models list to match what's available on the new router
- [x] Test the updated provider

## Summary of Changes

- Replaced custom createHuggingFaceProvider with makeOpenAICompatible using unified router.huggingface.co endpoint
- Model sent in JSON body instead of URL path
- Updated tests to verify new endpoint and body format
