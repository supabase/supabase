---
name: use-static-effect-event
description: useStaticEffectEvent hook in Supabase Studio — a userland polyfill for
  React's useEffectEvent. Use when you need to read latest state/props inside a useEffect
  without re-triggering it, or when stale closures in Effects are causing bugs.
---

# useStaticEffectEvent

Located at `apps/studio/hooks/useStaticEffectEvent.ts`.

A userland polyfill for React's `useEffectEvent` (stable in React 19.2). It solves the stale closure problem: gives you a **stable callback** that always reads the latest props/state without those values triggering Effect re-runs.

## The Problem It Solves

Without it, you face two bad options inside `useEffect`:

1. **Add values to dependencies** → unnecessary Effect re-runs (teardown/reconnect)
2. **Omit from dependencies** → stale closure bugs (outdated values)

```tsx
// Problem: re-runs every time `theme` changes, even though we only
// want to reconnect when `roomId` changes
useEffect(() => {
  const connection = createConnection(roomId)
  connection.on('connected', () => {
    showNotification('Connected!', theme) // theme causes unwanted reconnects
  })
  return () => connection.disconnect()
}, [roomId, theme])
```

## When to Use

1. Read latest state/props inside an Effect without re-triggering it
2. Create stable callbacks that always use current values
3. Avoid stale closures in event handlers used within Effects

### Pattern 1: Sync data without re-running on every change

```tsx
const syncApiPrivileges = useStaticEffectEvent(() => {
  if (hasLoadedInitialData.current) return
  if (!apiAccessStatus.isSuccess) return
  if (!privilegesForTable) return

  hasLoadedInitialData.current = true
  setPrivileges(privilegesForTable.privileges)
})

useEffect(() => {
  syncApiPrivileges()
}, [apiAccessStatus.status, syncApiPrivileges])
```

### Pattern 2: Stable callbacks for async operations

```tsx
const exportInternal = useStaticEffectEvent(
  async ({ bypassConfirmation }: { bypassConfirmation: boolean }) => {
    if (!params.enabled) return
    const { projectRef, connectionString, entity, totalRows } = params
    // complex async logic using latest params
  }
)

// Stable reference — safe to use in useCallback
const exportInDesiredFormat = useCallback(
  () => exportInternal({ bypassConfirmation: false }),
  [exportInternal]
)
```

### Pattern 3: Infinite scroll / pagination triggers

```tsx
const fetchNext = useStaticEffectEvent(() => {
  if (lastItem && lastItem.index >= items.length - 1 && hasNextPage && !isFetchingNextPage) {
    fetchNextPage()
  }
})

useEffect(fetchNext, [lastItem, fetchNext])
```

## When NOT to Use

**Don't use it to hide legitimate dependencies:**

```tsx
// ❌ Bad — roomId IS a legitimate dependency; this hides a bug
const connect = useStaticEffectEvent(() => {
  const connection = createConnection(roomId)
  connection.connect()
})
useEffect(() => {
  connect()
}, [connect]) // Won't reconnect when roomId changes!

// ✅ roomId belongs in deps
useEffect(() => {
  const connection = createConnection(roomId)
  connection.connect()
  return () => connection.disconnect()
}, [roomId])
```

**Don't use it for simple event handlers outside Effects:**

```tsx
// ❌ Unnecessary — not used inside an Effect
const handleClick = useStaticEffectEvent(() => console.log(count))

// ✅ Regular function is fine
const handleClick = () => console.log(count)
```

## Rules

1. Only call the returned function **inside Effects** (`useEffect`, `useLayoutEffect`)
2. Don't pass it to other components or hooks as a callback prop
3. Use for **non-reactive logic only** — reads values but shouldn't trigger re-runs
4. **Include it in dependency arrays** when used in `useEffect` (it's stable, won't cause re-runs)

## How It Works

```tsx
export const useStaticEffectEvent = <Callback extends Function>(callback: Callback) => {
  const callbackRef = useRef(callback)

  useLayoutEffect(() => {
    callbackRef.current = callback // always latest
  })

  const eventFn = useCallback((...args: any) => {
    return callbackRef.current(...args)
  }, []) // stable reference

  return eventFn as unknown as Callback
}
```
