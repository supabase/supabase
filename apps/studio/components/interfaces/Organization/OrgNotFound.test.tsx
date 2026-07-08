import { screen } from '@testing-library/react'
import { platformComponents as components } from 'api-types'
import { HttpResponse } from 'msw'
import { describe, expect, test } from 'vitest'

import { OrgNotFound } from './OrgNotFound'
import type { ProfileContextType } from '@/lib/profile'
import { createMockOrganizationResponse } from '@/tests/helpers'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock, type APIErrorBody } from '@/tests/lib/msw'

type OrganizationResponse = components['schemas']['OrganizationResponse']
type OrganizationProjectsResponse = components['schemas']['OrganizationProjectsResponse']

const PROFILE_CONTEXT: ProfileContextType = {
  profile: {
    id: 1,
    auth0_id: 'auth0|test',
    gotrue_id: 'gotrue-test',
    username: 'testuser',
    primary_email: 'test@example.com',
    first_name: null,
    last_name: null,
    mobile: null,
    is_alpha_user: false,
    is_sso_user: false,
    disabled_features: [],
    free_project_limit: null,
  },
  error: null,
  isLoading: false,
  isError: false,
  isSuccess: true,
}

const mockEmptyProjectsResponse = () => {
  addAPIMock({
    method: 'get',
    path: '/platform/organizations/:slug/projects',
    response: () =>
      HttpResponse.json<OrganizationProjectsResponse>({
        pagination: { count: 0, limit: 96, offset: 0 },
        projects: [],
      }),
  })
}

describe('OrgNotFound', () => {
  test('renders the not-found admonition with the slug', async () => {
    addAPIMock({
      method: 'get',
      path: '/platform/organizations',
      response: () => HttpResponse.json<OrganizationResponse[]>([]),
    })

    customRender(<OrgNotFound slug="ghost-org" />, { profileContext: PROFILE_CONTEXT })

    expect(await screen.findByText('Organization not found')).toBeInTheDocument()
    expect(screen.getByText('ghost-org')).toBeInTheDocument()
  })

  test('renders an organization card for each org returned from the API', async () => {
    addAPIMock({
      method: 'get',
      path: '/platform/organizations',
      response: () =>
        HttpResponse.json<OrganizationResponse[]>([
          createMockOrganizationResponse({ slug: 'acme-prod', name: 'Acme Production' }),
          createMockOrganizationResponse({ slug: 'acme-dev', name: 'Acme Development' }),
        ]),
    })
    mockEmptyProjectsResponse()

    customRender(<OrgNotFound slug="ghost-org" />, { profileContext: PROFILE_CONTEXT })

    expect(await screen.findByText('Acme Production')).toBeInTheDocument()
    expect(screen.getByText('Acme Development')).toBeInTheDocument()
  })

  test('shows an error admonition when the organizations query fails', async () => {
    addAPIMock({
      method: 'get',
      path: '/platform/organizations',
      response: () =>
        HttpResponse.json<APIErrorBody>({ message: 'Boom from the backend' }, { status: 500 }),
    })

    customRender(<OrgNotFound slug="ghost-org" />, { profileContext: PROFILE_CONTEXT })

    expect(await screen.findByText('Failed to load organizations')).toBeInTheDocument()
  })
})
