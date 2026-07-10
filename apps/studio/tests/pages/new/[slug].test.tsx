import { PermissionAction } from '@supabase/shared-types/out/constants'
import { configure, fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { platformComponents as components } from 'api-types'
import { FeatureFlagContext } from 'common'
import { mockAnimationsApi } from 'jsdom-testing-mocks'
import { HttpResponse } from 'msw'
import { toast } from 'sonner'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { AUTO_ENABLE_RLS_EVENT_TRIGGER_SQL } from '@/components/interfaces/Database/Triggers/EventTriggersList/EventTriggers.constants'
import { createMockOrganizationResponse } from '@/tests/helpers'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock, type APIErrorBody } from '@/tests/lib/msw'
import { createMockProfileContext } from '@/tests/lib/profile-helpers'
import { routerMock } from '@/tests/lib/route-mock'
import type { Permission } from '@/types'

type OrganizationResponse = components['schemas']['OrganizationResponse']
type CreateProjectBody = components['schemas']['CreateProjectBody']
type CreateProjectResponse = components['schemas']['CreateProjectResponse']
type RegionsInfo = components['schemas']['RegionsInfo']
type MemberWithFreeProjectLimit = components['schemas']['MemberWithFreeProjectLimit']
type OverdueInvoiceCount = components['schemas']['OverdueInvoiceCount']
type OrganizationProjectsResponse = components['schemas']['OrganizationProjectsResponse']
type Entitlement = components['schemas']['ListEntitlementsResponse']['entitlements'][number]
type AvailableVersion = {
  postgres_engine: '15' | '17' | '17-oriole'
  release_channel: 'internal' | 'alpha' | 'beta' | 'ga' | 'withdrawn' | 'preview'
  version: string
}
type GitHubRepositoriesResponse = {
  partial_response_due_to_sso: boolean
  repositories: { id: number; installation_id: number; name: string; default_branch: string }[]
}

mockAnimationsApi()

configure({ asyncUtilTimeout: 5000 })
vi.setConfig({ testTimeout: 30000 })

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}))

vi.mock('@/lib/password-strength', () => ({
  passwordNeedsPercentEncoding: () => false,
  passwordStrength: async (value: string) =>
    value.length >= 12
      ? { message: 'This password is strong.', warning: '', strength: 4 }
      : {
          message: 'This password is not secure enough.',
          warning: 'This password is not secure enough. You need a stronger password.',
          strength: 1,
        },
}))

vi.mock('@/lib/telemetry/track', () => ({ useTrack: () => vi.fn() }))

vi.mock(import('common'), async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useParams: () => ({ slug: 'default-org' }),
    useIsLoggedIn: () => true,
  }
})

vi.mock(import('@/lib/constants'), async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    IS_PLATFORM: true,
  }
})

const ORG_SLUG = 'default-org'

const ADMIN_PERMISSIONS = [
  {
    actions: [PermissionAction.CREATE],
    resources: ['projects', 'integrations.github_connections'],
    condition: null,
    organization_slug: ORG_SLUG,
    project_refs: [],
    restrictive: false,
  },
] as unknown as Permission[]

const DEFAULT_AVAILABLE_REGIONS: RegionsInfo = {
  all: {
    smartGroup: [{ code: 'americas', name: 'Americas', type: 'smartGroup' }],
    specific: [
      { code: 'us-east-1', name: 'East US (North Virginia)', provider: 'AWS', type: 'specific' },
    ],
  },
  recommendations: {
    smartGroup: { code: 'americas', name: 'Americas', type: 'smartGroup' },
    specific: [
      { code: 'us-east-1', name: 'East US (North Virginia)', provider: 'AWS', type: 'specific' },
    ],
  },
}

const DEFAULT_AVAILABLE_VERSIONS: { available_versions: AvailableVersion[] } = {
  available_versions: [
    { postgres_engine: '15', release_channel: 'ga', version: 'supabase-postgres-15.6.1.139' },
    {
      postgres_engine: '17-oriole',
      release_channel: 'alpha',
      version: 'supabase-postgres-17.9.9.999-orioledb',
    },
  ],
}

const DEFAULT_ENTITLEMENTS: Entitlement[] = [
  {
    feature: { key: 'integrations.github_connections', type: 'boolean' },
    hasAccess: false,
    type: 'boolean',
    config: { enabled: false },
  } as Entitlement,
  {
    feature: { key: 'instances.high_availability', type: 'boolean' },
    hasAccess: true,
    type: 'boolean',
    config: { enabled: true },
  } as Entitlement,
]

const EMPTY_ORG_PROJECTS: OrganizationProjectsResponse = {
  pagination: { count: 0, limit: 96, offset: 0 },
  projects: [],
}

const mockOrg = (overrides: Partial<OrganizationResponse> = {}) =>
  createMockOrganizationResponse({
    id: 1,
    slug: ORG_SLUG,
    name: 'Acme',
    plan: { id: 'pro', name: 'Pro' },
    ...overrides,
  })

function mockWizardEndpoints(
  overrides: {
    organizations?: OrganizationResponse[]
    permissions?: Permission[]
    freeProjectLimitMembers?: MemberWithFreeProjectLimit[]
    overdueInvoices?: OverdueInvoiceCount[]
    orgProjects?: OrganizationProjectsResponse
    availableRegions?: RegionsInfo | 'error'
    availableVersions?: { available_versions: AvailableVersion[] }
    entitlements?: Entitlement[]
    githubAuthorization?: object | null
    githubRepositories?: GitHubRepositoriesResponse
  } = {}
) {
  addAPIMock({
    method: 'get',
    path: '/platform/organizations',
    response: () =>
      HttpResponse.json<OrganizationResponse[]>(overrides.organizations ?? [mockOrg()]),
  })
  addAPIMock({
    method: 'get',
    path: '/platform/profile/permissions',
    // @ts-expect-error - Permission is bridged from the raw API shape, not the generated type
    response: () => HttpResponse.json<Permission[]>(overrides.permissions ?? ADMIN_PERMISSIONS),
  })
  addAPIMock({
    method: 'get',
    path: '/platform/organizations/:slug/members/reached-free-project-limit',
    response: () =>
      HttpResponse.json<MemberWithFreeProjectLimit[]>(overrides.freeProjectLimitMembers ?? []),
  })
  addAPIMock({
    method: 'get',
    path: '/platform/stripe/invoices/overdue',
    response: () => HttpResponse.json<OverdueInvoiceCount[]>(overrides.overdueInvoices ?? []),
  })
  addAPIMock({
    method: 'get',
    path: '/platform/organizations/:slug/oauth/apps',
    // @ts-expect-error - response shape not in generated paths type
    response: () => HttpResponse.json([]),
  })
  addAPIMock({
    method: 'get',
    path: '/platform/organizations/:slug/projects',
    response: () =>
      HttpResponse.json<OrganizationProjectsResponse>(overrides.orgProjects ?? EMPTY_ORG_PROJECTS),
  })
  const availableRegions = overrides.availableRegions
  if (availableRegions === 'error') {
    addAPIMock({
      method: 'get',
      path: '/platform/projects/available-regions',
      response: () =>
        HttpResponse.json<APIErrorBody>({ message: 'Failed to load regions' }, { status: 500 }),
    })
  } else {
    addAPIMock({
      method: 'get',
      path: '/platform/projects/available-regions',
      response: () => HttpResponse.json<RegionsInfo>(availableRegions ?? DEFAULT_AVAILABLE_REGIONS),
    })
  }
  addAPIMock({
    method: 'post',
    path: '/platform/organizations/:slug/available-versions',
    response: () =>
      HttpResponse.json<{ available_versions: AvailableVersion[] }>(
        overrides.availableVersions ?? DEFAULT_AVAILABLE_VERSIONS
      ),
  })
  addAPIMock({
    method: 'get',
    path: '/platform/organizations/:slug/entitlements',
    response: () =>
      HttpResponse.json<{ entitlements: Entitlement[] }>({
        entitlements: overrides.entitlements ?? DEFAULT_ENTITLEMENTS,
      }),
  })
  addAPIMock({
    method: 'get',
    path: '/platform/integrations/github/authorization',
    // @ts-expect-error - authorization payload isn't inspected beyond truthiness
    response: () => HttpResponse.json(overrides.githubAuthorization ?? null),
  })
  addAPIMock({
    method: 'get',
    // @ts-expect-error - raw-fetch Next.js API route, not in the generated paths type
    path: '/incident-status',
    response: () => HttpResponse.json([]),
  })
  addAPIMock({
    method: 'get',
    path: '/platform/integrations/github/repositories',
    response: () =>
      HttpResponse.json<GitHubRepositoriesResponse>(
        overrides.githubRepositories ?? { partial_response_due_to_sso: false, repositories: [] }
      ),
  })
}

const DEFAULT_FLAGS = {
  disableProjectCreationAndUpdate: false,
  newProjectInternalOnlyConfiguration: false,
  disableOrioleProjectCreation: false,
  defaultRegionRestrictedPool: false,
}

async function renderWizard(options: { flags?: Partial<typeof DEFAULT_FLAGS> } = {}) {
  const { default: Wizard } = await import('@/pages/new/[slug]')
  return customRender(
    <FeatureFlagContext.Provider
      value={{ configcat: { ...DEFAULT_FLAGS, ...options.flags }, posthog: {}, hasLoaded: true }}
    >
      <Wizard dehydratedState={undefined} />
    </FeatureFlagContext.Provider>,
    { profileContext: createMockProfileContext() }
  )
}

const mockCreateProject = (onRequest?: (body: CreateProjectBody) => void) => {
  addAPIMock({
    method: 'post',
    path: '/platform/projects',
    response: async ({ request }) => {
      const body = (await request.json()) as CreateProjectBody
      onRequest?.(body)
      return HttpResponse.json<CreateProjectResponse>(
        {
          anon_key: 'anon-key',
          cloud_provider: 'AWS',
          endpoint: 'https://new-project-ref.supabase.co',
          id: 99,
          inserted_at: new Date(0).toISOString(),
          is_branch_enabled: false,
          is_physical_backups_enabled: false,
          name: body.name,
          organization_id: 1,
          organization_slug: ORG_SLUG,
          preview_branch_refs: [],
          ref: 'new-project-ref',
          region: 'us-east-1',
          service_key: 'service-key',
          status: 'COMING_UP',
          subscription_id: null,
        },
        { status: 201 }
      )
    },
  })
}

let user: ReturnType<typeof userEvent.setup>

// The ProjectCreation Selects don't associate their label with the trigger, so scope to
// the combobox via the shared FormLayout row instead of getByRole('combobox', { name }).
const getSelectTriggerByLabel = (labelText: string) => {
  const label = screen.getByText(labelText)
  const row = label.closest('[data-formlayout-id="labelContainer"]')?.parentElement
  const trigger = row?.querySelector('[role="combobox"]')
  if (!trigger) throw new Error(`No combobox trigger found near label "${labelText}"`)
  return trigger as HTMLElement
}

// Region is selected explicitly because the smart-region auto-fill is unreliable (FE-3884).
const selectRegion = async (optionName: string | RegExp) => {
  await user.click(getSelectTriggerByLabel('Region'))
  await user.click(await screen.findByRole('option', { name: optionName }))
}

const fillProjectName = async (name: string) => {
  const input = await screen.findByPlaceholderText('Project name')
  await user.clear(input)
  await user.type(input, name)
}

const generateAndWaitForStrongPassword = async () => {
  fireEvent.click(await screen.findByRole('button', { name: 'Generate a password' }))
  await waitFor(() =>
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100')
  )
}

describe('project creation wizard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    user = userEvent.setup({ delay: null })
    routerMock.setCurrentUrl(`/new/${ORG_SLUG}`)
  })

  test('creates a project on the happy path for a paid-plan organization', async () => {
    mockWizardEndpoints()
    const onRequest = vi.fn()
    mockCreateProject(onRequest)

    await renderWizard()

    await fillProjectName('My New Project')
    await generateAndWaitForStrongPassword()

    fireEvent.click(screen.getByRole('button', { name: 'Create new project' }))

    await waitFor(() => expect(onRequest).toHaveBeenCalled())
    expect(screen.queryByText('Confirm compute costs')).not.toBeInTheDocument()

    const body = onRequest.mock.calls[0][0]
    expect(body.name).toBe('My New Project')
    expect(body.organization_slug).toBe(ORG_SLUG)
    expect(body.desired_instance_size).toBe('micro')

    await waitFor(() => expect(routerMock.asPath).toBe('/project/new-project-ref'))
  })

  test('omits the desired instance size for a free-plan organization', async () => {
    mockWizardEndpoints({
      organizations: [mockOrg({ plan: { id: 'free', name: 'Free' } })],
    })
    const onRequest = vi.fn()
    mockCreateProject(onRequest)

    await renderWizard()

    await screen.findByPlaceholderText('Project name')
    expect(screen.queryByText('Select a compute size')).not.toBeInTheDocument()

    await fillProjectName('Free Plan Project')
    await generateAndWaitForStrongPassword()
    fireEvent.click(screen.getByRole('button', { name: 'Create new project' }))

    await waitFor(() => expect(onRequest).toHaveBeenCalled())
    expect(onRequest.mock.calls[0][0].desired_instance_size).toBeUndefined()
  })

  describe('blocking states', () => {
    test('shows a warning and hides project fields when free-plan members exceed the project limit', async () => {
      mockWizardEndpoints({
        organizations: [mockOrg({ plan: { id: 'free', name: 'Free' } })],
        freeProjectLimitMembers: [
          { free_project_limit: 2, primary_email: 'member@example.com', username: 'member-1' },
        ],
      })
      addAPIMock({ method: 'get', path: '/platform/organizations/:slug/members', response: [] })
      addAPIMock({
        method: 'get',
        path: '/platform/organizations/:slug/members/invitations',
        response: { invitations: [] },
      })
      addAPIMock({
        method: 'get',
        path: '/platform/organizations/:slug/roles',
        response: { org_scoped_roles: [], project_scoped_roles: [] },
      })

      await renderWizard()

      await screen.findByText(
        'The organization has members who have exceeded their free project limits'
      )
      expect(screen.getByText(/member-1 \(Limit: 2 free projects\)/)).toBeInTheDocument()
      expect(screen.queryByPlaceholderText('Project name')).not.toBeInTheDocument()
    })

    test('shows an admonition and hides project fields when the organization has overdue invoices', async () => {
      mockWizardEndpoints({
        overdueInvoices: [{ organization_id: 1, overdue_invoice_count: 1 }],
      })

      await renderWizard()

      await screen.findByText('Your organization has overdue invoices')
      expect(screen.getByRole('link', { name: 'View invoices' })).toHaveAttribute(
        'href',
        `/org/${ORG_SLUG}/billing#invoices`
      )
      expect(screen.queryByPlaceholderText('Project name')).not.toBeInTheDocument()
    })

    test('shows an incident warning and hides the whole form when project creation is disabled', async () => {
      mockWizardEndpoints()

      await renderWizard({ flags: { disableProjectCreationAndUpdate: true } })

      await screen.findByText('Project creation is currently disabled')
      expect(screen.queryByPlaceholderText('Project name')).not.toBeInTheDocument()
    })
  })

  describe('region selection', () => {
    test('surfaces the recommended smart region with a "Recommended" badge', async () => {
      mockWizardEndpoints()

      await renderWizard()

      await screen.findByPlaceholderText('Project name')
      await user.click(getSelectTriggerByLabel('Region'))

      const recommendedOption = await screen.findByRole('option', { name: /Americas/ })
      expect(within(recommendedOption).getByText('Recommended')).toBeInTheDocument()
    })

    test('submits the user-selected region', async () => {
      mockWizardEndpoints()
      const onRequest = vi.fn()
      mockCreateProject(onRequest)

      await renderWizard()

      await fillProjectName('Region Project')
      await generateAndWaitForStrongPassword()
      await selectRegion(/Americas/)

      fireEvent.click(screen.getByRole('button', { name: 'Create new project' }))

      await waitFor(() => expect(onRequest).toHaveBeenCalled())
      expect(onRequest.mock.calls[0][0].region_selection).toMatchObject({ name: 'Americas' })
    })

    test('shows an error state when available regions fail to load', async () => {
      mockWizardEndpoints({ availableRegions: 'error' })

      await renderWizard()

      await screen.findByText('Error loading available regions')
    })
  })

  describe('compute size and spend confirmation', () => {
    test('shows the compute costs confirmation modal for larger instance sizes', async () => {
      mockWizardEndpoints()
      const onRequest = vi.fn()
      mockCreateProject(onRequest)

      await renderWizard()

      await fillProjectName('Big Project')
      await generateAndWaitForStrongPassword()

      await user.click(getSelectTriggerByLabel('Compute size'))
      await user.click(await screen.findByText('4 GB RAM / 2-core ARM CPU'))

      fireEvent.click(screen.getByRole('button', { name: 'Create new project' }))

      await screen.findByText('Confirm compute costs')
      expect(onRequest).not.toHaveBeenCalled()

      fireEvent.click(screen.getByRole('button', { name: 'I understand' }))

      await waitFor(() => expect(onRequest).toHaveBeenCalled())
      expect(onRequest.mock.calls[0][0].desired_instance_size).toBe('medium')
    })
  })

  describe('postgres version and orioledb', () => {
    test('selecting orioledb shows the alpha warning and submits the oriole engine/channel', async () => {
      mockWizardEndpoints()
      const onRequest = vi.fn()
      mockCreateProject(onRequest)

      await renderWizard()

      await fillProjectName('Oriole Project')
      await generateAndWaitForStrongPassword()
      await selectRegion(/Americas/)

      fireEvent.click(await screen.findByRole('button', { name: 'Advanced Configuration' }))
      await user.click(screen.getByRole('radio', { name: /Postgres with OrioleDB/ }))

      await screen.findByText('OrioleDB is not production ready')

      fireEvent.click(screen.getByRole('button', { name: 'Create new project' }))

      await waitFor(() => expect(onRequest).toHaveBeenCalled())
      const body = onRequest.mock.calls[0][0]
      expect(body.postgres_engine).toBe('17-oriole')
      expect(body.release_channel).toBe('alpha')
    })

    test('rejects high availability combined with orioledb', async () => {
      mockWizardEndpoints()
      const onRequest = vi.fn()
      mockCreateProject(onRequest)

      await renderWizard({ flags: { newProjectInternalOnlyConfiguration: true } })

      await fillProjectName('HA Oriole Project')
      await selectRegion(/Americas/)

      fireEvent.click(await screen.findByRole('button', { name: 'Internal-only Configuration' }))
      await user.click(await screen.findByRole('switch'))

      fireEvent.click(await screen.findByRole('button', { name: 'Advanced Configuration' }))
      await user.click(await screen.findByRole('radio', { name: /Postgres with OrioleDB/ }))

      await screen.findByText('High availability is not supported with OrioleDB images')
      expect(onRequest).not.toHaveBeenCalled()
    })

    test('blocks submission with a toast when orioledb becomes unavailable after selection', async () => {
      const FRANKFURT = 'Central EU (Frankfurt)'
      mockWizardEndpoints({
        availableRegions: {
          ...DEFAULT_AVAILABLE_REGIONS,
          all: {
            ...DEFAULT_AVAILABLE_REGIONS.all,
            specific: [
              ...DEFAULT_AVAILABLE_REGIONS.all.specific,
              { code: 'eu-central-1', name: FRANKFURT, provider: 'AWS', type: 'specific' },
            ],
          },
        },
      })
      const onRequest = vi.fn()
      mockCreateProject(onRequest)

      await renderWizard()

      await fillProjectName('Oriole Gone Project')
      await generateAndWaitForStrongPassword()
      await selectRegion(/Americas/)

      fireEvent.click(await screen.findByRole('button', { name: 'Advanced Configuration' }))
      await user.click(screen.getByRole('radio', { name: /Postgres with OrioleDB/ }))
      await screen.findByText('OrioleDB is not production ready')

      addAPIMock({
        method: 'post',
        path: '/platform/organizations/:slug/available-versions',
        response: async ({ request }) => {
          const { region } = (await request.json()) as { region: string }
          return HttpResponse.json<{ available_versions: AvailableVersion[] }>(
            region === FRANKFURT
              ? { available_versions: DEFAULT_AVAILABLE_VERSIONS.available_versions.slice(0, 1) }
              : DEFAULT_AVAILABLE_VERSIONS
          )
        },
      })
      await selectRegion(/Frankfurt/)

      fireEvent.click(screen.getByRole('button', { name: 'Create new project' }))

      await waitFor(() =>
        expect(toast.error).toHaveBeenCalledWith(
          'No available OrioleDB image found, only Postgres is available'
        )
      )
      expect(onRequest).not.toHaveBeenCalled()
    })
  })

  describe('security options', () => {
    test('disabling the Data API sends an empty exposed-schemas list', async () => {
      mockWizardEndpoints()
      const onRequest = vi.fn()
      mockCreateProject(onRequest)

      await renderWizard()

      await fillProjectName('No Data API Project')
      await generateAndWaitForStrongPassword()

      await user.click(screen.getByLabelText('Enable Data API'))
      await screen.findByText('Client libraries need Data API to query your database')

      fireEvent.click(screen.getByRole('button', { name: 'Create new project' }))

      await waitFor(() => expect(onRequest).toHaveBeenCalled())
      const body = onRequest.mock.calls[0][0]
      expect(body.data_api_exposed_schemas).toEqual([])
      expect(body.data_api_revoke_default_privileges).toBe(false)
    })

    test('disabling default privileges sends the revoke flag', async () => {
      mockWizardEndpoints()
      const onRequest = vi.fn()
      mockCreateProject(onRequest)

      await renderWizard()

      await fillProjectName('Manual Privileges Project')
      await generateAndWaitForStrongPassword()

      await user.click(screen.getByLabelText('Automatically expose new tables'))

      fireEvent.click(screen.getByRole('button', { name: 'Create new project' }))

      await waitFor(() => expect(onRequest).toHaveBeenCalled())
      const body = onRequest.mock.calls[0][0]
      expect(body.data_api_exposed_schemas).toBeUndefined()
      expect(body.data_api_revoke_default_privileges).toBe(true)
    })

    test('enabling automatic RLS sends the event-trigger SQL', async () => {
      mockWizardEndpoints()
      const onRequest = vi.fn()
      mockCreateProject(onRequest)

      await renderWizard()

      await fillProjectName('Auto RLS Project')
      await generateAndWaitForStrongPassword()

      await user.click(screen.getByLabelText('Enable automatic RLS'))

      fireEvent.click(screen.getByRole('button', { name: 'Create new project' }))

      await waitFor(() => expect(onRequest).toHaveBeenCalled())
      expect(onRequest.mock.calls[0][0].db_sql).toBe(AUTO_ENABLE_RLS_EVENT_TRIGGER_SQL)
    })
  })

  test('blocks submission for a weak database password', async () => {
    mockWizardEndpoints()
    const onRequest = vi.fn()
    mockCreateProject(onRequest)

    await renderWizard()

    await fillProjectName('Weak Password Project')
    const passwordInput = screen.getByPlaceholderText('Type in a strong password')
    await user.type(passwordInput, 'password')

    await waitFor(() =>
      expect(screen.getByRole('progressbar')).not.toHaveAttribute('aria-valuenow', '100')
    )

    fireEvent.click(screen.getByRole('button', { name: 'Create new project' }))

    await screen.findByText(/You need a stronger password\./)
    expect(onRequest).not.toHaveBeenCalled()
  })

  test('blocks submission for a too-short project name', async () => {
    mockWizardEndpoints()
    const onRequest = vi.fn()
    mockCreateProject(onRequest)

    await renderWizard()

    await fillProjectName('ab')
    await generateAndWaitForStrongPassword()

    fireEvent.click(screen.getByRole('button', { name: 'Create new project' }))

    await screen.findByText('Project name must be at least 3 characters long.')
    expect(onRequest).not.toHaveBeenCalled()
  })

  describe('github integration', () => {
    test('hides the github field without entitlement access', async () => {
      mockWizardEndpoints()

      await renderWizard()

      await screen.findByPlaceholderText('Project name')
      expect(screen.queryByText('GitHub (optional)')).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Connect GitHub' })).not.toBeInTheDocument()
    })

    test('selecting a connected repository fills in the project name and submission payload', async () => {
      mockWizardEndpoints({
        entitlements: [
          {
            feature: { key: 'integrations.github_connections', type: 'boolean' },
            hasAccess: true,
            type: 'boolean',
            config: { enabled: true },
          } as Entitlement,
        ],
        githubAuthorization: { id: 1 },
        githubRepositories: {
          partial_response_due_to_sso: false,
          repositories: [
            { id: 555, installation_id: 777, name: 'my-org/my-repo', default_branch: 'main' },
          ],
        },
      })
      const onRequest = vi.fn()
      mockCreateProject(onRequest)

      await renderWizard()

      await screen.findByPlaceholderText('Project name')
      fireEvent.click(await screen.findByText('Choose GitHub repository'))
      await user.click(await screen.findByText('my-org/my-repo'))

      await waitFor(() =>
        expect(screen.getByPlaceholderText('Project name')).toHaveValue('my-repo')
      )

      await generateAndWaitForStrongPassword()
      fireEvent.click(screen.getByRole('button', { name: 'Create new project' }))

      await waitFor(() => expect(onRequest).toHaveBeenCalled())
      const body = onRequest.mock.calls[0][0]
      expect(body.github_repository_id).toBe(555)
      expect(body.github_installation_id).toBe(777)
    })
  })

  describe('feature flags', () => {
    test('hides internal-only configuration by default', async () => {
      mockWizardEndpoints()

      await renderWizard()

      await screen.findByPlaceholderText('Project name')
      expect(
        screen.queryByRole('button', { name: 'Internal-only Configuration' })
      ).not.toBeInTheDocument()
    })
  })

  test('shows an error toast when project creation fails', async () => {
    mockWizardEndpoints()
    addAPIMock({
      method: 'post',
      path: '/platform/projects',
      response: () =>
        HttpResponse.json<APIErrorBody>({ message: 'Organization is over quota' }, { status: 400 }),
    })

    await renderWizard()

    await fillProjectName('Failing Project')
    await generateAndWaitForStrongPassword()
    fireEvent.click(screen.getByRole('button', { name: 'Create new project' }))

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining('Organization is over quota')
      )
    )
  })
})
