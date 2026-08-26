import { PermissionAction } from '@supabase/shared-types/out/constants'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { platformComponents as components } from 'api-types'
import { HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import type { ProfileContextType } from '@/lib/profile'
import InfrastructurePage from '@/pages/project/[ref]/settings/infrastructure'
import { createMockOrganizationResponse } from '@/tests/helpers'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

type ProjectDetailResponse = components['schemas']['ProjectDetailResponse']
type ProjectAddonsResponse = components['schemas']['ProjectAddonsResponse']
type PermissionResponse = components['schemas']['AccessControlPermission']

const PROJECT_REF = 'project-ref'
const ORGANIZATION_SLUG = 'acme'

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

const PROJECT: ProjectDetailResponse = {
  cloud_provider: 'AWS',
  connectionString: 'postgresql://postgres:password@db.project-ref.supabase.co:5432/postgres',
  db_host: 'db.project-ref.supabase.co',
  dbVersion: 'supabase-postgres-15.1.0',
  high_availability: false,
  id: 1,
  infra_compute_size: 'micro',
  inserted_at: '2026-01-01T00:00:00.000Z',
  integration_source: null,
  is_branch_enabled: false,
  is_physical_backups_enabled: false,
  name: 'Production',
  organization_id: 1,
  ref: PROJECT_REF,
  region: 'us-east-1',
  restUrl: `https://${PROJECT_REF}.supabase.co`,
  status: 'ACTIVE_HEALTHY',
  subscription_id: 'subscription-1',
  updated_at: '2026-01-01T00:00:00.000Z',
}

const COMPUTE_VARIANTS: ProjectAddonsResponse['available_addons'][number]['variants'] = [
  {
    identifier: 'ci_micro',
    name: 'Micro',
    price: 0.01344,
    price_description: '$0.01344/hour (~$10/month)',
    price_interval: 'hourly',
    price_type: 'usage',
    meta: { cpu_cores: 2, memory_gb: 1 },
  },
  {
    identifier: 'ci_small',
    name: 'Small',
    price: 0.0206,
    price_description: '$0.0206/hour (~$15/month)',
    price_interval: 'hourly',
    price_type: 'usage',
    meta: { cpu_cores: 2, memory_gb: 2 },
  },
  {
    identifier: 'ci_large',
    name: 'Large',
    price: 0.1517,
    price_description: '$0.1517/hour (~$110/month)',
    price_interval: 'hourly',
    price_type: 'usage',
    meta: { cpu_cores: 2, memory_gb: 8 },
  },
]

vi.mock('common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('common')>()
  return {
    ...actual,
    IS_PLATFORM: true,
    useIsLoggedIn: () => true,
    useParams: () => ({ ref: PROJECT_REF }),
  }
})

vi.mock('@/lib/constants', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/constants')>()
  return {
    ...actual,
    IS_PLATFORM: true,
  }
})

vi.mock('ui-patterns/Admonition', () => ({
  Admonition: ({
    children,
    description,
    title,
  }: {
    children?: ReactNode
    description?: ReactNode
    title?: ReactNode
  }) => (
    <div>
      {title}
      {description}
      {children}
    </div>
  ),
}))

vi.mock('ui-patterns/Chart', () => ({
  Chart: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  ChartCard: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  ChartContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  ChartEmptyState: ({ title }: { title: ReactNode }) => <div>{title}</div>,
  ChartHeader: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  ChartLine: () => <div data-testid="usage-chart" />,
  ChartLoadingState: () => <div>Loading chart</div>,
  ChartMetric: ({ label, value }: { label: ReactNode; value: ReactNode }) => (
    <div data-testid={`metric-${label}`}>
      {label}: {value}
    </div>
  ),
}))

function mockInfrastructureEndpoints() {
  addAPIMock({
    method: 'get',
    path: '/platform/projects/:ref',
    response: PROJECT,
  })
  addAPIMock({
    method: 'get',
    path: '/platform/organizations',
    response: [
      createMockOrganizationResponse({
        id: 1,
        slug: ORGANIZATION_SLUG,
        plan: { id: 'pro', name: 'Pro' },
        usage_billing_enabled: true,
      }),
    ],
  })
  addAPIMock({
    method: 'get',
    path: '/platform/organizations/:slug/entitlements',
    response: {
      entitlements: [
        {
          config: { enabled: true },
          feature: {
            key: 'instances.compute_update_available_sizes',
            type: 'boolean',
          },
          hasAccess: true,
          type: 'boolean',
        },
      ],
    },
  })
  addAPIMock({
    method: 'get',
    path: '/platform/profile/permissions',
    response: [
      {
        actions: [PermissionAction.UPDATE],
        condition: null,
        organization_id: 1,
        organization_slug: ORGANIZATION_SLUG,
        project_ids: [PROJECT.id],
        project_refs: [PROJECT_REF],
        resources: ['projects'],
        restrictive: false,
      } satisfies PermissionResponse,
    ],
  })
  addAPIMock({
    method: 'get',
    path: '/platform/projects-resource-warnings',
    response: [],
  })
  addAPIMock({
    method: 'get',
    path: '/platform/projects/:ref/databases',
    response: [
      {
        cloud_provider: 'AWS',
        connection_string_read_only: PROJECT.connectionString,
        connectionString: PROJECT.connectionString,
        db_host: PROJECT.db_host,
        db_name: 'postgres',
        db_port: 5432,
        db_user: 'postgres',
        identifier: PROJECT_REF,
        inserted_at: PROJECT.inserted_at,
        region: PROJECT.region,
        restUrl: PROJECT.restUrl,
        size: 't4g.small',
        status: 'ACTIVE_HEALTHY',
      },
    ],
  })
  addAPIMock({
    method: 'get',
    path: '/platform/projects/:ref/disk',
    response: {
      attributes: {
        iops: 3000,
        size_gb: 100,
        throughput_mbps: 125,
        throughput_mibps: 125,
        type: 'gp3',
      },
    },
  })
  addAPIMock({
    method: 'get',
    path: '/platform/projects/:ref/disk/util',
    response: {
      metrics: {
        fs_avail_bytes: 60 * 1024 * 1024 * 1024,
        fs_size_bytes: 100 * 1024 * 1024 * 1024,
        fs_used_bytes: 40 * 1024 * 1024 * 1024,
      },
      timestamp: '2026-07-20T00:00:00.000Z',
    },
  })
  addAPIMock({
    method: 'get',
    path: '/platform/projects/:ref/disk/custom-config',
    response: {
      growth_percent: 20,
      max_size_gb: 1000,
      min_increment_gb: 10,
    },
  })
  addAPIMock({
    method: 'get',
    path: '/platform/projects/:ref/billing/addons',
    response: {
      available_addons: [
        {
          name: 'Compute Instance',
          type: 'compute_instance',
          variants: COMPUTE_VARIANTS,
        },
      ],
      ref: PROJECT_REF,
      selected_addons: [
        {
          type: 'compute_instance',
          variant: COMPUTE_VARIANTS[0],
        },
      ],
    },
  })
  addAPIMock({
    method: 'get',
    path: '/platform/projects/:ref/infra-monitoring',
    response: () =>
      HttpResponse.json({
        series: {},
        data: [
          {
            period_start: '2026-07-20T00:00:00.000Z',
            values: {
              max_cpu_usage: '40',
              ram_usage: '50',
              disk_io_consumption: '60',
              pg_database_size: String(40 * 1024 * 1024 * 1024),
              disk_fs_used_wal: String(5 * 1024 * 1024 * 1024),
              disk_fs_used_system: String(5 * 1024 * 1024 * 1024),
              disk_fs_size: String(100 * 1024 * 1024 * 1024),
            },
          },
        ],
      }),
  })
}

function renderInfrastructurePage() {
  return customRender(<InfrastructurePage dehydratedState={{}} />, {
    profileContext: PROFILE_CONTEXT,
  })
}

describe('/project/[ref]/settings/infrastructure', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockInfrastructureEndpoints()
    window.HTMLElement.prototype.scrollIntoView = vi.fn()
  })

  test('loads the complete infrastructure page through MSW and resets an interaction', async () => {
    const user = userEvent.setup()
    renderInfrastructurePage()

    expect(screen.getByRole('heading', { name: 'Infrastructure', level: 1 })).toBeInTheDocument()
    expect(screen.getByText('Scaling')).toBeInTheDocument()
    expect(screen.getByText('Compute size')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Disk', level: 2 })).toBeInTheDocument()
    // The Advanced section renders only once the project query resolves (isAws)
    expect(await screen.findByText('Advanced')).toBeInTheDocument()

    const diskSize = await screen.findByRole('spinbutton', { name: 'Disk size' })
    await waitFor(() => expect(diskSize).toHaveValue(100))
    expect(screen.getByRole('spinbutton', { name: 'IOPS' })).toHaveValue(3000)
    expect(screen.getByRole('spinbutton', { name: 'Throughput' })).toHaveValue(125)
    expect(screen.getByTestId('metric-CPU')).toHaveTextContent('40%')
    expect(screen.getByTestId('metric-Memory')).toHaveTextContent('50%')
    expect(screen.getByTestId('metric-Disk')).toHaveTextContent('50%')

    await user.click(screen.getByText('Small'))
    expect(screen.getByRole('button', { name: 'Review changes' })).toBeEnabled()

    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: 'Review changes' })).not.toBeInTheDocument()
    })
  })

  test('focuses the recommended compute option after closing the add replica sheet', async () => {
    const user = userEvent.setup()
    renderInfrastructurePage()

    await user.click(await screen.findByRole('button', { name: 'Add read replica' }))
    await user.click(await screen.findByRole('button', { name: 'Change to Small compute' }))

    const smallCompute = await screen.findByRole('radio', { name: /Small/ })
    await waitFor(() => expect(smallCompute).toHaveFocus())
    expect(smallCompute).toBeChecked()
  })

  test('reviews and confirms a compute resize through the add-on API', async () => {
    const user = userEvent.setup()
    let addonRequest: unknown

    addAPIMock({
      method: 'post',
      path: '/platform/projects/:ref/billing/addons',
      response: async ({ request }) => {
        addonRequest = await request.json()
        return new HttpResponse(null, { status: 201 })
      },
    })

    renderInfrastructurePage()

    await user.click(await screen.findByText('Small'))
    await user.click(screen.getByRole('button', { name: 'Review changes' }))

    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText('Compute size')).toBeInTheDocument()
    expect(within(dialog).getByText('Micro')).toBeInTheDocument()
    expect(within(dialog).getByText('Small')).toBeInTheDocument()

    await user.click(within(dialog).getByRole('button', { name: 'Confirm changes' }))

    await waitFor(() => {
      expect(addonRequest).toEqual({
        addon_type: 'compute_instance',
        addon_variant: 'ci_small',
      })
    })
  })

  test('renders compute as read-only for High Availability projects', async () => {
    const user = userEvent.setup()

    addAPIMock({
      method: 'get',
      path: '/platform/projects/:ref',
      response: {
        ...PROJECT,
        cloud_provider: 'AWS_K8S',
        high_availability: true,
        infra_compute_size: 'large',
      } satisfies ProjectDetailResponse,
    })
    addAPIMock({
      method: 'get',
      path: '/platform/projects/:ref/billing/addons',
      response: {
        available_addons: [
          {
            name: 'Compute Instance',
            type: 'compute_instance',
            variants: COMPUTE_VARIANTS,
          },
        ],
        ref: PROJECT_REF,
        selected_addons: [
          {
            type: 'compute_instance',
            variant: COMPUTE_VARIANTS[2],
          },
        ],
      },
    })

    renderInfrastructurePage()

    expect(
      await screen.findByText("Compute size can't be changed on High Availability projects")
    ).toBeInTheDocument()

    const largeCompute = await screen.findByRole('radio', { name: /Large/ })
    await waitFor(() => expect(largeCompute).toBeChecked())

    const microCompute = screen.getByRole('radio', { name: /Micro/ })
    const smallCompute = screen.getByRole('radio', { name: /Small/ })
    expect(largeCompute).toBeDisabled()
    expect(microCompute).toBeDisabled()
    expect(smallCompute).toBeDisabled()

    // The "Contact Us" card for larger sizes is hidden for High Availability projects
    expect(screen.queryByText('Contact Us')).not.toBeInTheDocument()

    // Clicking a locked option must not dirty the form or surface the submit flow
    await user.click(smallCompute)
    expect(largeCompute).toBeChecked()
    expect(screen.queryByRole('button', { name: 'Review changes' })).not.toBeInTheDocument()
  })

  test('keeps compute editable for non High Availability projects', async () => {
    const user = userEvent.setup()
    renderInfrastructurePage()

    expect(
      screen.queryByText("Compute size can't be changed on High Availability projects")
    ).not.toBeInTheDocument()

    const smallCompute = await screen.findByRole('radio', { name: /Small/ })
    expect(smallCompute).toBeEnabled()
    expect(screen.getByText('Contact Us')).toBeInTheDocument()

    await user.click(smallCompute)
    expect(screen.getByRole('button', { name: 'Review changes' })).toBeEnabled()
  })

  test('submits disk and autoscaling changes to both infrastructure APIs', async () => {
    const user = userEvent.setup()
    let diskRequest: unknown
    let autoscaleRequest: unknown

    addAPIMock({
      method: 'post',
      path: '/platform/projects/:ref/disk',
      response: async ({ request }) => {
        diskRequest = await request.json()
        return new HttpResponse(null, { status: 201 })
      },
    })
    addAPIMock({
      method: 'post',
      path: '/platform/projects/:ref/disk/custom-config',
      response: async ({ request }) => {
        autoscaleRequest = await request.json()
        return HttpResponse.json(
          {
            growth_percent: 20,
            max_size_gb: 1200,
            min_increment_gb: 10,
          },
          { status: 201 }
        )
      },
    })

    renderInfrastructurePage()

    const diskSize = await screen.findByRole('spinbutton', { name: 'Disk size' })
    await waitFor(() => expect(diskSize).toHaveValue(100))
    await user.clear(diskSize)
    await user.type(diskSize, '120')

    const maxDiskSize = screen.getByRole('spinbutton', { name: 'Maximum disk size' })
    await user.clear(maxDiskSize)
    await user.type(maxDiskSize, '1200')

    await user.click(screen.getByRole('button', { name: 'Review changes' }))
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText('Disk size')).toBeInTheDocument()
    expect(within(dialog).getByText('Max disk size')).toBeInTheDocument()

    await user.click(within(dialog).getByRole('button', { name: 'Confirm changes' }))

    await waitFor(() => {
      expect(diskRequest).toEqual({
        attributes: {
          iops: 3000,
          size_gb: 120,
          throughput_mbps: 125,
          type: 'gp3',
        },
      })
      expect(autoscaleRequest).toEqual({
        growth_percent: 20,
        max_size_gb: 1200,
        min_increment_gb: 10,
      })
    })
  })
})
