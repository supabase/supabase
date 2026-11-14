import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { platformComponents as components } from 'api-types'
import { FeatureFlagContext, LOCAL_STORAGE_KEYS, safeLocalStorage } from 'common'
import { HttpResponse } from 'msw'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { NewOrgForm } from './NewOrgForm'
import { useLocalStorageQuery } from '@/hooks/misc/useLocalStorage'
import { createMockOrganizationResponse } from '@/tests/helpers'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock, type APIErrorBody } from '@/tests/lib/msw'
import { createMockProfile, createMockProfileContext } from '@/tests/lib/profile-helpers'
import { routerMock } from '@/tests/lib/route-mock'

type OrganizationResponse = components['schemas']['OrganizationResponse_Output']
type CreateOrganizationBody = components['schemas']['CreateOrganizationBody']
type OnboardingSurveyBody = components['schemas']['OnboardingSurveyBody']
type ProjectsResponse = components['schemas']['ListProjectsPaginatedResponse_Output']

// No project is in scope on the new-org page
vi.mock(import('common'), async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, useParams: () => ({}) }
})

const PROFILE_ID = 'user-1'
const NEW_ORG_SLUG = 'new-org'

const followUpKey = LOCAL_STORAGE_KEYS.ONBOARDING_SURVEY_FOLLOW_UP(PROFILE_ID, NEW_ORG_SLUG)
const readFollowUpState = () => JSON.parse(safeLocalStorage.getItem(followUpKey) ?? 'null')

const mockApi = ({ surveyStatus = 204 }: { surveyStatus?: 204 | 500 } = {}) => {
  const createRequests: CreateOrganizationBody[] = []
  const surveyRequests: OnboardingSurveyBody[] = []

  addAPIMock({
    method: 'get',
    path: '/platform/organizations',
    response: () =>
      HttpResponse.json<OrganizationResponse[]>([createMockOrganizationResponse({ slug: 'old' })]),
  })
  addAPIMock({
    method: 'get',
    path: '/platform/projects',
    response: () =>
      HttpResponse.json<ProjectsResponse>({
        projects: [],
        pagination: { count: 0, limit: 100, offset: 0 },
      }),
  })
  addAPIMock({
    method: 'post',
    path: '/platform/organizations',
    response: async ({ request }) => {
      createRequests.push((await request.json()) as CreateOrganizationBody)
      return HttpResponse.json<OrganizationResponse>(
        createMockOrganizationResponse({ slug: NEW_ORG_SLUG }),
        { status: 201 }
      )
    },
  })
  addAPIMock({
    method: 'post',
    path: '/platform/organizations/onboarding-survey',
    response: async ({ request }) => {
      surveyRequests.push((await request.json()) as OnboardingSurveyBody)
      if (surveyStatus === 500) {
        return HttpResponse.json<APIErrorBody>({ message: 'Boom' }, { status: 500 })
      }
      return new HttpResponse(null, { status: 204 })
    },
  })

  return { createRequests, surveyRequests }
}

// Stands in for the follow-up card, which reads this key through the same cache
// and may already have read it as empty by the time the form writes it
const FollowUpStatus = () => {
  const [state] = useLocalStorageQuery<{ status: string } | null>(followUpKey, null)
  return <p>{`Follow-up: ${state?.status ?? 'none'}`}</p>
}

const renderForm = (flag: string | false | undefined) =>
  customRender(
    <FeatureFlagContext.Provider
      value={{
        configcat: {},
        // An empty store reads as "flags not loaded yet"
        posthog: flag === undefined ? {} : { onboardingSurveyPlacement: flag },
        hasLoaded: true,
        hasFlagsForSignedInUser: true,
      }}
    >
      <NewOrgForm onPaymentMethodReset={() => {}} onPlanSelected={() => {}} />
      <FollowUpStatus />
    </FeatureFlagContext.Provider>,
    {
      profileContext: createMockProfileContext({
        profile: createMockProfile({ gotrue_id: PROFILE_ID }),
      }),
    }
  )

const user = userEvent.setup()

// Radix Selects render a hidden native <option> per item, so scope to the open listbox
const chooseOption = async (currentValue: string, option: string) => {
  const trigger = screen
    .getAllByRole('combobox')
    .find((combobox) => combobox.textContent === currentValue)
  if (!trigger) throw new Error(`No select showing "${currentValue}"`)
  await user.click(trigger)
  await user.click(within(await screen.findByRole('listbox')).getByRole('option', { name: option }))
}

const fillNameAndSubmit = async () => {
  await user.click(screen.getByPlaceholderText('Organization name'))
  await user.paste('Acme')
  fireEvent.click(screen.getByRole('button', { name: 'Create organization' }))
  await waitFor(() => expect(routerMock.asPath).toContain(`/new/${NEW_ORG_SLUG}`))
}

describe('NewOrgForm onboarding survey', () => {
  beforeEach(() => {
    routerMock.setCurrentUrl('/new')
  })

  afterEach(() => {
    safeLocalStorage.removeItem(followUpKey)
  })

  describe('org_form arm', () => {
    it('sends the answers to the survey, not to org creation', async () => {
      const { createRequests, surveyRequests } = mockApi()
      renderForm('org_form')

      await chooseOption('Personal', 'Company')
      await chooseOption('1 - 10', '50 - 99')
      await chooseOption('Select an option', 'B2B SaaS application')
      await fillNameAndSubmit()

      expect(createRequests).toEqual([{ name: 'Acme', tier: 'tier_free' }])
      expect(surveyRequests).toEqual([
        { slug: NEW_ORG_SLUG, kind: 'COMPANY', size: '50', building: 'b2b_saas' },
      ])
      expect(readFollowUpState()).toBeNull()
    })

    it('sends nothing for an untouched survey and leaves the org type for the follow-up', async () => {
      const { createRequests, surveyRequests } = mockApi()
      renderForm('org_form')
      expect(await screen.findByText('Follow-up: none')).toBeInTheDocument()

      await fillNameAndSubmit()

      expect(createRequests).toEqual([{ name: 'Acme', tier: 'tier_free' }])
      expect(surveyRequests).toEqual([])
      expect(readFollowUpState()).toMatchObject({ status: 'pending', kind: 'PERSONAL' })
      expect(await screen.findByText('Follow-up: pending')).toBeInTheDocument()
    })

    it('counts a changed org type alone as an answer', async () => {
      const { surveyRequests } = mockApi()
      renderForm('org_form')

      await chooseOption('Personal', 'Agency')
      await fillNameAndSubmit()

      expect(surveyRequests).toEqual([{ slug: NEW_ORG_SLUG, kind: 'AGENCY' }])
      expect(readFollowUpState()).toBeNull()
    })

    it('sends a partly answered survey and asks for no follow-up', async () => {
      const { surveyRequests } = mockApi()
      renderForm('org_form')

      await chooseOption('Personal', 'Company')
      await chooseOption('1 - 10', '50 - 99')
      const [, canCodeSelect] = screen
        .getAllByRole('combobox')
        .filter((combobox) => combobox.textContent === 'Select an option')
      await user.click(canCodeSelect)
      await user.click(
        within(await screen.findByRole('listbox')).getByRole('option', { name: 'Yes' })
      )
      await fillNameAndSubmit()

      expect(surveyRequests).toEqual([
        { slug: NEW_ORG_SLUG, kind: 'COMPANY', size: '50', can_code: 'yes' },
      ])
      expect(readFollowUpState()).toBeNull()
    })

    it('keeps the answers for the follow-up when the survey request fails', async () => {
      const { surveyRequests } = mockApi({ surveyStatus: 500 })
      renderForm('org_form')

      await chooseOption('Personal', 'Company')
      await chooseOption('Select an option', 'Other')
      await fillNameAndSubmit()

      expect(surveyRequests).toHaveLength(1)
      expect(readFollowUpState()).toMatchObject({ status: 'pending', kind: 'COMPANY', size: '1' })
    })
  })

  it.each([
    ['the control arm', 'control'],
    ['a user the flag has not assigned', false],
    ['flags that have not loaded', undefined],
  ] as const)('creates the org with its type and no survey for %s', async (_, flag) => {
    const { createRequests, surveyRequests } = mockApi()
    renderForm(flag)

    expect(screen.queryByText('Help improve Supabase')).toBeNull()
    await chooseOption('Personal', 'Company')
    await fillNameAndSubmit()

    expect(createRequests).toEqual([
      { name: 'Acme', kind: 'COMPANY', size: '1', tier: 'tier_free' },
    ])
    expect(surveyRequests).toEqual([])
    expect(readFollowUpState()).toBeNull()
  })
})
