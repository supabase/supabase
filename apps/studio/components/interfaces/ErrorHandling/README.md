# Error Handling

`ErrorMatcher` displays a typed API error. If the error was classified by `handleError` (i.e. it is an instance of a known error class), it shows matching troubleshooting steps. Otherwise it shows a generic error card.

Classification happens in the data layer — `handleError` in `data/fetchers.ts` matches the error message against patterns and throws the appropriate error class (e.g. `ConnectionTimeoutError`). The component never does regex matching itself.

## Error model

Every error `handleError` throws is an Effect `Data.TaggedError` (still `instanceof Error`) defined in `lib/errors/studio-errors.ts`. Each carries:

- `_tag` — `RequestAborted`, `NetworkUnreachable`, `MalformedResponse`, `PlatformError`, `UnclassifiedApiError`, `DbConnectionTimeout`, `UserSqlError`, `StudioSqlError`, `UnexpectedError`.
- `fault` (`user | platform | third_party | studio`), `reason` (a snake_case slug typed per class as a literal union, so a mistyped one fails typecheck), `classifiedBy` (`rule | default`), `retryable`, `service`, plus the legacy fields `message`, `code`, `requestId`, `retryAfter`, `endpoint`, `method`, `queryName`, `metadata`, `formattedError`.

Use `isStudioError(e)` (not `instanceof`) to check for any of them. `StudioError` is the union type of all Studio errors (a type only, not a class). Both entry points live in `data/error-classification`: `classifyResponseError` for errors that come back from an API request Studio sent (a response with a status and body), and `classifyError` for everything else. `handleError` picks between them. Don't build non-API errors with `classifyResponseError` and a made-up status; use `classifyError` or a specific class.

`readResponseError` in the same file is the single place that turns an HTTP error response (status, headers, body text) into the raw fields classification reads. The openapi-fetch middleware and the `fetchGet`/`fetchPost`/`fetchHeadWithTimeout` helpers both use it, and `handleError` validates the result with `parseResponseErrorBody`. A non-JSON body (an HTML error page, say) yields no message, so the error is classified by status.

Default rules in `data/error-classification.ts` (`classifyResponseError`): a matching `ERROR_PATTERNS` entry wins (`rule`); otherwise 5xx is `PlatformError`, 4xx is `UnclassifiedApiError` (reason from status), and anything without a status is `UnexpectedError`. Everything else goes through `classifyError`, which knows nothing about API bodies: an already-tagged error passes through; `AbortError` is `RequestAborted`; a `TypeError` is `NetworkUnreachable` only when its message is a browser fetch-failure message (`Failed to fetch`, `NetworkError when attempting to fetch resource`, `Load failed`, `Network request failed`). Any other `TypeError` is a bug in our code and becomes `UnexpectedError` (`studio`).

**SQL errors.** `executeSql` passes errors from the pg-meta query endpoint through `classifySqlResponseError`, including for callers with a custom `handleError`. A 400 there means Postgres rejected the SQL, and the class depends on who wrote it, set by the required `sqlOrigin` option. Studio SQL also requires a static `queryName`.

- `UserSqlError` (`user`, reason `user_sql`): SQL the user or an AI agent wrote, in whole or in part (SQL editor, AI tools, policy and function editors). Never sent to Sentry: routing is `SAMPLE_NEVER`, `alwaysCapture` doesn't override it, and `beforeSend` drops it even when an integration captures it directly. Use `isNeverReportedError` to check.
- `StudioSqlError` (`studio`, reason `studio_sql`): SQL Studio wrote. Its fault is `user`, with reason `user_input`, when the caller passed `isUserFaultSqlState` and it accepts the error's SQLSTATE (below). The Postgres message can still contain user data (row values in a constraint violation, say), so Sentry gets only `sentryMessage`, built from the SQLSTATE and the query name. `executeSql` requires a static `queryName` (e.g. `table-rows`) whenever `sqlOrigin` is `'studio'`; the query key is never reported, since its segments can hold user data (IDs, schemas, search terms). Events carry `query_name` and `sql_state` tags and are grouped by both.

**User-fault SQLSTATEs.** Studio SQL that embeds user input can fail because of that input. The caller passes `isUserFaultSqlState` (a predicate on the SQLSTATE) to `executeSql`, and `classifySqlResponseError` returns a `StudioSqlError` with reason `user_input` and fault `user` when it returns true; otherwise it stays `studio_sql` / `studio`. `data/error-classification.ts` has two predicates, which callers can compose:

- `isUserFaultForValues`: SQL that embeds values the user typed. Class 22 (bad values), class 23 (integrity constraints), `42501` (insufficient privilege, e.g. under RLS or role impersonation), class `P0` (raised by the user's PL/pgSQL functions and triggers) and `57014` (statement timeout or cancel). Used by the table editor rows and count queries when filters are set, row create, row update, the batched operation queue save, and cron job create and update (the command is a string literal pg_cron doesn't parse).
- `isUserFaultForSql`: SQL that embeds user-written SQL Postgres parses or runs. Any SQLSTATE except the classes that describe the server: `08`, `53`, `57` other than `57014`, `58` and `XX`. Used by policy and function create and update, the customize access token hook call, and statements read from `pg_stat_statements` (Query Insights `EXPLAIN`, the index advisor) via `isUserFaultForStatsStatement`, which also excludes `42P02` because `pg_stat_statements` replaces literals with `$1`.

The class still decides privacy (it is a `StudioSqlError`, so Sentry gets only the redacted message); the fault only lowers its sample rate (see routing below).

Both keep the full Postgres `message`, `formattedError` and `position` on the error for the UI. Pattern rules (e.g. connection timeouts) and other statuses keep their usual classes.

**Privacy rules for Sentry events** live in `applyStudioErrorPolicy` (`lib/errors/sentry-event-policy.ts`), called from `beforeSend` on the client (`lib/sentry-client-options.ts`) and the server (`lib/sentry-server-options.ts`, shared by the Next and TanStack builds), so they apply however the error was captured. A class whose message can contain user data sets `sentryMessage` in its `studioError` config; the policy replaces every exception value in the event with it.

**Routing: the class decides privacy, and `ERROR_ROUTING` gives the rate for each tag and fault.** `UserSqlError` is never sent (`isNeverReportedError`; not even with `force`), and `StudioSqlError` is sent with its message redacted. `ERROR_ROUTING` in `lib/errors/error-routing.ts` maps each tag to the faults that class can have (typecheck fails until a new tag or fault is routed), and each entry is `{ sentrySampleRate }`, a 0-1 rate from `SAMPLE_NEVER` (0), `SAMPLE_USER_FAULT` (user faults: a trickle that catches misclassification and Studio bugs hiding in them), `SAMPLE_OTHER` (faults owned by other teams), `SAMPLE_OWNED` (faults Studio owns) or `SAMPLE_ALWAYS` (1). `getErrorRouting(error)` looks the entry up. Set the rates with the public env vars `NEXT_PUBLIC_SENTRY_SAMPLE_RATE_OTHER`, `NEXT_PUBLIC_SENTRY_SAMPLE_RATE_OWNED` and `NEXT_PUBLIC_SENTRY_SAMPLE_RATE_USER_FAULT` (defaults 0.1, 0.25 and 0.01; unset or out-of-range values use the default). `reportStudioError` (`lib/errors/report-studio-error.ts`) skips never-reported errors, then uses rate 1 when forced, else `getErrorRouting`, skips rate 0, tags the Sentry event with tag/fault/reason/service/endpoint and `sample_rate` (which `beforeSend` uses to drop events, and which lets you re-weight Sentry counts), and stores the event id on `err.errorEventId`. `handleError(error, { alwaysCapture: true })` reports at rate 1 regardless of routing. `errorEventId` may refer to an event that was sampled out.

**Empty bodies.** `normalizeEmptyBodyResponse` (`data/fetchers.ts`) runs in the openapi-fetch `onResponse` middleware. A successful `GET` with `Content-Type: application/json` whose body is still empty after recovery (the original body, then one cache-bypassing refetch) throws `MalformedResponseError` (reason `empty_body`) with the endpoint, method, request ID and status, instead of resolving with `{}`. The call rejects, like a network failure, so `const { data, error } = await get(...)` never sees it and `handleError` isn't involved: React Query gets the tagged instance and `reportQueryError` reports it once after the last retry. The refetch diagnostics (probe status, body length, response headers) are attached through the same deferred Sentry context `handleError` uses. Empty bodies that recover aren't reported. `MalformedResponse` is routed at `SAMPLE_ALWAYS`: it is rare, and every unrecovered case is worth seeing. 204s, `HEAD`, non-`GET` requests and empty non-JSON responses keep the `Content-Length: 0` normalization and don't throw. Callers outside React Query don't get reported automatically; catch and call `reportStudioError`.

**When reporting happens.** `handleError` classifies and throws without reporting; it remembers `sentryContext` and `alwaysCapture` for the error instance. The `QueryCache` and `MutationCache` in `data/query-client.ts` call `reportQueryError` from their `onError`, which runs once per failed fetch after the last retry (so retries produce one Sentry event, not one per attempt). Callers outside React Query (plain functions, event handlers, server code) pass `handleError(error, { reportImmediately: true })` to report right away.

**In `AlertError`.** `getErrorPresentation` (`components/ui/AlertError.utils.ts`) picks defaults by tag and fault; props the caller passes still win. A Studio error shows `requestId`, `errorEventId` (labeled "before sampling") and a "Copy details" button. `formatErrorDetails` builds the text: it excludes `formattedError`, `metadata`, `cause` and SQL, and for `UserSqlError`/`StudioSqlError` it leaves out the message and copies the SQLSTATE, position and query name. An error with fault `user` (`isUserError`, which is separate from `isNeverReportedError`: one is about who can fix the error, the other about Sentry) shows its message with "Please try again. If the issue persists, try refreshing your browser." and no support link, IDs or copy button. `NetworkUnreachable` with reason `offline` (set by `classifyError` when `navigator.onLine` is false) instead shows only "You may be temporarily offline. Check your internet connection and try again." `errorEventId` is set in the cache's `onError`, which runs synchronously right after the error state is dispatched; observers are notified on a later `setTimeout(0)`, so the first render with the error already has it.

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
// Pick the tag, fault, retryability and reasons for the new class
export class YourError extends studioError('YourError', {
  fault: 'user',
  classifiedBy: 'rule',
  reasons: ['your_error'], // the reasons this class can have; the first is the default
  retryable: () => false,
}) {}

export type ClassifiedError = ConnectionTimeoutError | YourError
```

Add the class to the `StudioError` union and `STUDIO_ERROR_TAGS` in the same file and to `ERROR_ROUTING` in `lib/errors/error-routing.ts` (one entry per fault the class can have); typecheck fails until all three are updated.

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
