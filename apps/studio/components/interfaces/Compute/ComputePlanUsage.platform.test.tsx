import { screen, waitFor } from '@testing-library/react'
import { platformComponents } from 'api-types'
import { HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'

import type { ComputeInstance } from './Compute.types'
import { ComputePlanUsage } from './ComputePlanUsage'
import type { ProfileContextType } from '@/lib/profile'
import { createMockOrganizationResponse } from '@/tests/helpers'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

type OrganizationResponse = platformComponents['schemas']['OrganizationResponse']
type ProjectDetailResponse = platformComponents['schemas']['ProjectDetailResponse_Output']

vi.mock('common', async (importOriginal) => ({
  ...(await importOriginal<typeof import('common')>()),
  useParams: () => ({ ref: 'default', slug: 'acme' }),
  // useSelectedOrganizationQuery holds its query until the session resolves.
  useIsLoggedIn: () => true,
}))

/** useOrganizationsQuery holds its query until a profile is present. */
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

const instance = (overrides: Partial<ComputeInstance> = {}): ComputeInstance => ({
  name: 'embed',
  buildState: 'active',
  isDeleting: false,
  runtime: 'node',
  size: '2gb-1vcpu',
  access: 'public',
  declaredInstances: 1,
  ...overrides,
})

/** The component only reads `plan`, but the org lookup needs the project detail too. */
const mockOrganizationOnPlan = (id: string, name: string) => {
  addAPIMock({
    method: 'get',
    path: '/platform/organizations',
    response: () =>
      HttpResponse.json<OrganizationResponse[]>([
        createMockOrganizationResponse({ id: 1, slug: 'acme', name: 'Acme', plan: { id, name } }),
      ]),
  })
  addAPIMock({
    method: 'get',
    path: '/platform/projects/:ref',
    response: () =>
      HttpResponse.json<ProjectDetailResponse>({
        id: 1,
        ref: 'default',
        name: 'Default project',
        organization_id: 1,
        status: 'ACTIVE_HEALTHY',
        cloud_provider: 'AWS',
        region: 'us-east-1',
        inserted_at: '2025-02-16T22:24:42.115195',
      } as unknown as ProjectDetailResponse),
  })
}

describe('ComputePlanUsage', () => {
  it('shows active hours and instances against what the plan includes', async () => {
    mockOrganizationOnPlan('pro', 'Pro')
    customRender(<ComputePlanUsage projectRef="default" instances={[instance()]} />, {
      profileContext: PROFILE_CONTEXT,
    })

    expect(await screen.findByText('Plan usage')).toBeInTheDocument()
    expect(await screen.findByText('Active hours')).toBeInTheDocument()
    expect(await screen.findByText('Instances')).toBeInTheDocument()
    // Pro includes 10 instances; one is deployed.
    expect(await screen.findByText('1 of 10')).toBeInTheDocument()
  })

  it('counts declared instances across every deployment', async () => {
    mockOrganizationOnPlan('pro', 'Pro')
    customRender(
      <ComputePlanUsage
        projectRef="default"
        instances={[
          instance({ name: 'a', declaredInstances: 3 }),
          instance({ name: 'b', declaredInstances: 2 }),
        ]}
      />,
      { profileContext: PROFILE_CONTEXT }
    )

    expect(await screen.findByText('5 of 10')).toBeInTheDocument()
  })

  it('flags the instance meter once the plan limit is exceeded', async () => {
    mockOrganizationOnPlan('free', 'Free')
    customRender(
      <ComputePlanUsage
        projectRef="default"
        instances={[instance({ name: 'a', declaredInstances: 2 })]}
      />,
      { profileContext: PROFILE_CONTEXT }
    )

    // Free includes a single instance.
    expect(await screen.findByText('2 of 1')).toBeInTheDocument()
    expect(await screen.findByText('Over limit')).toBeInTheDocument()
  })

  it('reports no fixed limit on enterprise rather than inventing one', async () => {
    mockOrganizationOnPlan('enterprise', 'Enterprise')
    customRender(<ComputePlanUsage projectRef="default" instances={[instance()]} />, {
      profileContext: PROFILE_CONTEXT,
    })

    await waitFor(() => {
      expect(screen.getAllByText(/No fixed limit on the Enterprise Plan/).length).toBeGreaterThan(0)
    })
  })

  it('names the plan the meters are measured against', async () => {
    mockOrganizationOnPlan('team', 'Team')
    customRender(<ComputePlanUsage projectRef="default" instances={[instance()]} />, {
      profileContext: PROFILE_CONTEXT,
    })

    expect(await screen.findByText(/Team Plan · last 30 days/)).toBeInTheDocument()
    expect(await screen.findByText('1 of 25')).toBeInTheDocument()
  })
})
