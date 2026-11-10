import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { safeLocalStorage } from 'common'
import type { PropsWithChildren } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ONBOARDING_SURVEY_FOLLOW_UP_WINDOW_MS } from './OnboardingSurvey.constants'
import { getFollowUpStorageKey, markFollowUpPending } from './OnboardingSurveyFollowUp.utils'
import { useOnboardingSurveyFollowUp } from './useOnboardingSurveyFollowUp'
import { getLocalStorageQueryKey } from '@/hooks/misc/useLocalStorage'

const PROFILE_ID = 'user-1'
const ORG_SLUG = 'new-org'

vi.mock('@/lib/profile', () => ({
  useProfile: () => ({ profile: { gotrue_id: PROFILE_ID } }),
}))

vi.mock('@/hooks/misc/useSelectedOrganization', () => ({
  useSelectedOrganizationQuery: () => ({ data: { slug: ORG_SLUG } }),
}))

const renderFollowUpHook = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  return { queryClient, ...renderHook(() => useOnboardingSurveyFollowUp(), { wrapper }) }
}

const readStoredState = () =>
  JSON.parse(safeLocalStorage.getItem(getFollowUpStorageKey(PROFILE_ID, ORG_SLUG)) ?? 'null')

describe('useOnboardingSurveyFollowUp', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.setSystemTime(new Date('2026-10-30T10:00:00.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
    safeLocalStorage.removeItem(getFollowUpStorageKey(PROFILE_ID, ORG_SLUG))
  })

  it('is not eligible when the creator answered on the form (no pending state)', async () => {
    const { result } = renderFollowUpHook()

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })
    expect(result.current.isEligible).toBe(false)
  })

  it('picks up a follow-up marked after the key was read, once its query is invalidated', async () => {
    const { result, queryClient } = renderFollowUpHook()
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })
    expect(result.current.isEligible).toBe(false)

    markFollowUpPending({ profileId: PROFILE_ID, orgSlug: ORG_SLUG })
    await act(async () => {
      await queryClient.invalidateQueries({
        queryKey: getLocalStorageQueryKey(getFollowUpStorageKey(PROFILE_ID, ORG_SLUG)),
      })
    })

    await waitFor(() => expect(result.current.isEligible).toBe(true))
  })

  it('is eligible while the org is less than five minutes old, then expires', async () => {
    markFollowUpPending({ profileId: PROFILE_ID, orgSlug: ORG_SLUG })

    const { result } = renderFollowUpHook()
    await waitFor(() => expect(result.current.isEligible).toBe(true))

    expect(result.current.hasExpired).toBe(false)

    await act(async () => {
      await vi.advanceTimersByTimeAsync(ONBOARDING_SURVEY_FOLLOW_UP_WINDOW_MS)
    })
    expect(result.current.isEligible).toBe(false)
    expect(result.current.hasExpired).toBe(true)
  })

  it('is not eligible when the org was created more than five minutes ago', async () => {
    markFollowUpPending({
      profileId: PROFILE_ID,
      orgSlug: ORG_SLUG,
      now: new Date(Date.now() - ONBOARDING_SURVEY_FOLLOW_UP_WINDOW_MS - 1000),
    })

    const { result } = renderFollowUpHook()
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })
    expect(result.current.isEligible).toBe(false)
    expect(result.current.hasExpired).toBe(true)
  })

  it.each(['submitted', 'dismissed'] as const)(
    'stops being eligible once %s, and stores it',
    async (status) => {
      markFollowUpPending({ profileId: PROFILE_ID, orgSlug: ORG_SLUG })

      const { result } = renderFollowUpHook()
      await waitFor(() => expect(result.current.isEligible).toBe(true))

      act(() => result.current.resolveFollowUp(status))

      await waitFor(() => expect(result.current.isEligible).toBe(false))
      expect(result.current.hasExpired).toBe(false)
      expect(readStoredState()).toMatchObject({ status })
    }
  )
})
