import { QueryClient } from '@tanstack/react-query'
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  type AnyRouter,
} from '@tanstack/react-router'
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { platformComponents as components } from 'api-types'
import { LOCAL_STORAGE_KEYS, safeLocalStorage } from 'common'
import { delay, HttpResponse } from 'msw'
import { Toaster } from 'sonner'
import { afterEach, beforeEach, describe, expect, it, onTestFinished, vi } from 'vitest'

import {
  ONBOARDING_SURVEY_FOLLOW_UP_WINDOW_MS,
  VERCEL_MARKETPLACE_SURVEY_START,
} from './OnboardingSurvey.constants'
import { markFollowUpPending } from './OnboardingSurveyFollowUp.utils'
import { OnboardingSurveyFollowUpCard } from './OnboardingSurveyFollowUpCard'
import { BannerStack } from '@/components/ui/BannerStack/BannerStack'
import { BannerStackProvider } from '@/components/ui/BannerStack/BannerStackProvider'
import { organizationKeys } from '@/data/organizations/keys'
import { castOrganizationSlugResponseToOrganization } from '@/data/organizations/organization-query'
import { castOrganizationResponseToOrganization } from '@/data/organizations/organizations-query'
import { parseSearch, stringifySearch } from '@/lib/router-search-params'
import { createMockOrganizationResponse } from '@/tests/helpers'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock, type APIErrorBody } from '@/tests/lib/msw'
import { createMockProfile, createMockProfileContext } from '@/tests/lib/profile-helpers'

type OrganizationResponse = components['schemas']['OrganizationResponse_Output']
type OrganizationDetailResponse = components['schemas']['OrganizationSlugResponse_Output']
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

const toOrganizationDetail = (
  organization: OrganizationResponse,
  createdAt: string
): OrganizationDetailResponse => ({
  ...organization,
  created_at: createdAt,
  has_oriole_project: false,
})

const mockOrganizationDetail = (organization: OrganizationResponse, createdAt: string) => {
  const requests: string[] = []
  addAPIMock({
    method: 'get',
    path: '/platform/organizations/:slug',
    response: ({ request }) => {
      requests.push(request.url)
      return HttpResponse.json<OrganizationDetailResponse>(
        toOrganizationDetail(organization, createdAt)
      )
    },
  })
  return requests
}

// The app root keeps the org list and a free org's details cached on every page
const cachedQueryClient = (organization: OrganizationResponse, createdAt: string) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  queryClient.setQueryData(organizationKeys.list(), [
    castOrganizationResponseToOrganization(organization),
  ])
  queryClient.setQueryData(
    organizationKeys.detail(organization.slug),
    castOrganizationSlugResponseToOrganization(toOrganizationDetail(organization, createdAt))
  )
  return queryClient
}

const renderCard = ({
  organization = createMockOrganizationResponse({ slug: ORG_SLUG }),
  queryClient,
  initialUrl = `/org/${ORG_SLUG}`,
}: {
  organization?: OrganizationResponse
  queryClient?: QueryClient
  initialUrl?: string
} = {}) => {
  addAPIMock({
    method: 'get',
    path: '/platform/organizations',
    response: () => HttpResponse.json<OrganizationResponse[]>([organization]),
  })

  const router = createRouter({
    routeTree: createRootRoute(),
    history: createMemoryHistory({ initialEntries: [initialUrl] }),
    parseSearch,
    stringifySearch,
  })

  const result = customRender(
    <BannerStackProvider>
      <OnboardingSurveyFollowUpCard />
      <BannerStack />
      <Toaster />
    </BannerStackProvider>,
    {
      queryClient,
      router,
      profileContext: createMockProfileContext({
        profile: createMockProfile({ gotrue_id: PROFILE_ID }),
      }),
    }
  )

  return { ...result, router }
}

const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })

// Radix Selects render a hidden native <option> per item, so scope to the open listbox
const chooseOption = async (dialog: HTMLElement, question: number, option: string) => {
  await user.click(within(dialog).getAllByRole('combobox')[question])
  await user.click(within(await screen.findByRole('listbox')).getByRole('option', { name: option }))
}

const advance = (ms: number) => act(() => vi.advanceTimersByTimeAsync(ms))

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
    expect(track).toHaveBeenCalledWith('onboarding_survey_dismissed', {
      surface: 'follow_up',
      reason: 'follow_up_skip',
    })
    expect(track).not.toHaveBeenCalledWith('onboarding_survey_submit_failed', expect.anything())
  })

  it('saves the stored org type once when the five minutes run out', async () => {
    markFollowUpPending({ profileId: PROFILE_ID, orgSlug: ORG_SLUG, kind: 'AGENCY' })
    const requests = mockSurveyEndpoint(204)

    renderCard()
    await screen.findByRole('button', { name: 'Answer' })

    await advance(ONBOARDING_SURVEY_FOLLOW_UP_WINDOW_MS - 1000)
    expect(screen.getByRole('button', { name: 'Answer' })).toBeInTheDocument()
    expect(requests).toEqual([])

    await advance(1000)
    await waitFor(() => expect(requests).toEqual([{ slug: ORG_SLUG, kind: 'AGENCY' }]))
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Answer' })).toBeNull())
    expect(readStoredState()).toMatchObject({ status: 'dismissed' })
    expect(track).toHaveBeenCalledWith('onboarding_survey_dismissed', {
      surface: 'follow_up',
      reason: 'follow_up_expired',
    })
  })

  it('stays out of the way on project creation pages', async () => {
    markFollowUpPending({ profileId: PROFILE_ID, orgSlug: ORG_SLUG, kind: 'PERSONAL' })
    const requests = mockSurveyEndpoint(204)

    const { router } = renderCard({ initialUrl: `/new/${ORG_SLUG}` })
    await advance(1000)
    expect(screen.queryByRole('button', { name: 'Answer' })).toBeNull()

    await act(async () => {
      await router.navigate<AnyRouter, string>({ to: `/org/${ORG_SLUG}` })
    })
    expect(await screen.findByRole('button', { name: 'Answer' })).toBeInTheDocument()
    expect(requests).toEqual([])
  })

  it.each([
    ['nothing was left blank on the form', () => {}],
    [
      'the blank survey belongs to another user of this browser',
      () => markFollowUpPending({ profileId: 'user-2', orgSlug: ORG_SLUG, kind: 'PERSONAL' }),
    ],
    [
      'the stored state is not one it understands',
      () => safeLocalStorage.setItem(storageKey, JSON.stringify({ status: 'later' })),
    ],
  ])('does not ask when %s', async (_, arrange) => {
    arrange()
    const requests = mockSurveyEndpoint(204)

    renderCard()
    await advance(ONBOARDING_SURVEY_FOLLOW_UP_WINDOW_MS)

    expect(screen.queryByRole('button', { name: 'Answer' })).toBeNull()
    expect(requests).toEqual([])
    safeLocalStorage.removeItem(LOCAL_STORAGE_KEYS.ONBOARDING_SURVEY_FOLLOW_UP('user-2', ORG_SLUG))
  })

  it('sends the answers, replacing the org type and size picked on the form', async () => {
    markFollowUpPending({ profileId: PROFILE_ID, orgSlug: ORG_SLUG, kind: 'COMPANY', size: '10' })
    const requests = mockSurveyEndpoint(204)

    renderCard()
    fireEvent.click(await screen.findByRole('button', { name: 'Answer' }))
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByRole('button', { name: 'Send answers' })).toBeDisabled()

    await chooseOption(dialog, 0, 'Agency')
    await chooseOption(dialog, 1, 'Other')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Send answers' }))

    expect(await screen.findByText('Thanks for sharing')).toBeInTheDocument()
    expect(requests).toEqual([{ slug: ORG_SLUG, kind: 'AGENCY', building: 'other' }])
    expect(readStoredState()).toMatchObject({ status: 'submitted' })
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(screen.queryByRole('button', { name: 'Answer' })).toBeNull()

    // Answered, so nothing more is sent when the window closes
    await advance(ONBOARDING_SURVEY_FOLLOW_UP_WINDOW_MS)
    expect(requests).toHaveLength(1)
  })

  it('sends can_code in the same request as the other answers', async () => {
    markFollowUpPending({ profileId: PROFILE_ID, orgSlug: ORG_SLUG, kind: 'COMPANY', size: '10' })
    const requests = mockSurveyEndpoint(204)

    renderCard()
    fireEvent.click(await screen.findByRole('button', { name: 'Answer' }))
    const dialog = await screen.findByRole('dialog')
    await chooseOption(dialog, 2, 'Yes')
    await chooseOption(dialog, 0, 'Agency')
    await chooseOption(dialog, 1, 'Other')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Send answers' }))

    await waitFor(() =>
      expect(requests).toEqual([
        { slug: ORG_SLUG, kind: 'AGENCY', building: 'other', can_code: 'yes' },
      ])
    )
    expect(track).toHaveBeenCalledWith('onboarding_survey_submit_button_clicked', {
      surface: 'follow_up',
      hasKind: true,
      hasBuilding: true,
      hasCanCode: true,
    })
  })

  it('asks for a company size and sends it', async () => {
    markFollowUpPending({ profileId: PROFILE_ID, orgSlug: ORG_SLUG, kind: 'PERSONAL' })
    const requests = mockSurveyEndpoint(204)

    renderCard()
    fireEvent.click(await screen.findByRole('button', { name: 'Answer' }))
    const dialog = await screen.findByRole('dialog')

    await chooseOption(dialog, 0, 'Company')
    await chooseOption(dialog, 1, '50 - 99')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Send answers' }))

    await waitFor(() => expect(requests).toEqual([{ slug: ORG_SLUG, kind: 'COMPANY', size: '50' }]))
  })

  it('keeps the dialog open to try again when sending the answers fails', async () => {
    markFollowUpPending({ profileId: PROFILE_ID, orgSlug: ORG_SLUG, kind: 'PERSONAL' })
    const pendingState = readStoredState()
    mockSurveyEndpoint(500)

    renderCard()
    fireEvent.click(await screen.findByRole('button', { name: 'Answer' }))
    const dialog = await screen.findByRole('dialog')
    await chooseOption(dialog, 0, 'Startup')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Send answers' }))

    expect(await screen.findByText('Failed to send your answers. Try again.')).toBeInTheDocument()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(readStoredState()).toEqual(pendingState)
    expect(track).toHaveBeenCalledWith('onboarding_survey_submit_failed', {
      surface: 'follow_up',
      hasKind: true,
      hasBuilding: false,
      hasCanCode: false,
    })
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
        hasCanCode: false,
      })
    )
    await waitFor(() => expect(readStoredState()).toEqual(pendingState))
    await advance(1000)
    expect(screen.queryByRole('button', { name: 'Skip' })).toBeNull()

    // The window closing in the same visit doesn't send it again; the next page load retries
    await advance(ONBOARDING_SURVEY_FOLLOW_UP_WINDOW_MS)
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
    await advance(1000)
    expect(requests).toHaveLength(1)
    expect(screen.queryByRole('button', { name: 'Skip' })).toBeNull()
  })

  it('defers the expiry save while the dialog is open, then saves once on close', async () => {
    markFollowUpPending({ profileId: PROFILE_ID, orgSlug: ORG_SLUG, kind: 'COMPANY', size: '10' })
    const requests = mockSurveyEndpoint(204)

    renderCard()
    fireEvent.click(await screen.findByRole('button', { name: 'Answer' }))
    const dialog = await screen.findByRole('dialog')

    await advance(ONBOARDING_SURVEY_FOLLOW_UP_WINDOW_MS)
    expect(requests).toHaveLength(0)
    expect(readStoredState()).toMatchObject({ status: 'pending' })

    fireEvent.click(within(dialog).getByRole('button', { name: 'Skip' }))

    await waitFor(() => expect(requests).toEqual([{ slug: ORG_SLUG, kind: 'COMPANY', size: '10' }]))
    expect(readStoredState()).toMatchObject({ status: 'dismissed' })
    expect(track).toHaveBeenCalledWith('onboarding_survey_dismissed', {
      surface: 'follow_up',
      reason: 'follow_up_closed',
    })
    expect(track).not.toHaveBeenCalledWith('onboarding_survey_dismissed', {
      surface: 'follow_up',
      reason: 'follow_up_expired',
    })
  })

  describe('for a Vercel Marketplace org', () => {
    const vercelOrg = createMockOrganizationResponse({
      slug: ORG_SLUG,
      billing_partner: 'vercel_marketplace',
    })

    it('does not ask about an org created before the start date', async () => {
      const detailRequests = mockOrganizationDetail(vercelOrg, '2026-11-24T23:59:59Z')

      renderCard({ organization: vercelOrg })
      await waitFor(() => expect(detailRequests).toHaveLength(1))
      await advance(1000)

      expect(screen.queryByRole('button', { name: 'Answer' })).toBeNull()
    })

    it.each([
      ['a member who is not an owner', { ...vercelOrg, is_owner: false }],
      ['the owner of an org Vercel does not manage', { ...vercelOrg, billing_partner: null }],
    ])('does not ask %s', async (_, organization) => {
      const queryClient = cachedQueryClient(organization, VERCEL_MARKETPLACE_SURVEY_START)

      renderCard({ organization, queryClient })
      await advance(1000)

      expect(screen.queryByRole('button', { name: 'Answer' })).toBeNull()
    })

    it('does not show the card before a stored skip has been read', async () => {
      const state = { status: 'dismissed', orgCreatedAt: VERCEL_MARKETPLACE_SURVEY_START }
      safeLocalStorage.setItem(storageKey, JSON.stringify(state))
      const queryClient = cachedQueryClient(vercelOrg, VERCEL_MARKETPLACE_SURVEY_START)

      renderCard({ organization: vercelOrg, queryClient })
      expect(screen.queryByRole('button', { name: 'Answer' })).toBeNull()

      await advance(1000)
      expect(screen.queryByRole('button', { name: 'Answer' })).toBeNull()
    })

    it('asks about an org created on the start date and stores a skip without sending anything', async () => {
      mockOrganizationDetail(vercelOrg, VERCEL_MARKETPLACE_SURVEY_START)
      const requests = mockSurveyEndpoint(204)

      renderCard({ organization: vercelOrg })
      fireEvent.click(await screen.findByRole('button', { name: 'Skip' }))

      await waitFor(() =>
        expect(readStoredState()).toEqual({
          status: 'dismissed',
          orgCreatedAt: VERCEL_MARKETPLACE_SURVEY_START,
        })
      )
      await waitFor(() => expect(screen.queryByRole('button', { name: 'Skip' })).toBeNull())
      await advance(1000)
      expect(requests).toEqual([])
    })

    it('stays away after a skip that could not be stored', async () => {
      mockOrganizationDetail(vercelOrg, VERCEL_MARKETPLACE_SURVEY_START)
      const setItem = vi.spyOn(safeLocalStorage, 'setItem').mockImplementation(() => {})
      onTestFinished(() => setItem.mockRestore())

      renderCard({ organization: vercelOrg })
      fireEvent.click(await screen.findByRole('button', { name: 'Skip' }))
      await advance(1000)

      expect(readStoredState()).toBeNull()
      expect(screen.queryByRole('button', { name: 'Skip' })).toBeNull()
    })
  })
})
