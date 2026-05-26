---
id: 'client-side-tracing'
title: 'Tracing with the JS SDK'
description: 'Propagate W3C trace context from the Supabase JS SDK through Supabase services'
---

The Supabase JS SDK can attach [W3C Trace Context](https://www.w3.org/TR/trace-context/) headers (`traceparent`, `tracestate`, `baggage`) to outgoing requests. The resulting `trace_id` flows through Supabase services and appears in API Gateway and Edge Function logs, so you can correlate client-side spans with the server-side logs they produced — end-to-end, across the network boundary.

Because the headers follow the W3C standard, any compliant tracing SDK (OpenTelemetry, Sentry, Datadog, Honeycomb, etc.) can pick up the trace on the server side, including in self-hosted collectors.

## Requirements

- `@supabase/supabase-js` version `2.106.0` or later
- `@opentelemetry/api` available at runtime — either installed directly or pulled in as a transitive dependency of your tracing SDK
- A tracing SDK that registers a W3C-compliant propagator with the OpenTelemetry API

If `@opentelemetry/api` is not installed, or there is no active trace context at request time, the SDK silently no-ops.

## Set up OpenTelemetry first

The SDK reads from whatever `TracerProvider` you register globally — it doesn't configure one for you. If you haven't instrumented your app yet, follow the [OpenTelemetry JavaScript getting started guide](https://opentelemetry.io/docs/languages/js/getting-started/) to install an SDK (`@opentelemetry/sdk-trace-node` for Node, `@opentelemetry/sdk-trace-web` for browsers) and an exporter for your backend (OTLP, Jaeger, Zipkin, or a vendor-specific one).

The Supabase SDK only takes care of propagating the trace context that's already active when a request is made.

## Enable trace propagation

Trace propagation is opt-in. Pass `tracePropagation: true` when creating the client:

```ts
import { trace } from '@opentelemetry/api'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  tracePropagation: true,
})

const tracer = trace.getTracer('my-app')

await tracer.startActiveSpan('fetch-users', async (span) => {
  // Outgoing request carries the active trace context.
  const { data, error } = await supabase.from('users').select('*')
  span.end()
})
```

For security, trace headers are only attached to requests targeting Supabase domains (`*.supabase.co`, `*.supabase.in`, and `localhost` for local development). Third-party hosts called through a custom `fetch` are never tagged.

## Advanced configuration

Pass an object instead of `true` for fine-grained control:

```ts
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  tracePropagation: {
    enabled: true,
    // Default: true. When false, headers are attached even if the
    // upstream trace is not sampled — useful when you want every
    // Supabase request tagged with a trace_id for log correlation.
    respectSamplingDecision: false,
  },
})
```

| Option                    | Type      | Default | Description                                                         |
| ------------------------- | --------- | ------- | ------------------------------------------------------------------- |
| `enabled`                 | `boolean` | `false` | Enable trace propagation.                                           |
| `respectSamplingDecision` | `boolean` | `true`  | If `true`, skip propagation when the upstream trace is not sampled. |

## Correlating with Supabase logs

Once trace context is flowing through, the `trace_id` appears in:

- **API Gateway logs** — every request to PostgREST, Auth, Storage, and Realtime
- **Edge Function logs** — invocations and any structured logs emitted from within the function

If you forward Supabase logs to a third-party backend via [Log Drains](/docs/guides/telemetry/log-drains), you can join Supabase logs to your own client and server traces using the shared `trace_id`. This is especially useful for self-hosted setups where you already operate your own OpenTelemetry collector — Supabase logs become first-class citizens in your existing tracing UI.

## Using a vendor tracing SDK

Many tracing SDKs are built on top of OpenTelemetry. They work with this guide as long as a W3C-compliant propagator is registered — but propagator behavior varies. Some vendor SDKs inject only their proprietary headers by default and need extra configuration to also emit the standard `traceparent` header. Check your vendor's OTel integration docs for the exact setup.

## Troubleshooting

The SDK silently no-ops when it can't propagate, which keeps it safe to enable but can mask configuration issues. If `trace_id` is missing from your Supabase logs, check these in order:

- **No active span at request time.** The SDK reads the _current_ context. If `supabase.from(...)` is called outside `tracer.startActiveSpan(...)` (or equivalent), there's nothing to propagate. Wrap the call in a span or use OpenTelemetry's automatic instrumentation.
- **`@opentelemetry/api` is not installed** in the app making the request. The SDK imports it dynamically and no-ops if it's missing.
- **No `TracerProvider` registered.** `@opentelemetry/api` defaults to a noop provider that produces non-recorded spans. Make sure your app calls `provider.register()` (or your vendor SDK's equivalent) before making requests.
- **The upstream trace is not sampled.** By default the SDK respects upstream sampling decisions. Set `respectSamplingDecision: false` to propagate every request regardless of sampling.
- **You're calling a non-Supabase host through a custom `fetch`.** Trace headers are only attached to Supabase domains (`*.supabase.co`, `*.supabase.in`, `localhost`).
