---
title = "Edge Function shutdown reasons explained"
topics = [ "functions" ]
keywords = [ "shutdown", "termination", "event loop", "wall clock", "cpu time", "memory", "early drop" ]
database_id = "109b964f-c28c-4554-b059-cd8b165c63f8"

[[errors]]
http_status_code = 546
message = "Edge Function 'wall clock time limit reached'"

[[errors]]
message = "Edge Function terminated due to memory limit"

[[errors]]
message = "Edge Function terminated due to CPU limit"
---

Learn about the different reasons why an Edge Function (worker) might shut down and how to handle each scenario effectively.

## Understanding shutdown events

When an Edge Function stops executing, the runtime emits a `ShutdownEvent` with a specific `reason` that explains why the worker ended. Understanding these shutdown reasons helps you diagnose issues, optimize your functions, and build more resilient serverless applications.

These events are surfaced through logs and observability tools, allowing you to monitor function behavior and take appropriate action such as implementing retries, adjusting resource limits, or optimizing your code.

## Shutdown reasons

### EventLoopCompleted

**What it means:** The function's event loop finished naturally. There are no more pending tasks, timers, or microtasks. The worker completed all scheduled work successfully.

**When it happens:** This is the normal, graceful shutdown scenario. All synchronous code has executed, and all awaited promises have resolved.

**What to do:** Nothing special. This indicates successful completion. No retry is needed.

### WallClockTime

**What it means:** The worker exceeded the configured wall-clock timeout. This measures the total elapsed real time from when the function started, including time spent waiting for I/O, external API calls, and sleeps.

**When it happens:** Your function is taking too long to complete, regardless of how much actual computing it's doing. Currently, the wall clock limit is set at 400 seconds.

**What to do:**

- Break down long-running tasks into smaller functions
- Use streaming responses for operations that take time
- Consider moving long-running work to background jobs or queues
- Ensure your code handles partial completion gracefully
- Make operations idempotent so they can safely retry from the beginning

**Related:** See [Edge Function 'wall clock time limit reached'](./edge-function-wall-clock-time-limit-reached-Nk38bW) for more details.

### CPUTime

**What it means:** The worker consumed more CPU time than allowed. CPU time measures actual processing cycles used by your code, excluding time spent waiting for I/O or sleeping. Currently limited to 200 milliseconds.

**When it happens:** Your function is performing too much computation. This includes complex calculations, data processing, encryption, or other CPU-intensive operations.

**What to do:**

- Profile your code to identify CPU-intensive sections
- Optimize algorithms for better performance
- Consider caching computed results
- Move heavy processing to background jobs or external services
- Break large datasets into smaller chunks
- Use more efficient data structures

### Memory

**What it means:** The worker's memory usage exceeded the allowed limit. The `ShutdownEvent` includes detailed memory data showing total memory, heap usage, and external allocations.

**When it happens:** Your function is consuming too much RAM. This commonly happens when buffering large files, loading entire datasets into memory, or creating many objects without cleanup.

**What to do:**

- Use streaming instead of buffering entire files or responses
- Process data in chunks rather than loading everything at once
- Be mindful of closures and variables that might prevent garbage collection
- Avoid accumulating large arrays or objects
- Review the `memory_used` fields in logs to identify whether heap or external memory is the issue

### EarlyDrop

**What it means:** The runtime detected that the function has completed all its work and can be shut down early, before reaching any resource limits. This is actually the most common shutdown reason and typically indicates efficient function execution.

**When it happens:** Your function has finished processing the request, sent the response, and has no remaining async work (pending promises, timers, or callbacks). The runtime recognizes that the worker can be safely terminated without waiting for timeouts or other limits.

**Why this is good:** `EarlyDrop` means your function is running efficiently. It completed quickly, didn't exhaust resources, and the runtime could reclaim the worker for other requests. Most well-designed functions should end with `EarlyDrop`.

**What to do:**

- Nothing: this is the desired outcome for most functions
- If you're seeing `EarlyDrop` but expected more work to happen, check for:
  - Promises that weren't properly awaited
  - Event listeners or timers that weren't cleaned up
  - Background tasks that should have completed but didn't
- If you intentionally have background work that should continue after the response, make sure those promises are awaited before the function returns

### TerminationRequested

**What it means:** An external request explicitly asked the runtime to terminate the worker. This could be from orchestration systems, manual intervention, platform updates, deployments, or a user-initiated cancellation.

**When it happens:** The platform needs to stop your function immediately, often during deployments or infrastructure maintenance.

**What to do:**

- Implement graceful cleanup code, but expect it might not always run
- Design for abrupt termination. Use durable storage to persist work in progress
- Make operations atomic or use transactions where possible
- Track execution state externally so incomplete work can be detected and resumed
- Test your function's behavior when forcibly stopped

## Additional diagnostic events

While not shutdown reasons themselves, these events provide important context:

- **BootEvent / BootFailure:** Indicates whether a worker started successfully or failed during initialization
- **UncaughtException:** Signals an unhandled error with the exception message and CPU time used
- **LogEvent:** Runtime-emitted logs with severity levels (Debug, Info, Warning, Error)
- **WorkerMemoryUsed:** Detailed memory snapshot including total, heap, external memory, and memory checker data

## Shutdown event metadata

Each `ShutdownEvent` includes valuable diagnostic information:

- `reason`: One of the shutdown reasons described above
- `cpu_time_used`: Amount of CPU time consumed (in milliseconds)
- `memory_used`: Memory snapshot at shutdown with breakdown of total, heap, and external memory
- `execution_id`: Unique identifier for tracking this specific execution across logs and retries

## Best practices for resilient functions

### 1. Design for idempotency

Make your functions safe to run multiple times with the same input. Use execution IDs from metadata to detect duplicate runs and avoid repeating side effects.

```typescript
// Store execution_id to detect retries
const executionId = Deno.env.get('EXECUTION_ID')
const alreadyProcessed = await checkIfProcessed(executionId)

if (alreadyProcessed) {
  return new Response('Already processed', { status: 200 })
}
```

### 2. Implement checkpointing.

Save progress frequently to durable storage

```typescript
// Save progress incrementally
for (const batch of dataBatches) {
  await processBatch(batch)
  await saveProgress(batchId)
}
```

### 3. Use streaming for large data

Avoid loading entire files or responses into memory. Stream data to reduce memory footprint.

```typescript
// Stream responses instead of buffering
return new Response(readableStream, {
  headers: { 'Content-Type': 'application/json' },
})
```

### 4. Monitor and alert

Track shutdown reasons in your observability system. Set up alerts for:

- Frequent `Memory` shutdowns: investigate memory usage patterns
- Frequent `CPUTime` shutdowns: optimize computational work
- Frequent `WallClockTime` shutdowns: reduce latency or break up work
- Frequent `EarlyDrop` or `TerminationRequested`: check platform scaling and deployment patterns

Access your function logs at [Functions Logs](/dashboard/project/_/functions).

### 5. Handle cleanup gracefully

While you can't always rely on cleanup code running, implement it anyway for the cases where graceful shutdown is possible.

```typescript
// Cleanup handler (may not always run)
addEventListener('unload', () => {
  // Close connections, flush buffers, etc.
  cleanup()
})
```

## Example shutdown event payloads

**Normal completion:**

```json
{
  "event": {
    "Shutdown": {
      "reason": "EventLoopCompleted",
      "cpu_time_used": 12,
      "memory_used": {
        "total": 1048576,
        "heap": 512000,
        "external": 1000
      }
    }
  },
  "metadata": {
    "execution_id": "4b6a4e2e-7c4d-4f8b-9e1a-2d3c4e5f6a7b"
  }
}
```

**Wall-clock timeout:**

```json
{
  "event": {
    "Shutdown": {
      "reason": "WallClockTime",
      "cpu_time_used": 50,
      "memory_used": {
        "total": 2097152,
        "heap": 1024000,
        "external": 5000
      }
    }
  },
  "metadata": {
    "execution_id": "5c7b5f3f-8d5e-5g9c-0f2b-3e4d5f6g7h8i"
  }
}
```

## Troubleshooting checklist

Use this quick reference when investigating shutdown issues:

| Shutdown Reason                                | Primary Action                                                                          |
| ---------------------------------------------- | --------------------------------------------------------------------------------------- |
| Many `Memory` shutdowns                        | Switch to streaming; process data in chunks; investigate heap vs external allocations   |
| Many `CPUTime` shutdowns                       | Optimize algorithms; cache results; move heavy compute to background workers            |
| Many `WallClockTime` shutdowns                 | Reduce I/O waits; use async operations; break into smaller functions                    |
| Frequent `EarlyDrop` or `TerminationRequested` | Check platform scaling policies; review deployment logs; implement better checkpointing |

## Additional resources

- [Debugging Edge Functions](/docs/guides/functions/logging)
- [Edge Function limits](/docs/guides/functions/limits)
- [Inspecting Edge Function environment variables](./inspecting-edge-function-environment-variables-wg5qOQ)
