---
description: "Studio: React and TypeScript best practices for maintainable Studio code"
globs:
  - apps/studio/**/*.{ts,tsx}
alwaysApply: false
---

# Studio Best Practices

## Boolean Handling

### Assign complex conditions to descriptive variables

When you have multiple conditions in a single expression, extract them into well-named boolean variables. This improves readability and makes the code self-documenting.

```tsx
// ❌ Bad - complex inline condition
{
  !isSchemaLocked && isTableLike(selectedTable) && canUpdateColumns && !isLoading && (
    <Button onClick={onAddColumn}>New column</Button>
  )
}

// ✅ Good - extract to descriptive variables
const isTableEntity = isTableLike(selectedTable)
const canShowAddButton = !isSchemaLocked && isTableEntity && canUpdateColumns && !isLoading

{
  canShowAddButton && <Button onClick={onAddColumn}>New column</Button>
}
```

### Use consistent naming conventions for booleans

- Use `is` prefix for state/identity: `isLoading`, `isPaused`, `isNewRecord`, `isError`
- Use `has` prefix for possession: `hasPermission`, `hasShownModal`, `hasData`
- Use `can` prefix for capability/permission: `canUpdateColumns`, `canDelete`, `canEdit`
- Use `should` prefix for conditional behavior: `shouldFetch`, `shouldRender`, `shouldValidate`

```tsx
// ✅ Good examples from codebase
const isNewRecord = column === undefined
const isPaused = project?.status === PROJECT_STATUS.INACTIVE
const isMatureProject = dayjs(project?.inserted_at).isBefore(dayjs().subtract(10, 'day'))
const { can: canUpdateColumns } = useAsyncCheckPermissions(
  PermissionAction.TENANT_SQL_ADMIN_WRITE,
  'columns'
)
```

### Derive boolean state instead of storing it

When a boolean can be computed from existing state, derive it rather than storing it separately.

```tsx
// ❌ Bad - storing derived state
const [isFormValid, setIsFormValid] = useState(false)

useEffect(() => {
  setIsFormValid(name.length > 0 && email.includes('@'))
}, [name, email])

// ✅ Good - derive from existing state
const isFormValid = name.length > 0 && email.includes('@')
```

## Component Structure

### Break down large components

Components should ideally be under 200-300 lines. If a component grows larger, consider splitting it.

**Signs a component should be split:**

- Multiple distinct UI sections
- Complex conditional rendering logic
- Multiple useState hooks for unrelated state
- Difficult to understand at a glance

```tsx
// ❌ Bad - monolithic component with everything inline
const UserDashboard = () => {
  // 50 lines of hooks and state
  // 100 lines of handlers
  // 300 lines of JSX with nested conditions
}

// ✅ Good - split into focused sub-components
const UserDashboard = () => {
  return (
    <div>
      <UserHeader />
      <UserStats />
      <UserActivitySection />
      <UserSettingsPanel />
    </div>
  )
}
```

### Co-locate related components

Place sub-components in the same directory as the parent component. Avoid using barrel files (files that do nothing but re-export things from other files) for imports.

```
components/interfaces/Auth/Users/
├── UserPanel.tsx
├── UserOverview.tsx
├── UserLogs.tsx
├── Users.constants.ts
└── index.ts
```

### Extract repeated JSX patterns

If you find yourself copying similar JSX blocks, extract them into a component.

```tsx
// ❌ Bad - repeated pattern
<TabsTrigger_Shadcn_ value="overview" className="px-0 pb-0 h-full text-xs data-[state=active]:bg-transparent !shadow-none">
  Overview
</TabsTrigger_Shadcn_>
<TabsTrigger_Shadcn_ value="logs" className="px-0 pb-0 h-full text-xs data-[state=active]:bg-transparent !shadow-none">
  Logs
</TabsTrigger_Shadcn_>

// ✅ Good - extract to component
const PanelTab = ({ value, children }: { value: string; children: ReactNode }) => (
  <TabsTrigger_Shadcn_
    value={value}
    className="px-0 pb-0 h-full text-xs data-[state=active]:bg-transparent !shadow-none"
  >
    {children}
  </TabsTrigger_Shadcn_>
)
```

## Loading and Error States

### Use consistent loading/error/success pattern

Follow a consistent pattern for handling async states:

```tsx
const { data, error, isLoading, isError, isSuccess } = useQuery()

// Handle loading state first
if (isLoading) {
  return <GenericSkeletonLoader />
}

// Handle error state
if (isError) {
  return <AlertError error={error} subject="Failed to load data" />
}

// Handle empty state if needed
if (isSuccess && data.length === 0) {
  return <EmptyState />
}

// Render success state
return <DataDisplay data={data} />
```

### Use early returns for guard clauses

Prefer early returns over deeply nested conditionals:

```tsx
// ❌ Bad - deeply nested
const Component = () => {
  if (data) {
    if (!isError) {
      if (hasPermission) {
        return <ActualContent />
      }
    }
  }
  return null
}

// ✅ Good - early returns
const Component = () => {
  if (!data) return null
  if (isError) return <ErrorDisplay />
  if (!hasPermission) return <PermissionDenied />

  return <ActualContent />
}
```

## State Management

### Keep state as local as possible

Start with local state and lift up only when needed.

```tsx
// ✅ Good - state lives where it's used
const SearchableList = () => {
  const [filterString, setFilterString] = useState('')

  const filteredItems = items.filter((item) => item.name.includes(filterString))

  return (
    <div>
      <Input value={filterString} onChange={(e) => setFilterString(e.target.value)} />
      <List items={filteredItems} />
    </div>
  )
}
```

### Group related state with objects or reducers

When you have multiple related pieces of state, consider grouping them:

```tsx
// ❌ Bad - multiple related useState calls
const [name, setName] = useState('')
const [email, setEmail] = useState('')
const [phone, setPhone] = useState('')

// ✅ Good - grouped state for forms (use react-hook-form)
const form = useForm<FormValues>({
  defaultValues: { name: '', email: '', phone: '' },
})
```

## Custom Hooks

### Extract complex logic into custom hooks

When logic becomes reusable or complex, extract it:

```tsx
// ✅ Good - extracted to custom hook
export function useAsyncCheckPermissions(action: string, resource: string) {
  const { permissions, isLoading, isSuccess } = useGetProjectPermissions()

  const can = useMemo(() => {
    if (!IS_PLATFORM) return true
    if (!isSuccess || !permissions) return false
    return doPermissionsCheck(permissions, action, resource)
  }, [isSuccess, permissions, action, resource])

  return { isLoading, isSuccess, can }
}

// Usage
const { can: canUpdateColumns } = useAsyncCheckPermissions(
  PermissionAction.TENANT_SQL_ADMIN_WRITE,
  'columns'
)
```

### Return objects from hooks for better extensibility

```tsx
// ❌ Bad - returning array (hard to extend)
const useToggle = () => {
  const [value, setValue] = useState(false)
  return [value, () => setValue((v) => !v)]
}

// ✅ Good - returning object (easy to extend)
const useToggle = (initial = false) => {
  const [value, setValue] = useState(initial)
  return {
    value,
    toggle: () => setValue((v) => !v),
    setTrue: () => setValue(true),
    setFalse: () => setValue(false),
  }
}
```

## Event Handlers

### Name handlers consistently

Use `on` prefix for prop callbacks and `handle` prefix for internal handlers:

```tsx
interface Props {
  onClose: () => void // Callback prop
  onSave: (data: Data) => void
}

const Component = ({ onClose, onSave }: Props) => {
  const handleSubmit = () => {
    // Internal handler
    // process data
    onSave(data)
  }

  const handleCancel = () => {
    // cleanup
    onClose()
  }
}
```

### Avoid inline arrow functions for expensive operations

```tsx
// ❌ Bad - creates new function every render
<ExpensiveList items={items} onItemClick={(item) => handleItemClick(item)} />

// ✅ Good - stable reference with useCallback
const handleItemClick = useCallback(
  (item: Item) => {
    // handle click
  },
  [dependencies]
)

<ExpensiveList items={items} onItemClick={handleItemClick} />
```

## Conditional Rendering

### Use appropriate patterns for different scenarios

```tsx
// Simple show/hide - use &&
{
  isVisible && <Component />
}

// Binary choice - use ternary
{
  isLoading ? <Spinner /> : <Content />
}

// Multiple conditions - use early returns or extracted component
const StatusDisplay = ({ status }: { status: Status }) => {
  if (status === 'loading') return <Spinner />
  if (status === 'error') return <ErrorMessage />
  if (status === 'empty') return <EmptyState />
  return <DataDisplay />
}
```

### Avoid nested ternaries

```tsx
// ❌ Bad - nested ternary
{
  isLoading ? <Spinner /> : isError ? <Error /> : <Content />
}

// ✅ Good - separate conditions or early returns
if (isLoading) return <Spinner />
if (isError) return <Error />
return <Content />
```

## Performance

### Use useMemo for expensive computations

```tsx
// ✅ Good - memoize expensive filtering
const filteredItems = useMemo(
  () => items.filter((item) => item.name.toLowerCase().includes(searchQuery.toLowerCase())),
  [items, searchQuery]
)
```

### Avoid premature optimization

Don't wrap everything in useMemo/useCallback. Only optimize when:

- You have measured a performance problem
- The computation is genuinely expensive
- The value is passed to memoized children

## TypeScript

### Define prop interfaces explicitly

```tsx
interface UserCardProps {
  user: User
  onEdit: (user: User) => void
  onDelete: (userId: string) => void
  isEditable?: boolean
}

export const UserCard = ({ user, onEdit, onDelete, isEditable = true }: UserCardProps) => {
  // ...
}
```

### Use discriminated unions for complex state

```tsx
type AsyncState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: Error }
```

### Avoid type casting, prefer validation with zod

Never use type casting (e.g., `as any`, `as Type`). Instead, validate values at runtime using zod schemas. This ensures type safety and catches runtime errors.

```tsx
// ❌ Bad - type casting bypasses type checking
const user = apiResponse as User
const data = unknownValue as string

// ✅ Good - validate with zod schema
const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
})

const user = userSchema.parse(apiResponse)
const data = z.string().parse(unknownValue)

// ✅ Good - safe parsing with error handling
const result = userSchema.safeParse(apiResponse)
if (result.success) {
  const user = result.data
} else {
  // handle validation errors
}
```
