---
title = "Edge Functions worker timeouts and WebSocket drops"
topics = [ "functions" ]
keywords = [ "websocket", "timeout", "earlydrop", "wall clock", "cpu limit", "streaming", "cold start" ]
---

## Background

Edge Functions run inside V8 isolates managed by a supervisor in `edge-runtime`.

The supervisor enforces resource limits:

- Wall clock time (`worker_timeout_ms`)
- CPU time (soft + hard limits)
- Memory usage

It may retire early (`EarlyDrop` event) if the isolate is idle Isolate is considered idle if following conditions are met:

- The HTTP response has already been returned.
- All `EdgeRuntime.waitUntil()` promises have resolved.

If both are true during a resource check, the isolate can be terminated even with open WebSocket connections.

## Scenario 1: WebSocket drops around half of the wall clock limit

### Symptoms

- WebSocket closes at a consistent interval (often around half of the configured wall clock limit).
- Logs include `EarlyDrop` or wall clock warning events.

### Root cause

After `Deno.upgradeWebSocket(req)` returns a response, the HTTP request is considered acknowledged. If there is no unresolved `waitUntil` work, the worker may look idle and be retired early.

### What to check

1. Compare connection lifetime to your wall clock limit.
2. Inspect logs for `EarlyDrop` around disconnect time.
3. Confirm there is no unresolved `EdgeRuntime.waitUntil()` promise tied to socket lifecycle.

### Workaround

Keep a promise pending until the socket closes.

```ts
Deno.serve((req) => {
  const { socket, response } = Deno.upgradeWebSocket(req)

  const socketClosedPromise = new Promise<void>((resolve) => {
    socket.onclose = () => resolve()
  })

  EdgeRuntime.waitUntil(socketClosedPromise)

  socket.onmessage = (event) => {
    socket.send(event.data)
  }

  return response
})
```

`EdgeRuntime.waitUntil()` prevents early retirement, but it does not extend the hard wall clock limit.

## Scenario 2: Function killed at a consistent duration

### Symptoms

- Function fails at a predictable runtime (for example, always around the same second mark).
- Logs include wall clock shutdown reasons.
- Clients may receive status `546` or cancellation errors.

### Root cause

The function exceeded the configured wall clock budget.

### Workarounds

- Split work into smaller units.
- Move long work to async/background processing and return early.
- Use streaming from upstream APIs where possible.
- Use queues (`pg_net`, `pgmq`, or webhooks) for chunked processing.

## Scenario 3: Function killed by CPU limit

### Symptoms

- Failures during compute-heavy tasks.
- Logs include CPU soft/hard limit events.

### Root cause

CPU budget and wall clock budget are independent. A function can run out of CPU time long before wall clock is exhausted.

### Workarounds

- Break large synchronous loops into async chunks.
- Optimize expensive paths and avoid repeated recalculation.
- Move heavy compute to systems designed for long CPU-bound workloads.

## Scenario 4: SSE or AI streams end before completion

### Symptoms

- Streaming starts but ends prematurely.
- No final `[DONE]` token or normal close marker.

### Root cause

The worker hits wall clock or early retirement conditions while forwarding a long stream.

### Workaround

Keep the isolate alive for the stream piping lifecycle:

```ts
Deno.serve(async (_req) => {
  const upstream = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
    },
    body: JSON.stringify({ stream: true }),
  })

  const { readable, writable } = new TransformStream()

  EdgeRuntime.waitUntil(upstream.body!.pipeTo(writable))

  return new Response(readable, {
    headers: { 'Content-Type': 'text/event-stream' },
  })
})
```

## Scenario 5: Cold starts fail before first response

### Symptoms

- First request after idle fails (for example, `504` or worker creation timeout).
- Subsequent requests may succeed.

### Root cause

Large dependency trees or expensive top-level initialization can exceed startup budget.

### Workarounds

- Avoid slow top-level `await` work.
- Lazy-initialize heavy clients inside request handlers.
- Reduce bundle and dependency size.
- Keep critical functions warm if needed.

## Key distinctions

- `EarlyDrop`: early retirement when worker appears idle.
- `WallClockTime`: hard runtime ceiling reached.
- CPU and wall clock limits are independent.
- WebSockets are not request-tracked by the supervisor after upgrade.

## Related resources

- [Edge Functions limits](/docs/guides/functions/limits)
- [Edge Function shutdown reasons explained](./edge-function-shutdown-reasons-explained)
- [Monitoring Edge Function resource usage](./edge-function-monitoring-resource-usage)
- [Handling WebSockets in Edge Functions](/docs/guides/functions/websockets)
