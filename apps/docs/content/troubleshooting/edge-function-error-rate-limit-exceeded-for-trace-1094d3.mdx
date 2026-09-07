---
title = "Edge Function error: 'Rate limit exceeded for trace'"
date_created = "2026-05-07T14:04:17+00:00"
topics = [ "functions" ]
keywords = []
---

If you are observing a `RateLimitError: "Rate limit exceeded for trace ..."` error when invoking Edge Functions, it typically indicates that a single function execution is triggering too many downstream calls simultaneously.

**Why Does This Happen?**

- This often occurs in "fan-out" scenarios, such as a cron-driven function that calls other functions in a loop.
- All downstream `supabase.functions.invoke()` calls initiated from the same parent execution share a single Trace ID. These calls draw from a specific per-trace safety budget rather than the total project-level capacity. If the volume of calls is too high, the budget is exhausted and subsequent calls are throttled.

**How to Resolve This Issue:**

- **Pace Invocations:** Introduce a delay between `invoke()` calls (e.g., hundreds of milliseconds) in the producer function to stay within the trace budget.
- **Batch Payloads:** Restructure the downstream function to accept an array of data, allowing a single invocation to process multiple records instead of triggering individual calls for each.
- **Consolidate Logic:** Refactor the logic into a shared library or move it directly into the calling function to eliminate the need for cross-function network calls.

You can monitor these errors by visiting the [logs explorer](/dashboard/project/_/logs/explorer) to identify which executions are exceeding their trace budget.

For more details on how recursive invocations and per-trace rate limiting work, see the recursive functions guide: [Recursive Functions — What gets rate limited](/docs/guides/functions/recursive-functions#what-gets-rate-limited).
