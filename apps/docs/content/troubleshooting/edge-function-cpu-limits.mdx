---
title = "Understanding Edge Function CPU limits"
topics = [ "functions" ]
keywords = [ "CPU", "limit", "isolate", "soft limit", "hard limit", "edge function" ]
database_id = "1765884f-81d6-415a-a78f-7085f7b7ddbf"
---

Learn how Edge Functions manage CPU resources and what happens when limits are reached.

## How isolates work

An isolate is like a worker that can handle multiple requests for a function. It works until a time limit of 400 seconds is reached. Edge Functions use isolates with soft and hard CPU limits.

## Soft limit

When the isolate hits the soft limit, it **retires**. This means:

- It won't take on any new requests
- It will finish processing requests it's already working on
- It keeps going until it hits the hard limit for CPU time or reaches the 400-second time limit, whichever comes first

## Hard limit

If there are new requests after the soft limit is reached:

- A new isolate is created to handle them
- The original isolate continues until it hits the hard limit or the time limit
- This ensures existing requests are completed while new ones are managed by a fresh isolate

## Current limits

- **Wall clock time limit:** 400 seconds total duration
- **CPU execution time:** 200 milliseconds of active computing

## What happens when limits are exceeded

When your function exceeds CPU limits, you may see:

- 546 error responses
- Function termination with `CPUTime` shutdown reason
- Degraded performance as new isolates spin up

## Optimizing CPU usage

### Profile your code

Identify CPU-intensive sections in your function:

- Complex calculations
- Data processing loops
- Encryption operations

### Optimize algorithms

- Use more efficient data structures
- Cache computed results
- Reduce algorithmic complexity

### Offload heavy work

- Move intensive processing to background jobs
- Use external services for heavy computations
- Break large tasks into smaller functions

## Additional resources

- [Monitoring resource usage](./edge-function-monitoring-resource-usage)
- [Edge Function shutdown reasons explained](./edge-function-shutdown-reasons-explained)
- [Edge Function limits](/docs/guides/functions/limits)
