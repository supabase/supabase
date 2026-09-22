import { renderHook } from '@testing-library/react'
import { FeatureFlagContext } from 'common'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { PG_META_SCOPED_INTROSPECTION_FLAG } from '@/data/table-editor/table-editor-query'

const { mockIsPlatform } = vi.hoisted(() => ({ mockIsPlatform: { value: true } }))

vi.mock('@/lib/constants', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('@/lib/constants')
  return {
    ...actual,
    get IS_PLATFORM() {
      return mockIsPlatform.value
    },
  }
})

// Mirrors the real provider: `configcat` and `hasLoaded` flip together once
// `processFlags()` resolves -- an empty store (the pre-load default) is what
// makes `useFlag` read `false` before that.
function flagProvider(hasLoaded: boolean, flagValue = true) {
  const configcat: Record<string, boolean> = hasLoaded
    ? { [PG_META_SCOPED_INTROSPECTION_FLAG]: flagValue }
    : {}
  return function FlagProviderWrapper({ children }: { children: React.ReactNode }) {
    return (
      <FeatureFlagContext.Provider value={{ configcat, posthog: {}, hasLoaded }}>
        {children}
      </FeatureFlagContext.Provider>
    )
  }
}

describe('scoped-introspection', () => {
  // Module-level singleton state -- start every test from a fresh module
  // instance so the ready-promise isn't already settled from a prior test.
  let mod: typeof import('./scoped-introspection')

  beforeEach(async () => {
    mockIsPlatform.value = true
    vi.resetModules()
    mod = await import('./scoped-introspection')
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  test('isScopedIntrospection defaults to false', () => {
    expect(mod.isScopedIntrospection()).toBe(false)
  })

  test('setScopedIntrospection updates the accessor', () => {
    mod.setScopedIntrospection(true)
    expect(mod.isScopedIntrospection()).toBe(true)
  })

  test('scopedIntrospectionReady stays pending until a loaded flag store hydrates it', async () => {
    let settled = false
    mod.scopedIntrospectionReady().then(() => {
      settled = true
    })

    const { unmount } = renderHook(() => mod.useSyncScopedIntrospection(), {
      wrapper: flagProvider(false),
    })
    await Promise.resolve()
    expect(settled).toBe(false)
    expect(mod.isScopedIntrospection()).toBe(false) // useFlag reads false pre-load
    unmount()

    renderHook(() => mod.useSyncScopedIntrospection(), { wrapper: flagProvider(true, true) })
    await Promise.resolve()

    expect(settled).toBe(true)
    expect(mod.isScopedIntrospection()).toBe(true)
  })

  test('resolves immediately when self-hosted (flags disabled)', async () => {
    mockIsPlatform.value = false

    let settled = false
    mod.scopedIntrospectionReady().then(() => {
      settled = true
    })

    renderHook(() => mod.useSyncScopedIntrospection(), { wrapper: flagProvider(false, false) })
    await Promise.resolve()

    expect(settled).toBe(true)
  })

  test('falls back to resolving 5s after the first scopedIntrospectionReady() call if hydration never happens', async () => {
    vi.useFakeTimers()

    let settled = false
    mod.scopedIntrospectionReady().then(() => {
      settled = true
    })

    vi.advanceTimersByTime(4_999)
    await Promise.resolve()
    expect(settled).toBe(false)

    vi.advanceTimersByTime(1)
    await Promise.resolve()
    expect(settled).toBe(true)
    // Hydration never ran -- accessor stays at its default.
    expect(mod.isScopedIntrospection()).toBe(false)
  })
})
