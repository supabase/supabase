import { QueryClient } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { LOCAL_STORAGE_KEYS } from 'common'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { useExplorerPreferences } from './useExplorerPreferences'
import type { ProfileContextType } from '@/lib/profile'
import { customRenderHook, CustomWrapper } from '@/tests/lib/custom-render'
import { createMockProfileContext } from '@/tests/lib/profile-helpers'

vi.mock('common', async (importOriginal) => ({
  ...(await importOriginal<typeof import('common')>()),
  IS_PLATFORM: false,
}))

const storageKey = LOCAL_STORAGE_KEYS.EXPLORER_PREFERENCES

afterEach(() => localStorage.clear())

describe('useExplorerPreferences (self-hosted)', () => {
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
