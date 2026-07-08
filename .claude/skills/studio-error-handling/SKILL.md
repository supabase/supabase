---
name: studio-error-handling
description: Error display and troubleshooting pattern for Supabase Studio. Use when
  rendering API errors in the UI, adding inline troubleshooting steps for a new
  error type, or wiring up the AI assistant debug button from an error state.
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

## Usage

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
