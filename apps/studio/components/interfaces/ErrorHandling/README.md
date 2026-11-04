# Error Handling

`ErrorMatcher` displays a typed API error. If the error was classified by `handleError` (i.e. it is an instance of a known error class), it shows matching troubleshooting steps. Otherwise it shows a generic error card.

Classification happens in the data layer — `handleError` in `data/fetchers.ts` matches the error message against patterns and throws the appropriate error class (e.g. `ConnectionTimeoutError`). The component never does regex matching itself.

## Error model

Every error `handleError` throws is an Effect `Data.TaggedError` (still `instanceof Error`) defined in `lib/errors/studio-errors.ts`. Each carries:

- `_tag` — `RequestAborted`, `NetworkUnreachable`, `MalformedResponse`, `PlatformError`, `UnclassifiedApiError`, `DbConnectionTimeout`, `UnexpectedError`.
- `fault` (`user | platform | third_party | studio`), `reason` (snake_case slug), `classifiedBy` (`rule | default`), `retryable`, `service`, plus the legacy fields `message`, `code`, `requestId`, `retryAfter`, `requestPathname`, `metadata`, `formattedError`.

Use `isStudioError(e)` (not `instanceof`) to check for any of them. `StudioError` is the union type of all Studio errors (a type only, not a class). Both entry points live in `data/error-classification`: `classifyResponseError` for errors that come back from an API request Studio sent (a response with a status and body), and `classifyError` for everything else. `handleError` picks between them. Don't build non-API errors with `classifyResponseError` and a made-up status; use `classifyError` or a specific class.

Default rules in `data/error-classification.ts` (`classifyResponseError`): a matching `ERROR_PATTERNS` entry wins (`rule`); otherwise 5xx is `PlatformError`, 4xx is `UnclassifiedApiError` (reason from status), and anything without a status is `UnexpectedError`. Everything else goes through `classifyError`, which knows nothing about API bodies: an already-tagged error passes through; `AbortError` is `RequestAborted`; a `TypeError` is `NetworkUnreachable` only when its message is a browser fetch-failure message (`Failed to fetch`, `NetworkError when attempting to fetch resource`, `Load failed`, `Network request failed`). Any other `TypeError` is a bug in our code and becomes `UnexpectedError` (`studio`).

`lib/errors/error-routing.ts` is a total record of tag to `{ sentrySampleRate }`. `sentrySampleRate` is a 0-1 rate from the named constants `SAMPLE_NEVER` (0), `SAMPLE_OTHER` (faults owned by other teams), `SAMPLE_OWNED` (faults Studio owns) and `SAMPLE_ALWAYS` (1); set OTHER and OWNED with the public env vars `NEXT_PUBLIC_SENTRY_SAMPLE_RATE_OTHER` and `NEXT_PUBLIC_SENTRY_SAMPLE_RATE_OWNED` (defaults 0.1 and 0.25; unset or out-of-range values use the default). `reportStudioError` (`lib/errors/report-studio-error.ts`) reads it, skips rate 0, tags the Sentry event with tag/fault/service/endpoint and `sample_rate` (which `beforeSend` uses to drop events, and which lets you re-weight Sentry counts), and stores the event id on `err.errorEventId`. `handleError(error, { alwaysCapture: true })` reports at rate 1 regardless of routing. `errorEventId` may refer to an event that was sampled out.

**When reporting happens.** `handleError` classifies and throws without reporting; it remembers `sentryContext` and `alwaysCapture` for the error instance. The `QueryCache` and `MutationCache` in `data/query-client.ts` call `reportQueryError` from their `onError`, which runs once per failed fetch after the last retry (so retries produce one Sentry event, not one per attempt). Callers outside React Query (plain functions, event handlers, server code) pass `handleError(error, { reportImmediately: true })` to report right away.

The `title` always comes from the caller — the same error type can appear on different pages with different titles.

## Usage

```tsx
import { ErrorMatcher } from 'components/interfaces/ErrorHandling/ErrorMatcher'

{
  isError && (
    <ErrorMatcher title="Failed to load tables" error={error} supportFormParams={{ projectRef }} />
  )
}
```

Pass the full `error` object from React Query — not `error.message`. This lets `ErrorMatcher` check the error class and show the right troubleshooting steps.

### Props

| Prop                | Type                            | Description                                                        |
| ------------------- | ------------------------------- | ------------------------------------------------------------------ |
| `title`             | `string`                        | Displayed in the error card header. Set by the caller.             |
| `error`             | `string \| { message: string }` | The error from React Query (pass the full object, not `.message`). |
| `supportFormParams` | `Partial<SupportFormUrlKeys>`   | Typed params for the support form URL (projectRef, category…).     |
| `className`         | `string?`                       | Extra classes on the card.                                         |

`supportFormParams` is typed as `Partial<SupportFormUrlKeys>` — autocomplete shows all available fields (`projectRef`, `orgSlug`, `category`, `subject`, `message`, `error`, `sid`). The URL is built by `createSupportFormUrl()` from `SupportForm.utils.tsx`.

## Adding a new error mapping

**1. Add the error class to `lib/errors/studio-errors.ts`**

```ts
// Pick the tag, fault, retryability and default reason for the new class
export class YourError extends studioError('YourError', {
  fault: 'user',
  classifiedBy: 'rule',
  defaultReason: 'your_error',
  retryable: () => false,
}) {}

export type ClassifiedError = ConnectionTimeoutError | YourError
```

Add the class to the `StudioError` union and `STUDIO_ERROR_TAGS` in the same file and to `ERROR_ROUTING` in `lib/errors/error-routing.ts`; typecheck fails until all three are updated.

**2. Add a pattern entry to `data/error-patterns.ts`**

```ts
import { YourError } from '@/lib/errors/studio-errors'

export const ERROR_PATTERNS: ErrorPattern[] = [
  // existing...
  {
    pattern: /YOUR_ERROR_PATTERN/i,
    ErrorClass: YourError,
  },
]
```

`handleError` picks this up automatically — any matching API error will be thrown as a `YourError` instance.

**3. Create `errorMappings/YourError.tsx`**

```tsx
import { SIDEBAR_KEYS } from 'components/layouts/ProjectLayout/LayoutSidebar/LayoutSidebarProvider'
import { useAiAssistantStateSnapshot } from 'state/ai-assistant-state'
import { useSidebarManagerSnapshot } from 'state/sidebar-manager-state'

import { TroubleshootingAccordion } from '../TroubleshootingAccordion'
import {
  FixWithAITroubleshootingSection,
  TroubleshootingGuideSection,
} from '../TroubleshootingSections'
import { DOCS_URL } from '@/lib/constants'

const ERROR_TYPE = 'your-error'
const BUILD_PROMPT = () => `Describe the issue for the AI assistant.`

export function YourErrorTroubleshooting() {
  const { openSidebar } = useSidebarManagerSnapshot()
  const aiSnap = useAiAssistantStateSnapshot()

  return (
    <TroubleshootingAccordion
      errorType={ERROR_TYPE}
      stepTitles={{ 1: 'Troubleshooting guide', 2: 'Debug with AI' }}
    >
      <TroubleshootingGuideSection
        number={1}
        errorType={ERROR_TYPE}
        href={`${DOCS_URL}/guides/...`}
      />
      <FixWithAITroubleshootingSection
        number={2}
        errorType={ERROR_TYPE}
        buildPrompt={BUILD_PROMPT}
        onDebugWithAI={(prompt) => {
          openSidebar(SIDEBAR_KEYS.AI_ASSISTANT)
          aiSnap.newChat({ initialMessage: prompt })
        }}
      />
    </TroubleshootingAccordion>
  )
}
```

**4. Add it to `error-mappings.tsx`**

```tsx
import { YourErrorTroubleshooting } from './errorMappings/YourError'
import { YourError } from '@/lib/errors/studio-errors'

// Add 'your-error' to the ErrorMappingId union, then:
export const ERROR_MAPPINGS = new Map<ErrorConstructor, ErrorMapping>([
  // existing...
  [YourError, { id: 'your-error', Troubleshooting: YourErrorTroubleshooting }],
])
```

That's it. `ErrorMatcher` picks it up automatically.

## Available section components

| Component                               | Props                                                   |
| --------------------------------------- | ------------------------------------------------------- |
| `RestartDatabaseTroubleshootingSection` | `number`, `errorType`, `onRestartProject?`              |
| `TroubleshootingGuideSection`           | `number`, `errorType`, `href`, `title?`, `description?` |
| `FixWithAITroubleshootingSection`       | `number`, `errorType`, `buildPrompt`, `onDebugWithAI?`  |
