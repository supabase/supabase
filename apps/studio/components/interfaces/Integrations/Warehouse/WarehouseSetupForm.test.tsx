import { PermissionAction } from '@supabase/shared-types/out/constants'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { platformComponents as components } from 'api-types'
import { mockAnimationsApi, mockIntersectionObserver } from 'jsdom-testing-mocks'
import { HttpResponse } from 'msw'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import type { WarehouseSchemaTablePickerProps } from './WarehouseSchemaTablePicker'
import { WarehouseSetupPanel } from './WarehouseSetupPanel'
import type { OrgProject, OrgProjectsResponse } from '@/data/projects/org-projects-infinite-query'
import type { ProfileContextType } from '@/lib/profile'
import { createMockOrganizationResponse } from '@/tests/helpers'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock, type APIErrorBody } from '@/tests/lib/msw'

vi.mock('common', async (importOriginal) => ({
  ...(await importOriginal<typeof import('common')>()),
  useParams: () => ({ ref: 'default' }),
  useIsLoggedIn: () => true,
}))
vi.mock('@/lib/constants', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/constants')>()),
  IS_PLATFORM: true,
}))
vi.mock('./WarehouseSchemaTablePicker', () => ({
  WarehouseSchemaTablePicker: ({
    onSubmit,
    isSubmitDisabled,
    error,
  }: WarehouseSchemaTablePickerProps) => (
    <div>
      <button
        disabled={isSubmitDisabled}
        tabIndex={isSubmitDisabled ? -1 : 0}
        onClick={() => onSubmit([{ type: 'schema', schema: 'public' }])}
      >
        Enable Warehouse
      </button>
      {error && <p>{error.message}</p>}
    </div>
  ),
}))

mockAnimationsApi()
mockIntersectionObserver()

type ProjectDetail = components['schemas']['ProjectDetailResponse_Output']
type DestinationsResponse = components['schemas']['DestinationsResponse_Output']
type SetupStatus = components['schemas']['WarehouseSetupStatusResponse_Output']
type SetupResponse = components['schemas']['WarehouseSetupResponse_Output']
type Permission = components['schemas']['AccessControlPermission']

const DESTINATION_REF = 'bbbbbbbbbbbbbbbbbbbb'
const DESTINATION: DestinationsResponse['destinations'][number] = {
  id: 301,
  tenant_id: 'default',
  name: 'supabase_warehouse',
  config: {
    ducklake: {
      data_path: 's3://warehouse/default',
      s3_endpoint: `${DESTINATION_REF}.storage.supabase.co/storage/v1/s3`,
      metadata_schema: 'ducklake_default',
    },
  },
}
const ORG_SLUG = 'test-org'
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
const PROJECT: ProjectDetail = {
  cloud_provider: 'AWS',
  connectionString: '',
  db_host: 'db.example.com',
  dbVersion: 'supabase-postgres-15.1.0',
  high_availability: false,
  id: 1,
  infra_compute_size: 'micro',
  inserted_at: '2026-01-01T00:00:00.000Z',
  integration_source: null,
  is_branch_enabled: false,
  is_physical_backups_enabled: false,
  name: 'Application project',
  organization_id: 1,
  ref: 'default',
  region: 'us-east-1',
  restUrl: 'https://example.com',
  status: 'ACTIVE_HEALTHY',
  subscription_id: 'test-subscription',
  updated_at: '2026-01-01T00:00:00.000Z',
}
const orgProject = (
  ref: string,
  name: string,
  status: OrgProject['status'] = 'ACTIVE_HEALTHY'
): OrgProject => ({
  ref,
  name,
  status,
  cloud_provider: 'AWS',
  databases: [],
  inserted_at: '2026-01-01T00:00:00.000Z',
  integration_source: null,
  is_branch: false,
  region: 'us-east-1',
})
const setupStatus: SetupStatus = {
  setup_status: 'not_started',
  steps: [],
  tables: [],
  fdw_status: {
    extension_available: false,
    extension_installed: false,
    wrapper_installed: false,
    server_configured: false,
    schema_created: false,
    foreign_schema_imported: false,
  },
}
const requests: unknown[] = []
const projectListSlugs: string[] = []

function mockPermissions(actions: Permission['actions']) {
  addAPIMock({
    method: 'get',
    path: '/platform/profile/permissions',
    response: () =>
      HttpResponse.json<Permission[]>([
        {
          actions,
          condition: null,
          organization_id: 1,
          organization_slug: ORG_SLUG,
          project_ids: [],
          project_refs: [],
          resources: ['*'],
          restrictive: false,
        },
      ]),
  })
}

describe('Warehouse setup destination', () => {
  beforeEach(() => {
    requests.length = 0
    projectListSlugs.length = 0
    addAPIMock({
      method: 'get',
      path: '/platform/projects/:ref',
      response: () => HttpResponse.json<ProjectDetail>(PROJECT),
    })
    addAPIMock({
      method: 'get',
      path: '/platform/organizations',
      response: [
        createMockOrganizationResponse({ id: 1, slug: ORG_SLUG, name: 'Test organization' }),
        createMockOrganizationResponse({
          id: 2,
          slug: 'another-org',
          name: 'Another organization',
        }),
      ],
    })
    addAPIMock({
      method: 'get',
      path: '/platform/organizations/:slug/projects',
      response: ({ params }) => {
        projectListSlugs.push(String(params.slug))
        const projects =
          params.slug === ORG_SLUG
            ? [
                orgProject('default', 'Application project'),
                orgProject(DESTINATION_REF, 'Warehouse project'),
                orgProject('cccccccccccccccccccc', 'Starting project', 'COMING_UP'),
              ]
            : [orgProject('dddddddddddddddddddd', 'Other organization project')]
        return HttpResponse.json<OrgProjectsResponse>({
          projects,
          pagination: { count: projects.length, limit: 96, offset: 0 },
        })
      },
    })
    addAPIMock({
      method: 'get',
      path: '/platform/replication/:ref/destinations',
      response: () => HttpResponse.json<DestinationsResponse>({ destinations: [] }),
    })
    addAPIMock({
      method: 'get',
      path: '/platform/warehouse/:ref/setup-status',
      response: () => HttpResponse.json<SetupStatus>(setupStatus),
    })
    addAPIMock({
      method: 'post',
      path: '/platform/warehouse/:ref/setup',
      response: async ({ request }) => {
        requests.push(await request.json())
        return HttpResponse.json<SetupResponse>({ pipeline_id: 101, tables: [] }, { status: 202 })
      },
    })
    mockPermissions([PermissionAction.TENANT_SQL_ADMIN_WRITE, PermissionAction.STORAGE_ADMIN_WRITE])
  })

  test('defaults to the current project and documents the potential benefit of a separate project', async () => {
    customRender(<WarehouseSetupPanel />, { profileContext: PROFILE_CONTEXT })
    expect(
      await screen.findByRole('combobox', { name: 'Storage and catalog project' })
    ).toHaveTextContent('Application project (current project)')
    expect(
      screen.getByText(/can improve performance by keeping Storage and DuckLake catalog activity/)
    ).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Enable Warehouse' }))
    await waitFor(() =>
      expect(requests).toEqual([
        { targets: [{ type: 'schema', schema: 'public' }], destination_project_ref: 'default' },
      ])
    )
  })

  test('selects an active project from the source organization and sends its ref', async () => {
    customRender(<WarehouseSetupPanel />, { profileContext: PROFILE_CONTEXT })
    await userEvent.click(
      await screen.findByRole('combobox', { name: 'Storage and catalog project' })
    )
    expect(await screen.findByRole('option', { name: /Starting project/ })).toHaveAttribute(
      'aria-disabled',
      'true'
    )
    expect(screen.queryByText('Other organization project')).not.toBeInTheDocument()
    expect(projectListSlugs).toEqual([ORG_SLUG])
    await userEvent.click(screen.getByRole('option', { name: /Warehouse project/ }))
    expect(screen.getByRole('combobox', { name: 'Storage and catalog project' })).toHaveTextContent(
      'Warehouse project'
    )
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Enable Warehouse' })).toBeEnabled()
    )
    await userEvent.click(screen.getByRole('button', { name: 'Enable Warehouse' }))
    await waitFor(() =>
      expect(requests).toEqual([
        {
          targets: [{ type: 'schema', schema: 'public' }],
          destination_project_ref: DESTINATION_REF,
        },
      ])
    )
  })

  test.each([PermissionAction.TENANT_SQL_ADMIN_WRITE, PermissionAction.STORAGE_ADMIN_WRITE])(
    'blocks setup when the destination lacks %s',
    async (missingPermission) => {
      mockPermissions(
        [PermissionAction.TENANT_SQL_ADMIN_WRITE, PermissionAction.STORAGE_ADMIN_WRITE].filter(
          (action) => action !== missingPermission
        )
      )
      customRender(<WarehouseSetupPanel />, { profileContext: PROFILE_CONTEXT })
      await userEvent.click(
        await screen.findByRole('combobox', { name: 'Storage and catalog project' })
      )
      await userEvent.click(await screen.findByRole('option', { name: /Warehouse project/ }))
      expect(
        await screen.findByText(/You need SQL and Storage admin write permissions/)
      ).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Enable Warehouse' })).toBeDisabled()
      expect(requests).toEqual([])
    }
  )

  test('locks an existing destination and omits the ref when re-enabling Warehouse', async () => {
    addAPIMock({
      method: 'get',
      path: '/platform/replication/:ref/destinations',
      response: () =>
        HttpResponse.json<DestinationsResponse>({
          destinations: [DESTINATION],
        }),
    })
    customRender(<WarehouseSetupPanel />, { profileContext: PROFILE_CONTEXT })
    expect(
      await screen.findByRole('combobox', { name: 'Storage and catalog project' })
    ).toBeDisabled()
    expect(screen.getByRole('combobox')).toHaveTextContent(DESTINATION_REF)
    expect(
      screen.getByText(/fixed after setup, including when Warehouse is disabled/)
    ).toBeInTheDocument()
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Enable Warehouse' })).toBeEnabled()
    )
    await userEvent.click(screen.getByRole('button', { name: 'Enable Warehouse' }))
    await waitFor(() =>
      expect(requests).toEqual([{ targets: [{ type: 'schema', schema: 'public' }] }])
    )
  })

  test('locks a destination created before setup fails and preserves it when retrying', async () => {
    let destinationCreated = false
    addAPIMock({
      method: 'get',
      path: '/platform/replication/:ref/destinations',
      response: () =>
        HttpResponse.json<DestinationsResponse>({
          destinations: destinationCreated ? [DESTINATION] : [],
        }),
    })
    addAPIMock({
      method: 'post',
      path: '/platform/warehouse/:ref/setup',
      response: async ({ request }) => {
        requests.push(await request.json())
        destinationCreated = true
        return HttpResponse.json<APIErrorBody>(
          { message: 'Pipeline creation failed' },
          { status: 500 }
        )
      },
    })
    customRender(<WarehouseSetupPanel />, { profileContext: PROFILE_CONTEXT })
    await userEvent.click(
      await screen.findByRole('combobox', { name: 'Storage and catalog project' })
    )
    await userEvent.click(await screen.findByRole('option', { name: /Warehouse project/ }))
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Enable Warehouse' })).toBeEnabled()
    )
    await userEvent.click(screen.getByRole('button', { name: 'Enable Warehouse' }))
    expect(await screen.findByText('Pipeline creation failed')).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeDisabled()
      expect(screen.getByRole('combobox')).toHaveTextContent(DESTINATION_REF)
      expect(screen.getByRole('button', { name: 'Enable Warehouse' })).toBeEnabled()
    })
    await userEvent.click(screen.getByRole('button', { name: 'Enable Warehouse' }))
    await waitFor(() =>
      expect(requests).toEqual([
        {
          targets: [{ type: 'schema', schema: 'public' }],
          destination_project_ref: DESTINATION_REF,
        },
        { targets: [{ type: 'schema', schema: 'public' }] },
      ])
    )
  })

  test('allows first setup when the replication tenant does not exist yet', async () => {
    addAPIMock({
      method: 'get',
      path: '/platform/replication/:ref/destinations',
      response: () =>
        HttpResponse.json<APIErrorBody>({ message: 'Tenant not found' }, { status: 404 }),
    })
    customRender(<WarehouseSetupPanel />, { profileContext: PROFILE_CONTEXT })
    expect(
      await screen.findByRole('combobox', { name: 'Storage and catalog project' })
    ).toBeEnabled()
  })

  test('blocks destination selection when existing destinations cannot be loaded', async () => {
    addAPIMock({
      method: 'get',
      path: '/platform/replication/:ref/destinations',
      response: () =>
        HttpResponse.json<APIErrorBody>({ message: 'Destinations unavailable' }, { status: 500 }),
    })
    customRender(<WarehouseSetupPanel />, { profileContext: PROFILE_CONTEXT })
    expect(await screen.findByText('Failed to load Warehouse destination')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Enable Warehouse' })).not.toBeInTheDocument()
  })
})
