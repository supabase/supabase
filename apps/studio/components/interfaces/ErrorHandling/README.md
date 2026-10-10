# Error Handling

`ErrorMatcher` displays a typed API error using [`ErrorDisplay`](../../../../../apps/design-system/content/docs/fragments/error-display.mdx). If the error was classified by `handleError` (i.e. it is an instance of a known error class), it shows matching troubleshooting steps. Otherwise it shows a generic error card, optionally with caller-supplied fallback troubleshooting.

Classification happens in the data layer — `handleError` in `data/fetchers.ts` matches the error message against patterns and throws the appropriate error subclass (e.g. `ConnectionTimeoutError`). The component never does regex matching itself.

The `title` always comes from the caller — the same error type can appear on different pages with different titles.

`ErrorDisplay` owns the layout: the numbered accordion on wide containers, stacked buttons on narrow ones, the error block, and the support footer. This directory only supplies the **steps**.

## Usage

```tsx
import { ErrorMatcher } from 'components/interfaces/ErrorHandling/ErrorMatcher'
import { useRestartTroubleshooting } from 'components/interfaces/ErrorHandling/RestartTroubleshooting'

{
  isError && (
    <ErrorMatcher
      title="Failed to load tables"
      error={error}
      supportFormParams={{ projectRef }}
      useFallbackTroubleshooting={useRestartTroubleshooting}
    />
  )
}
```

Pass the full `error` object from React Query — not `error.message`. This lets `ErrorMatcher` check the error class and show the right troubleshooting steps.

### Props

| Prop                         | Type                            | Description                                                        |
| ---------------------------- | ------------------------------- | ------------------------------------------------------------------ |
| `title`                      | `string`                        | Displayed in the error card header. Set by the caller.             |
| `error`                      | `string \| { message: string }` | The error from React Query (pass the full object, not `.message`). |
| `supportFormParams`          | `SupportFormParams?`            | Typed params for the support form URL (projectRef, category…).     |
| `className`                  | `string?`                       | Extra classes on the card.                                         |
| `useFallbackTroubleshooting` | `UseTroubleshooting?`           | Steps to show when the error has no mapping of its own.            |

## Adding a new error mapping

**1. Add the error class to `types/api-errors.ts`**

```ts
export type KnownErrorType = 'connection-timeout' | 'your-error'

export class YourError extends ResponseError {
  readonly errorType = 'your-error' as const
}

export type ClassifiedError = ConnectionTimeoutError | FailedToRetrieveProjectsError | YourError
```

**2. Add a pattern entry to `data/error-patterns.ts`**

```ts
import { YourError } from 'types/api-errors'

export const ERROR_PATTERNS: ErrorPattern[] = [
  // existing...
  { pattern: /YOUR_ERROR_PATTERN/i, ErrorClass: YourError },
]
```

`handleError` picks this up automatically — any matching API error will be thrown as a `YourError` instance.

**3. Create `errorMappings/YourError.tsx`**

Export a hook returning `TroubleshootingContent`. Order steps least to most disruptive, and keep each `description` to one line — it's hidden until the step expands, and it's the button tooltip in the compact layout.

```tsx
export function useYourErrorTroubleshooting(): TroubleshootingContent {
  const track = useTrack()

  return {
    errorType: 'your-error',
    steps: [
      {
        id: 'guide',
        title: 'Try our troubleshooting guide',
        description: 'Step-by-step instructions for this error.',
        action: {
          label: 'View troubleshooting guide',
          href: `${DOCS_URL}/guides/...`,
          onClick: () =>
            track('inline_error_troubleshooter_action_clicked', {
              errorType: 'your-error',
              ctaType: 'troubleshooting_guide',
            }),
        },
      },
    ],
  }
}
```

**4. Add it to `error-mappings.tsx`**

```tsx
export const ERROR_MAPPINGS = new Map<ErrorConstructor, ErrorMapping>([
  // existing...
  [YourError, { id: 'your-error', useTroubleshooting: useYourErrorTroubleshooting }],
])
```

That's it. `ErrorMatcher` picks it up automatically.

## Writing step actions

Most steps are a label plus `onClick` or `href`. Two cases need more:

**Dialogs.** Keep the dialog state in the hook, open it from `onClick`, and return the dialog in `overlays`. It renders inside the card but takes no space until opened. See `useConnectionTimeoutTroubleshooting`.

```tsx
action: { label: 'Restart project', onClick: () => setShowRestartDialog(true) }
// ...
overlays: <RestartProjectDialog visible={showRestartDialog} onClose={...} restartType="database" />
```

**Controls a button can't express.** Use the step action's `render` escape hatch, and put the control in `TroubleshootingActions.tsx` so it owns its own hooks. `DebugWithAIAction` is the only one today — it's a split dropdown. `render` receives `{ block }`, which is `true` in the compact layout.

```tsx
action: {
  label: 'Debug with AI',
  render: ({ block }) => <DebugWithAIAction errorType={ERROR_TYPE} buildPrompt={BUILD_PROMPT} block={block} />,
}
```

Don't reach for `render` for an ordinary button — it opts the step out of the component's loading and link handling.

## Telemetry

`ErrorMatcher` fires `dashboard_error_created` (sampled), `inline_error_troubleshooter_exposed` on mount, and `inline_error_troubleshooter_step_clicked` when a step expands or collapses. Contact-support clicks fire `inline_error_troubleshooter_action_clicked` with `ctaType: 'contact_support'`.

Step actions fire their own `inline_error_troubleshooter_action_clicked` with the right `ctaType` — call `track` in the step's `onClick`, or inside the action component when using `render`.

## Files

| File                                  | Purpose                                                       |
| ------------------------------------- | ------------------------------------------------------------- |
| `ErrorMatcher.tsx`                    | Looks up the mapping, wires telemetry, renders `ErrorDisplay` |
| `ErrorMatcher.utils.ts`               | `getMappingForError`                                          |
| `error-mappings.tsx`                  | `ERROR_MAPPINGS` and the `TroubleshootingContent` shape       |
| `errorMappings/ConnectionTimeout.tsx` | Reference troubleshooting hook                                |
| `TroubleshootingActions.tsx`          | Action components used via a step's `render`                  |
| `RestartTroubleshooting.tsx`          | Fallback troubleshooting for unclassified errors              |
| `RestartProjectDialog.tsx`            | Restart confirmation, with the permission check and mutation  |
