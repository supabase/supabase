import { QueryClient } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { clearLocalStorage, LOCAL_STORAGE_KEYS } from 'common'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useExplorerPreferences } from './useExplorerPreferences'
import type { ProfileContextType } from '@/lib/profile'
import { customRenderHook, CustomWrapper } from '@/tests/lib/custom-render'
import { createMockProfile, createMockProfileContext } from '@/tests/lib/profile-helpers'

const mockIsPlatform = vi.hoisted(() => ({ value: true }))

vi.mock('common', async (importOriginal) => ({
  ...(await importOriginal<typeof import('common')>()),
  get IS_PLATFORM() {
    return mockIsPlatform.value
  },
}))

const storageKey = LOCAL_STORAGE_KEYS.EXPLORER_PREFERENCES
const renderPreferences = (accountId = 1, queryClient?: QueryClient) =>
  customRenderHook(useExplorerPreferences, {
    queryClient,
    profileContext: createMockProfileContext({ profile: createMockProfile({ id: accountId }) }),
  })

beforeEach(() => {
  mockIsPlatform.value = true
})
afterEach(() => localStorage.clear())

describe('useExplorerPreferences', () => {
  it('defaults to the start page with onboarding incomplete', async () => {
    const { result } = renderPreferences()
    await waitFor(() => expect(result.current.isReady).toBe(true))
    expect(result.current.home).toBe('home')
    expect(result.current.hasCompletedOnboarding).toBe(false)
  })

  it('persists both settings across remounts and sign-out storage cleanup', async () => {
    const first = renderPreferences()
    await waitFor(() => expect(first.result.current.isReady).toBe(true))
    act(() => {
      first.result.current.setHome('query')
      first.result.current.completeOnboarding()
    })
    await waitFor(() => expect(first.result.current.hasCompletedOnboarding).toBe(true))
    first.unmount()
    clearLocalStorage()

    const second = renderPreferences()
    await waitFor(() => expect(second.result.current.isReady).toBe(true))
    expect(second.result.current.home).toBe('query')
    expect(second.result.current.hasCompletedOnboarding).toBe(true)

    act(() => second.result.current.setHome('home'))
    expect(second.result.current.hasCompletedOnboarding).toBe(true)
  })

  it('isolates accounts and preserves other accounts when saving', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const first = renderPreferences(1, queryClient)
    const second = renderPreferences(2, queryClient)
    await waitFor(() => expect(first.result.current.isReady).toBe(true))
    await waitFor(() => expect(second.result.current.isReady).toBe(true))

    act(() => {
      first.result.current.setHome('query')
      first.result.current.completeOnboarding()
    })
    expect(second.result.current.home).toBe('home')
    expect(second.result.current.hasCompletedOnboarding).toBe(false)
    act(() => second.result.current.completeOnboarding())

    expect(JSON.parse(localStorage.getItem(storageKey)!)).toEqual({
      '1': { home: 'query', hasCompletedOnboarding: true },
      '2': { home: 'home', hasCompletedOnboarding: true },
    })
  })

  it('synchronizes separate consumers of the same account preference', async () => {
    const queryClient = new QueryClient()
    const first = renderPreferences(1, queryClient)
    const second = renderPreferences(1, queryClient)
    await waitFor(() => expect(first.result.current.isReady).toBe(true))
    act(() => first.result.current.setHome('query'))
    await waitFor(() => expect(second.result.current.home).toBe('query'))
  })

  it('does not read or write another account while the profile is loading', async () => {
    const { result } = customRenderHook(useExplorerPreferences, {
      profileContext: {
        ...createMockProfileContext(),
        profile: undefined,
        isLoading: true,
        isSuccess: false,
      },
    })
    act(() => {
      result.current.setHome('query')
      result.current.completeOnboarding()
    })
    expect(result.current.isReady).toBe(false)
    expect(localStorage.getItem(storageKey)).toBeNull()
  })

  it.each([
    'null',
    '[]',
    '42',
    '{}',
    '{"1":null}',
    '{"1":{"home":"invalid","hasCompletedOnboarding":"true"}}',
    'invalid JSON',
  ])('recovers from invalid stored preferences: %s', async (stored) => {
    localStorage.setItem(storageKey, stored)
    const { result } = renderPreferences()
    await waitFor(() => expect(result.current.isReady).toBe(true))
    expect(result.current.home).toBe('home')
    expect(result.current.hasCompletedOnboarding).toBe(false)
    act(() => result.current.completeOnboarding())
    expect(JSON.parse(localStorage.getItem(storageKey)!)).toEqual({
      '1': { home: 'home', hasCompletedOnboarding: true },
    })
  })

  describe('self-hosted', () => {
    beforeEach(() => {
      mockIsPlatform.value = false
    })

    it('keeps the preference and onboarding completion when the profile loads', async () => {
      const queryClient = new QueryClient()
      let profileContext: ProfileContextType = {
        ...createMockProfileContext(),
        profile: undefined,
        isLoading: true,
        isSuccess: false,
      }
      const { result, rerender } = renderHook(useExplorerPreferences, {
        wrapper: ({ children }) => (
          <CustomWrapper queryClient={queryClient} profileContext={profileContext}>
            {children}
          </CustomWrapper>
        ),
      })
      await waitFor(() => expect(result.current.isReady).toBe(true))
      act(() => {
        result.current.setHome('query')
        result.current.completeOnboarding()
      })
      await waitFor(() => expect(result.current.hasCompletedOnboarding).toBe(true))

      profileContext = createMockProfileContext()
      rerender()

      expect(result.current.home).toBe('query')
      expect(result.current.hasCompletedOnboarding).toBe(true)
      act(() => result.current.setHome('home'))
      expect(JSON.parse(localStorage.getItem(storageKey)!)).toEqual({
        'self-hosted': { home: 'home', hasCompletedOnboarding: true },
      })
    })

    it('uses the self-hosted key even when a profile is already available', async () => {
      const accountPreferences = { home: 'home', hasCompletedOnboarding: false }
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          'self-hosted': { home: 'query', hasCompletedOnboarding: true },
          '1': accountPreferences,
        })
      )
      const { result } = customRenderHook(useExplorerPreferences, {
        profileContext: createMockProfileContext(),
      })
      await waitFor(() => expect(result.current.isReady).toBe(true))
      expect(result.current.home).toBe('query')
      expect(result.current.hasCompletedOnboarding).toBe(true)
      act(() => result.current.setHome('home'))
      expect(JSON.parse(localStorage.getItem(storageKey)!)).toEqual({
        'self-hosted': { home: 'home', hasCompletedOnboarding: true },
        '1': accountPreferences,
      })
    })
  })
})
