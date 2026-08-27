import { screen } from '@testing-library/react'
import { apiV1Components, apiV2Components, platformComponents } from 'api-types'
import { HttpResponse } from 'msw'
import { describe, expect, test, vi } from 'vitest'

import { ConfigurationDriftPage } from './ConfigurationDriftPage'
import type { ProfileContextType } from '@/lib/profile'
import { createMockOrganizationResponse } from '@/tests/helpers'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock, type APIErrorBody } from '@/tests/lib/msw'

type ProjectDetailResponse = platformComponents['schemas']['ProjectDetailResponse']
type OrganizationResponse = platformComponents['schemas']['OrganizationResponse']
type ListGitHubConnectionsResponse = platformComponents['schemas']['ListGitHubConnectionsResponse']
type GetGitHubConnectionConfigResponse =
  platformComponents['schemas']['GetGitHubConnectionConfigResponse']
type BranchResponse = apiV1Components['schemas']['BranchResponse']
type V2ProjectConfigResponse = apiV2Components['schemas']['V2ProjectConfigResponse']

const PROJECT_REF = 'default'
const ORGANIZATION_ID = 1
const CONNECTION_ID = 42

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

vi.mock('common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('common')>()
  return {
    ...actual,
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

const PROJECT: ProjectDetailResponse = {
  cloud_provider: 'AWS',
  db_host: `db.${PROJECT_REF}.supabase.co`,
  high_availability: false,
  id: 1,
  inserted_at: '2025-01-01T00:00:00Z',
  integration_source: null,
  is_branch_enabled: true,
  is_physical_backups_enabled: false,
  name: 'Test project',
  organization_id: ORGANIZATION_ID,
  ref: PROJECT_REF,
  region: 'us-east-1',
  restUrl: `https://${PROJECT_REF}.supabase.co`,
  status: 'ACTIVE_HEALTHY',
  subscription_id: 'subscription-1',
  updated_at: '2025-01-01T00:00:00Z',
}

const BRANCH: BranchResponse = {
  created_at: '2025-01-01T00:00:00Z',
  id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  is_default: true,
  name: 'main',
  parent_project_ref: PROJECT_REF,
  persistent: true,
  project_ref: PROJECT_REF,
  status: 'MIGRATIONS_PASSED',
  updated_at: '2025-01-01T00:00:00Z',
  with_data: false,
}

const CONNECTION: ListGitHubConnectionsResponse['connections'][number] = {
  branch_limit: 0,
  id: CONNECTION_ID,
  inserted_at: '2025-01-01T00:00:00Z',
  installation_id: 1,
  new_branch_per_pr: false,
  project: { id: 1, name: 'Test project', ref: PROJECT_REF },
  repository: { id: 1, name: 'acme/repo' },
  supabase_changes_only: false,
  updated_at: '2025-01-01T00:00:00Z',
  user: null,
  workdir: '',
}

function createProjectConfigResponse(auth: Record<string, unknown>): V2ProjectConfigResponse {
  return {
    data: {
      id: PROJECT_REF,
      type: 'project_config',
      attributes: {
        api: {
          db_extra_search_path: 'public',
          db_pool: null,
          db_pool_acquisition_timeout: 10,
          db_schema: 'public',
          max_rows: 1000,
        },
        auth,
        database: {
          major_version: 17,
          network_restrictions: {
            allowed_cidrs: [],
            entitlement: 'disallowed',
            status: 'stored',
          },
          postgres_settings: {},
          ssl_enforced: true,
        },
        pooler: {
          default_pool_size: 15,
          ignore_startup_parameters: '',
          max_client_conn: 200,
          pool_mode: 'transaction',
          query_wait_timeout: 120,
          reserve_pool_size: 0,
          server_idle_timeout: 0,
          server_lifetime: 3600,
        },
        realtime: {
          connection_pool: 20,
          max_bytes_per_second: 100_000,
          max_channels_per_client: 100,
          max_concurrent_users: 200,
          max_events_per_second: 100,
          max_joins_per_second: 100,
          max_payload_size_in_kb: 1000,
          max_presence_events_per_second: 100,
          postgres_changes_pool: null,
          presence_enabled: true,
          private_only: false,
          suspend: false,
        },
        storage: {
          capabilities: { iceberg_catalog: false, list_v2: true },
          database_pool_mode: 'transaction',
          features: {
            iceberg_catalog: { enabled: false, max_catalogs: 0, max_namespaces: 0, max_tables: 0 },
            image_transformation: { enabled: true },
            purge_cache: { enabled: false },
            s3_protocol: { enabled: false },
            vector_buckets: { enabled: false, max_buckets: 0, max_indexes: 0 },
          },
          file_size_limit: 52_428_800,
          migration_version: '0',
          upstream_target: 'main',
        },
      },
    },
  }
}

function mockProject() {
  addAPIMock({ method: 'get', path: '/platform/projects/:ref', response: PROJECT })
  addAPIMock({
    method: 'get',
    path: '/platform/organizations',
    response: () =>
      HttpResponse.json<OrganizationResponse[]>([
        createMockOrganizationResponse({ id: ORGANIZATION_ID }),
      ]),
  })
}

function mockConnectedProject() {
  mockProject()
  addAPIMock({
    method: 'get',
    path: '/v1/projects/:ref/branches',
    response: () => HttpResponse.json<BranchResponse[]>([BRANCH]),
  })
  addAPIMock({
    method: 'get',
    path: '/platform/integrations/github/connections',
    response: () => HttpResponse.json<ListGitHubConnectionsResponse>({ connections: [CONNECTION] }),
  })
}

function mockProjectConfig(auth: Record<string, unknown>) {
  addAPIMock({
    method: 'get',
    path: '/v2/projects/:ref/config',
    response: () => HttpResponse.json<V2ProjectConfigResponse>(createProjectConfigResponse(auth)),
  })
}

function mockGitHubConfig(config: Record<string, unknown>) {
  addAPIMock({
    method: 'get',
    path: '/platform/integrations/github/connections/:connection_id/config',
    response: () =>
      HttpResponse.json<GetGitHubConnectionConfigResponse>({
        config,
        path: 'supabase/config.toml',
        ref: null,
        sha: 'abc123',
      }),
  })
}

describe('ConfigurationDriftPage', () => {
  test('prompts to connect GitHub when the project has no connection', async () => {
    mockProject()
    addAPIMock({
      method: 'get',
      path: '/v1/projects/:ref/branches',
      response: () => HttpResponse.json<BranchResponse[]>([]),
    })
    addAPIMock({
      method: 'get',
      path: '/platform/integrations/github/connections',
      response: () => HttpResponse.json<ListGitHubConnectionsResponse>({ connections: [] }),
    })

    customRender(<ConfigurationDriftPage />, { profileContext: PROFILE_CONTEXT })

    expect(await screen.findByText(/Connect a GitHub repo/)).toBeInTheDocument()
  })

  test('shows an error state when a query fails', async () => {
    mockProject()
    addAPIMock({
      method: 'get',
      path: '/v1/projects/:ref/branches',
      response: () =>
        HttpResponse.json<APIErrorBody>({ message: 'Boom from the backend' }, { status: 500 }),
    })
    addAPIMock({
      method: 'get',
      path: '/platform/integrations/github/connections',
      response: () => HttpResponse.json<ListGitHubConnectionsResponse>({ connections: [] }),
    })

    customRender(<ConfigurationDriftPage />, { profileContext: PROFILE_CONTEXT })

    expect(await screen.findByText('Could not check configuration drift')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Refresh' })).toBeInTheDocument()
  })

  test('shows a success state when all comparable settings match', async () => {
    mockConnectedProject()
    mockProjectConfig({ disable_signup: false })
    mockGitHubConfig({ auth: { enable_signup: true } })

    customRender(<ConfigurationDriftPage />, { profileContext: PROFILE_CONTEXT })

    expect(await screen.findByText('All compared settings match')).toBeInTheDocument()
  })

  test('renders a drift row when the dashboard and config.toml disagree', async () => {
    mockConnectedProject()
    mockProjectConfig({ disable_signup: false })
    mockGitHubConfig({ auth: { enable_signup: false } })

    customRender(<ConfigurationDriftPage />, { profileContext: PROFILE_CONTEXT })

    expect(await screen.findByText('New user signups')).toBeInTheDocument()
    expect(screen.getByText('1 setting differs')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Open setting/ })).toHaveAttribute(
      'href',
      `/project/${PROJECT_REF}/auth/providers`
    )
  })
})
