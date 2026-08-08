import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { platformComponents as components } from 'api-types'
import { mockAnimationsApi } from 'jsdom-testing-mocks'
import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { NewOrgForm } from '@/components/interfaces/Organization/NewOrg/NewOrgForm'
import { BASE_PATH } from '@/lib/constants'
import { createMockOrganizationResponse } from '@/tests/helpers'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock, mswServer } from '@/tests/lib/msw'
import { createMockProfileContext } from '@/tests/lib/profile-helpers'

type OrganizationResponse = components['schemas']['OrganizationResponse']

mockAnimationsApi()

vi.mock('@/lib/telemetry/track', () => ({ useTrack: () => vi.fn() }))

const EXISTING_ORG_NAME = 'Acme Inc.'

const mockScaffolding = (organizations: OrganizationResponse[]) => {
  addAPIMock({
    method: 'get',
    path: '/platform/organizations',
    response: () => HttpResponse.json<OrganizationResponse[]>(organizations),
  })
  addAPIMock({
    method: 'get',
    path: '/platform/projects',
    // @ts-expect-error - Version 2 response shape isn't reflected in the generated paths type
    response: () => HttpResponse.json({ projects: [], pagination: { count: 0 } }),
  })
  // `/api/enabled-features-overrides` is a Next.js route, not an OpenAPI path,
  // so addAPIMock can't type it — register a raw handler.
  mswServer.use(
    http.get(`${BASE_PATH}/api/enabled-features-overrides`, () =>
      HttpResponse.json({ disabled_features: [] })
    )
  )
}

const renderForm = (
  organizations: OrganizationResponse[] = [
    createMockOrganizationResponse({ id: 1, name: EXISTING_ORG_NAME, slug: 'acme-inc' }),
  ]
) => {
  mockScaffolding(organizations)
  return customRender(<NewOrgForm onPaymentMethodReset={vi.fn()} onPlanSelected={vi.fn()} />, {
    profileContext: createMockProfileContext(),
  })
}

describe('NewOrgForm', () => {
  let user: ReturnType<typeof userEvent.setup>

  beforeEach(() => {
    user = userEvent.setup()
  })

  test('shows a non-blocking warning when the name matches an existing organization, case-insensitively and ignoring whitespace', async () => {
    renderForm()

    const nameInput = await screen.findByPlaceholderText('Organization name')

    await user.type(nameInput, '  aCME inc.  ')

    expect(
      await screen.findByText(
        `You are already a member of an organization named "${EXISTING_ORG_NAME}". Please choose a different name.`
      )
    ).toBeInTheDocument()

    expect(screen.getByRole('button', { name: 'Create organization' })).toBeEnabled()
  })

  test('clears the warning once the name no longer matches an existing organization', async () => {
    renderForm()

    const nameInput = await screen.findByPlaceholderText('Organization name')

    await user.type(nameInput, EXISTING_ORG_NAME)
    await screen.findByText(/You are already a member of an organization named/)

    await user.type(nameInput, 'x')

    expect(
      screen.queryByText(/You are already a member of an organization named/)
    ).not.toBeInTheDocument()
  })
})
