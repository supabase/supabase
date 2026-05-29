---
applyTo: "apps/studio/**"
---

# Studio Error Handling Review Rules

All comments are **advisory**.

## Architecture

Errors flow: `handleError()` → throws typed subclass → React Query catches → `ErrorMatcher` reads `errorType` → renders troubleshooting. The component does an O(1) lookup — it never does regex matching.

## When to Flag

- PR passes `error.message` instead of the full `error` object to `ErrorMatcher` — the class type is lost
- PR puts regex patterns in `error-mappings.tsx` — they belong in `data/error-patterns.ts`
- PR uses `Object.assign` to stamp `errorType` on an error — should throw a proper subclass instead
- PR passes a raw URL string for support links — should use `supportFormParams={{ projectRef }}`
- PR puts the page title inside the error mapping — it belongs on the `<ErrorMatcher>` caller
- PR adds callback props (`onDebugWithAI`, `onRestartProject`) to troubleshooting components — use hooks inside them instead

## Correct Usage

```tsx
{isError && (
  <ErrorMatcher
    title="Failed to load tables"
    error={error}
    supportFormParams={{ projectRef }}
  />
)}
```

## Key Files

| File | Purpose |
|------|---------|
| `data/error-patterns.ts` | `{ pattern, ErrorClass }` array — regex lives here |
| `types/api-errors.ts` | Error classes, `KnownErrorType` union |
| `ErrorMatcher.tsx` | Reads `errorType`, looks up mapping, renders |
| `error-mappings.tsx` | `Record<KnownErrorType, { id, Troubleshooting }>` |

Canonical standard: `.claude/skills/studio-error-handling/SKILL.md`
