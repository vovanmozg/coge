---
# app-l7fk
title: 'Race mode: send parallel requests to multiple providers, return first response'
status: completed
type: feature
priority: normal
created_at: 2026-02-22T15:07:46Z
updated_at: 2026-02-22T20:30:15Z
---

Speed up response time by sending requests to 3 different providers simultaneously and returning the first successful response to the user (race pattern).

## Motivation

Currently requests are sent to a single provider sequentially. Response latency depends entirely on that one provider's speed. By racing multiple providers in parallel, we can consistently get the fastest available response.

## Approach

- Send the same prompt to 3 (configurable?) different providers concurrently using `Promise.race` or `Promise.any`
- Return the first successful response to the user
- Cancel/discard remaining in-flight requests (abort where possible)

## TODO

- [ ] Design configuration for race mode (which providers to race, how many)
- [ ] Implement parallel request dispatch with `Promise.any`
- [ ] Handle abort/cleanup of slower requests (AbortController)
- [ ] Handle case when all providers fail
- [ ] Add CLI flag or config option to enable race mode
- [ ] Test with multiple provider combinations
