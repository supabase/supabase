---
name: studio-best-practices
description: React and TypeScript best practices for Supabase Studio. Use when writing
  or reviewing Studio components — covers boolean naming, component structure, loading/error
  states, state management, custom hooks, event handlers, conditional rendering,
  performance, and TypeScript conventions.
---

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
