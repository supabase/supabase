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

Classification happens in the **data layer**: `handleError` in `data/fetchers.ts` tests the error message against `ERROR_PATTERNS` and throws the matching error subclass (e.g. `ConnectionTimeoutError extends ResponseError`). The component (`ErrorMatcher`) reads `errorType` from the instance and does an O(1) lookup — it never does regex matching.

```
handleError() → throws ConnectionTimeoutError → React Query catches → ErrorMatcher reads errorType → renders troubleshooting
```

## Key files

| File                                  | Purpose                                                          |
| ------------------------------------- | ---------------------------------------------------------------- |
| `data/error-patterns.ts`              | Array of `{ pattern, ErrorClass }` — the regex lives here        |
| `types/api-errors.ts`                 | Error classes, `KnownErrorType` union, `ClassifiedError` type    |
| `ErrorMatcher.tsx`                    | Component — reads `errorType`, looks up mapping, renders         |
| `error-mappings.tsx`                  | `Record<KnownErrorType, { id, Troubleshooting: ComponentType }>` |
| `errorMappings/ConnectionTimeout.tsx` | Reference troubleshooting component                              |
| `TroubleshootingSections.tsx`         | Reusable accordion section components                            |
| `TroubleshootingAccordion.tsx`        | Accordion wrapper with telemetry                                 |

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

Use when the data layer may have classified the error into a `KnownErrorType` with dedicated troubleshooting UI. It reads `errorType` from the error instance and renders the mapped `Troubleshooting` component, or `fallback` when there is no mapping. Today this is wired for the table editor sidebar; reach for it when adding troubleshooting for a new error type rather than as a general replacement for `AlertError`.

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
- Do not use `Object.assign` to stamp `errorType` — throw a proper subclass instead.
- Do not pass a raw URL string for support — use `supportFormParams={{ projectRef }}`.
- Do not put the page title inside the error mapping — it belongs on the `<ErrorMatcher>` caller.
- Do not add callback props (`onDebugWithAI`, `onRestartProject`) to troubleshooting components — use hooks inside them instead.
