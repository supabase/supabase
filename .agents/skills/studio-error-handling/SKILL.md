---
name: studio-error-handling
description: Error display and troubleshooting pattern for Supabase Studio. Use when
  showing a failed API request or query error in the UI (AlertError, toast, inline
  message), adding troubleshooting steps for a new error type, or wiring up the AI
  assistant debug button from an error state.
---

# Studio Error Handling Pattern

Full docs and code examples: `apps/studio/components/interfaces/ErrorHandling/README.md`

## How it works

Classification happens in the **data layer**: `handleError` in `data/fetchers.ts` tests the error message against `ERROR_PATTERNS` and throws the matching tagged error (e.g. `ConnectionTimeoutError`, tag `DbConnectionTimeout`). The component (`ErrorMatcher`) looks up the mapping by the error's class — it never does regex matching.

```
handleError() → throws ConnectionTimeoutError → React Query catches → ErrorMatcher looks up the class → renders troubleshooting
```

Every error `handleError` throws is an Effect `Data.TaggedError` carrying `_tag`, `fault` (`user | platform | third_party | studio`), `reason`, `classifiedBy` (`rule | default`), `retryable` and `service`, alongside the legacy fields (`message`, `code`, `requestId`, …). Check for one with `isStudioError(e)` from `lib/errors/studio-errors`, never `instanceof`. `StudioError` is the union type of all Studio errors (type only); two classifiers in `data/error-classification.ts`, and `handleError` picks between them. `classifyResponseError({ message, code })` is only for errors from an API response (pattern match wins, else 5xx `PlatformError`, 4xx `UnclassifiedApiError`, no status `UnexpectedError`). `classifyError(e)` is for everything else (tagged passes through, abort `RequestAborted`, fetch failure `NetworkUnreachable`, otherwise `UnexpectedError`). Never pass a made-up status to `classifyResponseError`. `lib/errors/error-routing.ts` is a total tag to `{ sentrySampleRate }` record (rates are the `SAMPLE_NEVER`/`SAMPLE_OTHER`/`SAMPLE_OWNED`/`SAMPLE_ALWAYS` constants, 0-1), and `reportStudioError` sends to Sentry at that rate (tagging `sample_rate`, applied in `beforeSend`) and sets `errorEventId`. Reporting happens in the QueryCache/MutationCache `onError` (`reportQueryError`) after the last retry, using the `sentryContext` and `alwaysCapture` that `handleError` remembered. Pass `reportImmediately: true` to `handleError` only for callers outside React Query (never reached by a query or mutation). See the README for details.

## Key files

| File                                  | Purpose                                                           |
| ------------------------------------- | ----------------------------------------------------------------- |
| `data/error-patterns.ts`              | Array of `{ pattern, ErrorClass }` — the regex lives here         |
| `lib/errors/studio-errors.ts`         | Tagged error classes, `StudioError` (union type), `isStudioError` |
| `data/error-classification.ts`        | `classifyResponseError`, `classifyError` (default rules)          |
| `lib/errors/error-routing.ts`         | `ERROR_ROUTING`: per-tag Sentry sample rate                       |
| `ErrorMatcher.tsx`                    | Component — looks up the mapping by error class, renders          |
| `error-mappings.tsx`                  | `Map<ErrorClass, { id, Troubleshooting: ComponentType }>`         |
| `errorMappings/ConnectionTimeout.tsx` | Reference troubleshooting component                               |
| `TroubleshootingSections.tsx`         | Reusable accordion section components                             |
| `TroubleshootingAccordion.tsx`        | Accordion wrapper with telemetry                                  |

## Which component

| Situation                                                                                           | Use                                                                                                                      |
| --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| A query failed and the page/section can't render its data (the default case — most of Studio)       | `AlertError` from `components/ui/AlertError`                                                                             |
| The error may be a **classified** type with its own troubleshooting steps (e.g. connection timeout) | `ErrorMatcher` from `components/interfaces/ErrorHandling/ErrorMatcher` — pass a `fallback` for the unclassified case     |
| A mutation failed                                                                                   | The mutation hook's default `onError` toast (`toast.error` from `sonner`) — don't render an alert (see `studio-queries`) |

### `AlertError` (default)

Renders a warning `Admonition` with the error message, generic "try refreshing / contact support" instructions, and a **Contact support** button pre-filled with `projectRef`, `subject`, and the error message.

```tsx
if (isError) return <AlertError error={error} subject="Failed to retrieve invoices" />
```

- `subject` is the human-readable title, phrased `Failed to <verb> <thing>`. Pass `projectRef` when in a project context so the support form is pre-filled.
- `error` is the React Query error object (anything with `message`); `503` responses are reworded automatically.
- Use `additionalActions` for a retry or navigate button; `hideContactSupport` only when support genuinely can't help (e.g. a user-input error).
- Prefer the early-return form for the page/section's primary data; use inline `{isError && <AlertError … />}` for secondary panels that shouldn't block the rest of the page.

### `ErrorMatcher` (classified errors)

Use when the data layer may have classified the error into a tagged class with dedicated troubleshooting UI. It looks up the error's class and renders the mapped `Troubleshooting` component, or `fallback` when there is no mapping. Today this is wired for the table editor sidebar; reach for it when adding troubleshooting for a new error type rather than as a general replacement for `AlertError`.

## `ErrorMatcher` usage

Pass the **full error object** from React Query — not `error.message`:

```tsx
{
  isError && (
    <ErrorMatcher title="Failed to load tables" error={error} supportFormParams={{ projectRef }} />
  )
}
```

## What NOT to do

- Do not pass `error.message` to `ErrorMatcher` — pass the full `error` object so the class is preserved.
- Do not put regex patterns in `error-mappings.tsx` — they belong in `data/error-patterns.ts`.
- Do not use `Object.assign` to stamp a `_tag` onto an error — add a tagged class instead.
- Do not pass a raw URL string for support — use `supportFormParams={{ projectRef }}`.
- Do not put the page title inside the error mapping — it belongs on the `<ErrorMatcher>` caller.
- Do not add callback props (`onDebugWithAI`, `onRestartProject`) to troubleshooting components — use hooks inside them instead.
