<!--
  GENERATED FILE — DO NOT EDIT.

  Source of truth: the Studio skills in .claude/skills/ (listed below).
  Regenerate with: pnpm sync:guidelines
  CI fails if this file drifts from the skills (studio-guidelines-sync workflow).

  This file exists so CodeRabbit applies the Studio conventions when reviewing
  apps/studio code. CodeRabbit auto-detects **/AGENTS.md and scopes it to this
  directory tree. Claude Code does not read AGENTS.md and uses the skills directly.
-->

# Studio Code Review Guidelines

Conventions for `apps/studio` code, compiled from the Studio skills. Apply these
when reviewing changes under `apps/studio/`.

<!-- source: .claude/skills/studio-best-practices/SKILL.md -->

# Studio Best Practices

Applies to `apps/studio/**/*.{ts,tsx}`.

## Boolean Naming

Use descriptive prefixes — derive from existing state rather than storing separately:

- `is` — state/identity: `isLoading`, `isPaused`, `isNewRecord`
- `has` — possession: `hasPermission`, `hasData`
- `can` — capability: `canUpdateColumns`, `canDelete`
- `should` — conditional behavior: `shouldFetch`, `shouldRender`

Extract complex conditions into named variables:

```tsx
// ❌ inline multi-condition
{
  !isSchemaLocked && isTableLike(selectedTable) && canUpdateColumns && !isLoading && <Button />
}

// ✅ named variable
const canShowAddButton =
  !isSchemaLocked && isTableLike(selectedTable) && canUpdateColumns && !isLoading
{
  canShowAddButton && <Button />
}
```

Derive booleans — don't store them:

```tsx
// ❌ stored derived state
const [isFormValid, setIsFormValid] = useState(false)
useEffect(() => {
  setIsFormValid(name.length > 0 && email.includes('@'))
}, [name, email])

// ✅ derived
const isFormValid = name.length > 0 && email.includes('@')
```

## Component Structure

See `vercel-composition-patterns` skill for compound component and composition patterns.

Keep components under 200–300 lines. Split when you see:

- Multiple distinct UI sections
- Complex conditional rendering
- Multiple unrelated `useState` calls
- Hard to understand at a glance

Co-locate sub-components in the same directory as the parent. Avoid barrel re-export files.

Extract repeated JSX patterns into small components.

## Data Fetching

All data fetching uses TanStack Query (React Query). See `studio-queries` skill for query/mutation patterns and `studio-error-handling` skill for error display conventions.

### Loading / Error / Success Pattern

Top level:

```tsx
const { data, error, isLoading, isError, isSuccess } = useQuery(...)

if (isLoading) return <GenericSkeletonLoader />
if (isError) return <AlertError error={error} subject="Failed to load data" />
if (isSuccess && data.length === 0) return <EmptyState />
return <DataDisplay data={data} />
```

Use early returns — avoid deeply nested conditionals.

Inline:

```tsx
<div>
  {isLoading && <InlineLoader />}
  {isError && <InlineError error={error} />}
  {isSuccess && data.length === 0 && <EmptyState />}
  {isSuccess && data.length > 0 && <DataDisplay data={data} />}
</div>
```

## State Management

Keep state as local as possible; lift only when needed.

Group related form state with `react-hook-form` rather than multiple `useState` calls. See `studio-ui-patterns` skill for form layout and component conventions.

```tsx
// ❌ multiple related useState
const [name, setName] = useState('')
const [email, setEmail] = useState('')

// ✅ grouped with react-hook-form
const form = useForm<FormValues>({ defaultValues: { name: '', email: '' } })
```

## Custom Hooks

Extract complex or reusable logic into hooks. Return objects, not arrays:

```tsx
// ❌ array return (hard to extend)
return [value, toggle]

// ✅ object return
return { value, toggle, setTrue, setFalse }
```

## Event Handlers

- Prop callbacks: `on` prefix (`onClose`, `onSave`)
- Internal handlers: `handle` prefix (`handleSubmit`, `handleCancel`)

Use `useCallback` for handlers passed to memoized children; avoid unnecessary inline arrow functions.

## Conditional Rendering

```tsx
// Simple show/hide
<>{isVisible && <Component />}</>

// Binary choice
<>{isLoading ? <Spinner /> : <Content />}</>

// Multiple conditions — use early returns, not nested ternaries
if (isLoading) return <Spinner />
if (isError) return <Error />
return <Content />
```

## Performance

`useMemo` for genuinely expensive computations (measured, not assumed). Don't wrap everything — only optimize when you have a measured problem or are passing values to memoized children.

## TypeScript

Define prop interfaces explicitly. Use discriminated unions for complex state:

```tsx
type AsyncState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: Error }
```

Avoid `as any` / `as Type` casts. Validate at boundaries with zod:

```tsx
// ❌ type cast
const user = apiResponse as User

// ✅ zod parse
const user = userSchema.parse(apiResponse)
// or safe:
const result = userSchema.safeParse(apiResponse)
```

## Testing

Extract logic into `.utils.ts` pure functions and test exhaustively. See the `studio-testing` skill for the full testing strategy and decision tree.

---

<!-- source: .claude/skills/studio-ui-patterns/SKILL.md -->

# Studio UI Patterns

The Design System docs and demos are the source of truth. Always check the relevant
demo file before composing new UI.

## Layout

Docs: `apps/design-system/content/docs/ui-patterns/layout.mdx`

Build pages with `PageContainer`, `PageHeader`, and `PageSection`.

| Content type      | `size`      |
| ----------------- | ----------- |
| Settings / config | `"default"` |
| Lists / tables    | `"large"`   |
| Full-screen views | `"full"`    |

- If filters/search exist on a list page, align table actions with the filters (don't use `PageHeaderAside`/`PageSectionAside` for those actions)
- If no filters, actions can go in `PageHeaderAside` or `PageSectionAside`

Demos: `page-layout-settings.tsx`, `page-layout-list.tsx`, `page-layout-list-simple.tsx`, `page-layout-detail.tsx`
(all in `apps/design-system/registry/default/example/`)

## Forms

Docs: `apps/design-system/content/docs/ui-patterns/forms.mdx`

- Use `react-hook-form` + `zod`
- Use `FormItemLayout` instead of manually composing `FormItem`/`FormLabel`/`FormMessage`/`FormDescription`
- Wrap inputs with `FormControl`; use `_Shadcn_` imports from `ui` for primitives

Layout selection:

| Context                                    | Layout                                     | Container                                                  |
| ------------------------------------------ | ------------------------------------------ | ---------------------------------------------------------- |
| Page (settings/config)                     | `FormItemLayout layout="flex-row-reverse"` | `Card` (`CardContent` per field; `CardFooter` for actions) |
| Side panel — wide                          | `FormItemLayout layout="horizontal"`       | `SheetSection`                                             |
| Side panel — narrow (`size="sm"` or below) | `FormItemLayout layout="vertical"`         | `SheetSection`                                             |

Dirty state / submit:

- Destructure `isDirty` from `form.formState` to show Cancel and disable Save
- Show loading on submit button via `loading` prop
- If submit button is outside `<form>`, set a stable `formId` and use `form` prop on the button

Demos: `form-patterns-pagelayout.tsx`, `form-patterns-sidepanel.tsx`

## Tables

Docs: `apps/design-system/content/docs/ui-patterns/tables.mdx`

| Pattern    | Use when                                                                |
| ---------- | ----------------------------------------------------------------------- |
| `Table`    | Simple, static, semantic display                                        |
| Data Table | TanStack-powered; sorting, filtering, pagination; composed per use-case |
| Data Grid  | Virtualization, column resizing, or complex cell editing                |

- Actions: above the table, aligned right
- Search/filters: above the table, aligned left
- If table is primary content with no filters, actions can live in the page's primary/secondary actions area

Demos: `table-demo.tsx`, `data-table-demo.tsx`, `data-grid-demo.tsx`

## Charts

Docs: `apps/design-system/content/docs/ui-patterns/charts.mdx`

- Use provided chart building blocks; avoid passing raw Recharts components to `ChartContent`
- Use `useChart` context flags for loading/disabled states
- Keep composition straightforward — avoid over-abstraction

Demos (in `apps/design-system/__registry__/default/block/`): `chart-composed-demo.tsx`, `chart-composed-basic.tsx`, `chart-composed-states.tsx`, `chart-composed-metrics.tsx`, `chart-composed-actions.tsx`, `chart-composed-table.tsx`

## Empty States

Docs: `apps/design-system/content/docs/ui-patterns/empty-states.mdx`

| Scenario                 | Pattern                                                             |
| ------------------------ | ------------------------------------------------------------------- |
| Initial / onboarding     | Presentational empty state with value prop + clear next action      |
| Data-heavy lists         | Informational empty state matching the list/table layout            |
| Zero results from search | Keep layout consistent with data state to avoid jarring transitions |
| Missing route            | Centered `Admonition`                                               |

Demos: `empty-state-presentational-icon.tsx`, `empty-state-initial-state-informational.tsx`, `empty-state-zero-items-table.tsx`, `data-grid-empty-state.tsx`, `empty-state-missing-route.tsx`

## Navigation

Docs: `apps/design-system/content/docs/ui-patterns/navigation.mdx`

- Use `NavMenu` for a horizontal list of related views within a consistent page layout
- Activating an item must trigger a **URL change** — no local-only tab state

## Cards

- Group related information in cards
- `CardContent` for sections, `CardFooter` for actions
- Only use `CardHeader`/`CardTitle` when context isn't already provided by surrounding content
- Use headers/titles when multiple cards represent distinct groups (e.g. multiple settings sections)

## Alerts

- Use `Admonition` to call out important actions, restrictions, or critical context
- Place at the **top of a page's content** (below page title) or **top of the relevant section** (below section title)
- Use sparingly

## Sheets (Side Panels)

Use a `Sheet` when switching pages would be disruptive and the user needs to maintain context (e.g. selecting a row from a list to edit).

Structure:

- `SheetContent` with `size="lg"` for forms needing horizontal layout
- Use `SheetHeader`, `SheetTitle`, `SheetSection`, `SheetFooter`
- Submit/cancel actions go in `SheetFooter`

Forms in sheets:

- `layout="horizontal"` for wider sheets
- `layout="vertical"` for narrow sheets (`size="sm"` or below)

---

<!-- source: .claude/skills/vercel-composition-patterns/SKILL.md -->

# React Composition Patterns

Composition patterns for building flexible, maintainable React components. Avoid
boolean prop proliferation by using compound components, lifting state, and
composing internals. These patterns make codebases easier for both humans and AI
agents to work with as they scale.

## When to Apply

Reference these guidelines when:

- Refactoring components with many boolean props
- Building reusable component libraries
- Designing flexible component APIs
- Reviewing component architecture
- Working with compound components or context providers

## Rule Categories by Priority

| Priority | Category                | Impact | Prefix          |
| -------- | ----------------------- | ------ | --------------- |
| 1        | Component Architecture  | HIGH   | `architecture-` |
| 2        | State Management        | MEDIUM | `state-`        |
| 3        | Implementation Patterns | MEDIUM | `patterns-`     |
| 4        | React 19 APIs           | MEDIUM | `react19-`      |

## Quick Reference

### 1. Component Architecture (HIGH)

- `architecture-avoid-boolean-props` - Don't add boolean props to customize
  behavior; use composition
- `architecture-compound-components` - Structure complex components with shared
  context

### 2. State Management (MEDIUM)

- `state-decouple-implementation` - Provider is the only place that knows how
  state is managed
- `state-context-interface` - Define generic interface with state, actions, meta
  for dependency injection
- `state-lift-state` - Move state into provider components for sibling access

### 3. Implementation Patterns (MEDIUM)

- `patterns-explicit-variants` - Create explicit variant components instead of
  boolean modes
- `patterns-children-over-render-props` - Use children for composition instead
  of renderX props

### 4. React 19 APIs (MEDIUM)

> **⚠️ React 19+ only.** Skip these patterns if you're on React 18 or earlier.

- `react19-no-forwardref` - Don't use `forwardRef`; use `use()` instead of `useContext()`

## How to Use

Read individual rule files for detailed explanations and code examples:

```
rules/architecture-avoid-boolean-props.md
rules/state-context-interface.md
```

Each rule file contains:

- Brief explanation of why it matters
- Incorrect code example with explanation
- Correct code example with explanation
- Additional context and references

## Full Compiled Document

For the complete guide with all rules expanded: `AGENTS.md`

---

<!-- source: .claude/skills/studio-queries/SKILL.md -->

# Studio Queries & Mutations (React Query)

Follow the patterns in `apps/studio/data/`. Reference examples:

- Query options: `apps/studio/data/table-editor/table-editor-query.ts`
- Mutation hook: `apps/studio/data/edge-functions/edge-functions-update-mutation.ts`
- Keys: `apps/studio/data/edge-functions/keys.ts`

## Query Keys

Define a `keys.ts` per domain. Export `*Keys` helpers using array keys with `as const`. Never inline query keys in components.

```ts
export const edgeFunctionsKeys = {
  list: (projectRef: string | undefined) => ['projects', projectRef, 'edge-functions'] as const,
  detail: (projectRef: string | undefined, slug: string | undefined) =>
    ['projects', projectRef, 'edge-function', slug, 'detail'] as const,
}
```

## Query Options (preferred pattern)

Use `queryOptions` from `@tanstack/react-query`. This gives type safety and works with both `useQuery()` and `queryClient.fetchQuery()`.

Rules:

- Export `XVariables`, `XData`, and `XError` types (prefixed with the domain name)
- Implement a **private** `getX(variables, signal?)` function:
  - Throws if required variables are missing
  - Passes `signal` for cancellation
  - Calls `handleError(error)` on failure (which throws); returns `data` on success
  - Not exported — use `queryClient.fetchQuery(xQueryOptions(...))` for imperative fetching
- Export `xQueryOptions()` using `queryOptions`
- Gate with `enabled` so the query doesn't run until required variables exist
- Platform-only queries: include `IS_PLATFORM` from `lib/constants` in `enabled`
- Don't add extra params to `xQueryOptions` — callers override by destructuring: `{ ...xQueryOptions(vars), enabled: true }`

```ts
import { queryOptions } from '@tanstack/react-query'

import { xKeys } from './keys'
import { get, handleError } from '@/data/fetchers'
import { IS_PLATFORM } from '@/lib/constants'
import { ResponseError } from '@/types'

export type XVariables = { projectRef?: string }
export type XError = ResponseError

async function getX({ projectRef }: XVariables, signal?: AbortSignal) {
  if (!projectRef) throw new Error('projectRef is required')
  const { data, error } = await get('/v1/projects/{ref}/x', {
    params: { path: { ref: projectRef } },
    signal,
  })
  if (error) handleError(error)
  return data
}

export type XData = Awaited<ReturnType<typeof getX>>

export const xQueryOptions = ({ projectRef }: XVariables) =>
  queryOptions({
    queryKey: xKeys.list(projectRef),
    queryFn: ({ signal }) => getX({ projectRef }, signal),
    enabled: IS_PLATFORM && typeof projectRef !== 'undefined',
  })
```

## Using Query Options in Components

```ts
import { useQuery } from '@tanstack/react-query'

import { xQueryOptions } from '@/data/x/x-query'

const { data, isPending, isError } = useQuery(xQueryOptions({ projectRef: project?.ref }))
```

## Imperative Fetching (outside React or in callbacks)

```ts
const queryClient = useQueryClient()
const { data: project } = useSelectedProjectQuery()

const handleClick = useCallback(
  async (id: number) => {
    const data = await queryClient.fetchQuery(xQueryOptions({ id, projectRef: project?.ref }))
    // use data...
  },
  [project?.ref, queryClient]
)
```

## Mutation Hook

- Export a `Variables` type with `projectRef`, identifiers, and `payload`
- Implement a private `updateX(vars)` function with required variable validation and `handleError`
- Wrap in `useXMutation()`:
  - Accepts `UseMutationOptions` (omit `mutationFn`)
  - Invalidates `list()` + `detail()` keys in `onSuccess` with `await Promise.all([...])`
  - Defaults to `toast.error(...)` when `onError` isn't provided

```ts
import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'

import { xKeys } from './keys'

type XUpdateVariables = { projectRef: string; slug: string; payload: XPayload }

export const useXUpdateMutation = ({
  onSuccess,
  onError,
  ...options
}: UseMutationOptions<XData, XError, XUpdateVariables> = {}) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateX,
    async onSuccess(data, variables, context) {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: xKeys.detail(variables.projectRef, variables.slug),
        }),
        queryClient.invalidateQueries({ queryKey: xKeys.list(variables.projectRef) }),
      ])
      await onSuccess?.(data, variables, context)
    },
    async onError(error, variables, context) {
      if (onError === undefined) toast.error(`Failed to update: ${error.message}`)
      else onError(error, variables, context)
    },
    ...options,
  })
}
```

## Component Usage

- Use React Query v5 flags: `isPending` for initial load, `isFetching` for background refetches
- Render states explicitly in order: pending → error → success

---

<!-- source: .claude/skills/studio-error-handling/SKILL.md -->

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
