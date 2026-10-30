import { screen, waitFor, within } from '@testing-library/react'
import { platformComponents } from 'api-types'
import { HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'

import type { ComputeInstance } from './Compute.types'
import { ComputePlanUsage } from './ComputePlanUsage'
import type { OrgPlan } from '@/data/subscriptions/types'
import type { ProfileContextType } from '@/lib/profile'
import { createMockOrganizationResponse } from '@/tests/helpers'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

type OrganizationResponse = platformComponents['schemas']['OrganizationResponse_Output']
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

/** Each meter is a block headed by its label; scope assertions to the one under test. */
const meter = async (label: string) => {
  const heading = await screen.findByText(label)
  const block = heading.closest('div')?.parentElement
  if (block === null || block === undefined) throw new Error(`No meter block for ${label}`)
  return within(block)
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
const mockOrganizationOnPlan = (id: OrgPlan['id'], name: string) => {
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
  it('meters active hours, computes and instances against what the plan includes', async () => {
    mockOrganizationOnPlan('pro', 'Pro')
    customRender(<ComputePlanUsage projectRef="default" instances={[instance()]} />, {
      profileContext: PROFILE_CONTEXT,
    })

    expect(await screen.findByText('Plan usage')).toBeInTheDocument()
    expect(await screen.findByText('Active hours')).toBeInTheDocument()
    expect(await screen.findByText('Computes')).toBeInTheDocument()
    expect(await screen.findByText('Instances')).toBeInTheDocument()
    // Pro includes 5 computes and 10 instances; one compute running one instance is deployed.
    expect(await screen.findByText('1 of 5')).toBeInTheDocument()
    expect(await screen.findByText('1 of 10')).toBeInTheDocument()
  })

  it('counts computes separately from the instances they run', async () => {
    mockOrganizationOnPlan('pro', 'Pro')
    customRender(
      <ComputePlanUsage
        projectRef="default"
        instances={[
          instance({ name: 'a', declaredInstances: 3 }),
          instance({ name: 'b', declaredInstances: 4 }),
        ]}
      />,
      { profileContext: PROFILE_CONTEXT }
    )

    // Two computes, seven instances between them.
    expect(await screen.findByText('2 of 5')).toBeInTheDocument()
    expect(await screen.findByText('7 of 10')).toBeInTheDocument()
  })

  it('flags a count that exceeds the plan limit, but not one that merely fills it', async () => {
    mockOrganizationOnPlan('free', 'Free')
    customRender(
      <ComputePlanUsage
        projectRef="default"
        instances={[instance({ name: 'a', declaredInstances: 2 })]}
      />,
      { profileContext: PROFILE_CONTEXT }
    )

    // Free includes one compute and one instance: the single compute fills its limit,
    // while two instances exceed theirs.
    const computes = await meter('Computes')
    expect(computes.getByText('1 of 1')).toBeInTheDocument()
    expect(computes.getByText('At limit')).toBeInTheDocument()
    expect(computes.queryByText('Over limit')).not.toBeInTheDocument()

    const instanceMeter = await meter('Instances')
    expect(instanceMeter.getByText('2 of 1')).toBeInTheDocument()
    expect(instanceMeter.getByText('Over limit')).toBeInTheDocument()
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
    expect(await screen.findByText('1 of 15')).toBeInTheDocument()
    expect(await screen.findByText('1 of 25')).toBeInTheDocument()
  })
})
