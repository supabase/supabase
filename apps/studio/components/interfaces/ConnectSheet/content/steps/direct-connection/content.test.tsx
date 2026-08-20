import { waitFor } from '@testing-library/react'
import { components, paths } from 'api-types'
import { HttpResponse } from 'msw'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import DirectConnectionContent from './content'
import type {
  ConnectionStringPooler,
  ConnectState,
  DeploymentMode,
  ProjectKeys,
} from '@/components/interfaces/ConnectSheet/Connect.types'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

type DatabaseDetailResponse = components['schemas']['DatabaseDetailResponse']
// Self-hosted endpoint augments the response with the direct-connection host.
type DatabaseMock = DatabaseDetailResponse & { db_host_direct?: string }
type ProjectDetail =
  paths['/platform/projects/{ref}']['get']['responses']['200']['content']['application/json']

// IS_PLATFORM=false disables the pgbouncer/supavisor/addons queries (they're
// gated on it), so /databases is the only network call the component makes.
vi.mock('@/lib/constants', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/constants')>()),
  IS_PLATFORM: false,
}))

// Entitlements/HA fan out to org + project queries; stub the two hooks/misc
// consumers so the component only depends on the databases mock below.
vi.mock('@/hooks/misc/useCheckEntitlements', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/hooks/misc/useCheckEntitlements')>()),
  useCheckEntitlements: () => ({
    hasAccess: false,
    isLoading: false,
    isSuccess: true,
    getEntitlementNumericValue: () => undefined,
    isEntitlementUnlimited: () => false,
    getEntitlementSetValues: () => [],
    getEntitlementMax: () => undefined,
  }),
}))
vi.mock('@/hooks/misc/useSelectedProject', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/hooks/misc/useSelectedProject')>()),
  useIsHighAvailability: () => false,
}))

const GATEWAY_HOST = 'gateway.example.com'

// A project-detail fetch fires from the render tree (unrelated to the direct
// string); mock it so there are no unhandled requests.
function mockProjectDetail() {
  addAPIMock({
    method: 'get',
    path: '/platform/projects/:ref',
    response: () =>
      HttpResponse.json<ProjectDetail>({
        ref: 'default',
        status: 'ACTIVE_HEALTHY',
      } as ProjectDetail),
  })
}

function mockDatabases({ dbHostDirect }: { dbHostDirect?: string }) {
  addAPIMock({
    method: 'get',
    path: '/platform/projects/:ref/databases',
    response: () =>
      HttpResponse.json<DatabaseMock[]>([
        {
          cloud_provider: 'AWS',
          connectionString: '',
          db_host: GATEWAY_HOST,
          // Self-hosted only: advertised direct-connection host
          ...(dbHostDirect ? { db_host_direct: dbHostDirect } : {}),
          db_name: 'postgres',
          db_port: 5432,
          db_user: 'postgres',
          identifier: 'default',
          inserted_at: '',
          region: 'local',
          restUrl: '',
          size: '',
          status: 'ACTIVE_HEALTHY',
        },
      ]),
  })
}

const selfHosted: DeploymentMode = { isPlatform: false, isCli: false, isSelfHosted: true }
const projectKeys: ProjectKeys = { apiUrl: null, anonKey: null, publishableKey: null }
const state: ConnectState = {
  mode: 'direct',
  connectionSource: 'default',
  connectionType: 'uri',
  connectionMethod: 'direct',
  useSharedPooler: true,
}

function renderDirect() {
  return customRender(
    <DirectConnectionContent
      state={state}
      projectKeys={projectKeys}
      connectionStringPooler={{} as ConnectionStringPooler}
      deploymentMode={selfHosted}
    />
  )
}

// The redacted connection string is mirrored verbatim on this attribute,
// avoiding CodeBlock's syntax-highlighting span splitting.
const getCopyValue = (container: HTMLElement) =>
  container.querySelector('[data-connect-copy-value]')?.getAttribute('data-connect-copy-value')

describe('DirectConnectionContent (self-hosted)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('advertises db_host_direct in the direct connection string', async () => {
    mockProjectDetail()
    mockDatabases({ dbHostDirect: 'mydb.internal' })

    const { container } = renderDirect()

    await waitFor(() => {
      expect(getCopyValue(container)).toBe(
        'postgresql://postgres:[YOUR-PASSWORD]@mydb.internal:5432/postgres'
      )
    })
    // The public gateway host must not leak into the direct string
    expect(getCopyValue(container)).not.toContain(GATEWAY_HOST)
  })

  it('falls back to db_host when db_host_direct is absent', async () => {
    mockProjectDetail()
    mockDatabases({})

    const { container } = renderDirect()

    await waitFor(() => {
      expect(getCopyValue(container)).toBe(
        `postgresql://postgres:[YOUR-PASSWORD]@${GATEWAY_HOST}:5432/postgres`
      )
    })
  })
})
