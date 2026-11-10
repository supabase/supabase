import { act, fireEvent, screen, waitFor } from '@testing-library/react'
import { platformComponents as components } from 'api-types'
import { LOCAL_STORAGE_KEYS, safeLocalStorage } from 'common'
import { delay, HttpResponse } from 'msw'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ONBOARDING_SURVEY_FOLLOW_UP_WINDOW_MS } from './OnboardingSurvey.constants'
import { markFollowUpPending } from './OnboardingSurveyFollowUp.utils'
import { OnboardingSurveyFollowUpCard } from './OnboardingSurveyFollowUpCard'
import { BannerStack } from '@/components/ui/BannerStack/BannerStack'
import { BannerStackProvider } from '@/components/ui/BannerStack/BannerStackProvider'
import { createMockOrganizationResponse } from '@/tests/helpers'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock, type APIErrorBody } from '@/tests/lib/msw'
import { createMockProfile, createMockProfileContext } from '@/tests/lib/profile-helpers'

type OrganizationResponse = components['schemas']['OrganizationResponse_Output']
type OnboardingSurveyBody = components['schemas']['OnboardingSurveyBody']

const PROFILE_ID = 'user-1'
const ORG_SLUG = 'new-org'

// Telemetry is consent-gated and never reaches the network in tests, so the
// event itself is captured here
const { track } = vi.hoisted(() => ({ track: vi.fn() }))
vi.mock('@/lib/telemetry/track', () => ({ useTrack: () => track }))

vi.mock(import('common'), async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useParams: () => ({ slug: ORG_SLUG }),
    useIsLoggedIn: () => true,
  }
})

const storageKey = LOCAL_STORAGE_KEYS.ONBOARDING_SURVEY_FOLLOW_UP(PROFILE_ID, ORG_SLUG)
const readStoredState = () => JSON.parse(safeLocalStorage.getItem(storageKey) ?? 'null')

const mockSurveyEndpoint = (status: 204 | 500) => {
  const requests: OnboardingSurveyBody[] = []
  addAPIMock({
    method: 'post',
    path: '/platform/organizations/onboarding-survey',
    response: async ({ request }) => {
      requests.push((await request.json()) as OnboardingSurveyBody)
      // Long enough for the card to render the dismissal before the save settles
      await delay(50)
      if (status === 500) {
        return HttpResponse.json<APIErrorBody>({ message: 'Boom' }, { status: 500 })
      }
      return new HttpResponse(null, { status: 204 })
    },
  })
  return requests
}

const renderCard = () => {
  addAPIMock({
    method: 'get',
    path: '/platform/organizations',
    response: () =>
      HttpResponse.json<OrganizationResponse[]>([
        createMockOrganizationResponse({ slug: ORG_SLUG }),
      ]),
  })

  return customRender(
    <BannerStackProvider>
      <OnboardingSurveyFollowUpCard />
      <BannerStack />
    </BannerStackProvider>,
    {
      profileContext: createMockProfileContext({
        profile: createMockProfile({ gotrue_id: PROFILE_ID }),
      }),
    }
  )
}

describe('OnboardingSurveyFollowUpCard', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.setSystemTime(new Date('2026-10-30T10:00:00.000Z'))
    track.mockClear()
  })

  afterEach(() => {
    vi.useRealTimers()
    safeLocalStorage.removeItem(storageKey)
  })

  it('saves the stored org type and size once when skipped', async () => {
    markFollowUpPending({ profileId: PROFILE_ID, orgSlug: ORG_SLUG, kind: 'COMPANY', size: '10' })
    const requests = mockSurveyEndpoint(204)

    renderCard()
    fireEvent.click(await screen.findByRole('button', { name: 'Skip' }))

    await waitFor(() => expect(readStoredState()).toMatchObject({ status: 'dismissed' }))
    await waitFor(() => expect(requests).toEqual([{ slug: ORG_SLUG, kind: 'COMPANY', size: '10' }]))
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Skip' })).toBeNull())
    expect(track).not.toHaveBeenCalledWith('onboarding_survey_submit_failed', expect.anything())
  })

  it('puts the follow-up back to pending when the skip save fails, without asking again', async () => {
    markFollowUpPending({ profileId: PROFILE_ID, orgSlug: ORG_SLUG, kind: 'COMPANY', size: '10' })
    const pendingState = readStoredState()
    const requests = mockSurveyEndpoint(500)

    renderCard()
    fireEvent.click(await screen.findByRole('button', { name: 'Skip' }))

    await waitFor(() =>
      expect(track).toHaveBeenCalledWith('onboarding_survey_submit_failed', {
        surface: 'follow_up',
        hasKind: true,
        hasBuilding: false,
      })
    )
    await waitFor(() => expect(readStoredState()).toEqual(pendingState))
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000)
    })
    expect(screen.queryByRole('button', { name: 'Skip' })).toBeNull()

    // The window closing in the same visit doesn't send it again; the next page load retries
    await act(async () => {
      await vi.advanceTimersByTimeAsync(ONBOARDING_SURVEY_FOLLOW_UP_WINDOW_MS)
    })
    expect(requests).toHaveLength(1)
    expect(readStoredState()).toEqual(pendingState)
  })

  it('tries an expired follow-up once per visit when its save fails', async () => {
    markFollowUpPending({
      profileId: PROFILE_ID,
      orgSlug: ORG_SLUG,
      kind: 'PERSONAL',
      now: new Date(Date.now() - ONBOARDING_SURVEY_FOLLOW_UP_WINDOW_MS - 1000),
    })
    const pendingState = readStoredState()
    const requests = mockSurveyEndpoint(500)

    renderCard()

    await waitFor(() => expect(requests).toEqual([{ slug: ORG_SLUG, kind: 'PERSONAL' }]))
    await waitFor(() => expect(readStoredState()).toEqual(pendingState))
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000)
    })
    expect(requests).toHaveLength(1)
    expect(screen.queryByRole('button', { name: 'Skip' })).toBeNull()
  })
})
