# Error Handling

`ErrorMatcher` displays a typed API error. If the error was classified by `handleError` (i.e. it is an instance of a known error class), it shows matching troubleshooting steps. Otherwise it shows a generic error card.

Classification happens in the data layer — `handleError` in `data/fetchers.ts` matches the error message against patterns and throws the appropriate error subclass (e.g. `ConnectionTimeoutError`). The component never does regex matching itself.

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
        href="https://supabase.com/docs/guides/..."
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

export const ERROR_MAPPINGS: Record<KnownErrorType, ErrorMapping> = {
  // existing...
  'your-error': {
    id: 'your-error',
    Troubleshooting: YourErrorTroubleshooting,
  },
}
```

That's it. `ErrorMatcher` picks it up automatically.

## Available section components

| Component                               | Props                                                   |
| --------------------------------------- | ------------------------------------------------------- |
| `RestartDatabaseTroubleshootingSection` | `number`, `errorType`, `onRestartProject?`              |
| `TroubleshootingGuideSection`           | `number`, `errorType`, `href`, `title?`, `description?` |
| `FixWithAITroubleshootingSection`       | `number`, `errorType`, `buildPrompt`, `onDebugWithAI?`  |
