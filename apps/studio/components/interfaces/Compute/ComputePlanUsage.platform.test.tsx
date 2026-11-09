import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { platformComponents } from 'api-types'
import { LOCAL_STORAGE_KEYS } from 'common'
import { HttpResponse } from 'msw'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

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
  const block = heading.closest('div')?.parentElement?.parentElement
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

const setComputeLimitsMode = (mode: 'alpha' | 'plans') => {
  vi.stubEnv('NEXT_PUBLIC_ENVIRONMENT', 'local')
  localStorage.setItem(LOCAL_STORAGE_KEYS.COMPUTE_LIMITS_MODE, JSON.stringify(mode))
}

afterEach(() => {
  vi.unstubAllEnvs()
  localStorage.removeItem(LOCAL_STORAGE_KEYS.COMPUTE_LIMITS_MODE)
  localStorage.removeItem(LOCAL_STORAGE_KEYS.COMPUTE_PLAN_USAGE_COLLAPSED)
})

describe('ComputePlanUsage', () => {
  beforeEach(() => setComputeLimitsMode('plans'))

  it('meters runtime and concurrent workers against what the plan includes', async () => {
    mockOrganizationOnPlan('pro', 'Pro')
    customRender(<ComputePlanUsage projectRef="default" instances={[instance()]} />, {
      profileContext: PROFILE_CONTEXT,
    })

    expect(await screen.findByText('Usage')).toBeInTheDocument()
    expect(await screen.findByText('Runtime')).toBeInTheDocument()
    expect(await screen.findByText('Concurrent workers')).toBeInTheDocument()
    // vCPU-hours and GB-hours price the overage; they are not metered quotas.
    expect(screen.queryByText('GB-hours')).not.toBeInTheDocument()
    expect(screen.queryByText('Deployments')).not.toBeInTheDocument()
    // The RFC includes 500 minutes per cycle on every plan.
    expect(await screen.findByText(/of 500 min$/)).toBeInTheDocument()
  })

  it('reports CPU utilisation and the billing dimensions alongside runtime', async () => {
    mockOrganizationOnPlan('pro', 'Pro')
    customRender(<ComputePlanUsage projectRef="default" instances={[instance()]} />, {
      profileContext: PROFILE_CONTEXT,
    })

    expect(await screen.findByText(/\d+% CPU used · [\d,]+ vCPU-hrs/)).toBeInTheDocument()
  })

  it('sums instances across computes and names how many computes run them', async () => {
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

    // Paid concurrency is undecided in the RFC, so the count reports without a limit.
    expect(await screen.findByText('7 used')).toBeInTheDocument()
    expect(await screen.findByText('Across 2 computes')).toBeInTheDocument()
  })

  it('marks a worker count that fills the plan limit as at limit, not over', async () => {
    mockOrganizationOnPlan('free', 'Free')
    customRender(<ComputePlanUsage projectRef="default" instances={[instance()]} />, {
      profileContext: PROFILE_CONTEXT,
    })

    const instanceMeter = await meter('Concurrent workers')
    expect(await instanceMeter.findByText('1 of 1')).toBeInTheDocument()
    expect(instanceMeter.getByText('At limit')).toBeInTheDocument()
    expect(instanceMeter.queryByText('Over limit')).not.toBeInTheDocument()
  })

  it('flags a worker count that exceeds the plan limit', async () => {
    mockOrganizationOnPlan('free', 'Free')
    customRender(
      <ComputePlanUsage
        projectRef="default"
        instances={[instance({ name: 'a', declaredInstances: 2 })]}
      />,
      { profileContext: PROFILE_CONTEXT }
    )

    const instanceMeter = await meter('Concurrent workers')
    expect(await instanceMeter.findByText('2 of 1')).toBeInTheDocument()
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

  it('includes the same quota on a higher tier, and says concurrency is unlimited there', async () => {
    mockOrganizationOnPlan('team', 'Team')
    customRender(<ComputePlanUsage projectRef="default" instances={[instance()]} />, {
      profileContext: PROFILE_CONTEXT,
    })

    // Team includes the same 500-minute quota as every other plan; what differs is that
    // its concurrency is uncapped, which the caption names.
    expect(await screen.findByText(/of 500 min$/)).toBeInTheDocument()
    expect(await screen.findByText('No fixed limit on the Team Plan')).toBeInTheDocument()
  })

  it('switches the usage timeframe from the dropdown', async () => {
    mockOrganizationOnPlan('pro', 'Pro')
    customRender(<ComputePlanUsage projectRef="default" instances={[instance()]} />, {
      profileContext: PROFILE_CONTEXT,
    })

    await userEvent.click(await screen.findByRole('button', { name: 'Last 30 days' }))
    await userEvent.click(await screen.findByRole('menuitemradio', { name: 'Last 7 days' }))

    expect(await screen.findByRole('button', { name: 'Last 7 days' })).toBeInTheDocument()
  })
})

describe('ComputePlanUsage in private alpha', () => {
  beforeEach(() => setComputeLimitsMode('alpha'))

  it('measures concurrent workers against the alpha cap', async () => {
    mockOrganizationOnPlan('pro', 'Pro')
    customRender(<ComputePlanUsage projectRef="default" instances={[instance()]} />, {
      profileContext: PROFILE_CONTEXT,
    })

    expect(await screen.findByText('1 of 2')).toBeInTheDocument()
  })

  it('flags concurrent workers over the alpha cap', async () => {
    mockOrganizationOnPlan('pro', 'Pro')
    customRender(
      <ComputePlanUsage
        projectRef="default"
        instances={[instance({ name: 'a', declaredInstances: 3 })]}
      />,
      { profileContext: PROFILE_CONTEXT }
    )

    const instanceMeter = await meter('Concurrent workers')
    expect(instanceMeter.getByText('3 of 2')).toBeInTheDocument()
    expect(instanceMeter.getByText('Over limit')).toBeInTheDocument()
  })

  it('does not meter runtime during the private alpha', async () => {
    mockOrganizationOnPlan('pro', 'Pro')
    customRender(<ComputePlanUsage projectRef="default" instances={[instance()]} />, {
      profileContext: PROFILE_CONTEXT,
    })

    await waitFor(() => {
      expect(screen.getAllByText('Not metered during private alpha')).toHaveLength(1)
    })
  })

  it('shows compact meters in the header when collapsed', async () => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.COMPUTE_PLAN_USAGE_COLLAPSED, 'true')
    mockOrganizationOnPlan('pro', 'Pro')
    customRender(<ComputePlanUsage projectRef="default" instances={[instance()]} />, {
      profileContext: PROFILE_CONTEXT,
    })

    expect(await screen.findByLabelText('Concurrent workers: 1 of 2')).toBeInTheDocument()
    expect(screen.queryByText('Runtime', { selector: 'p' })).not.toBeInTheDocument()
  })
})
