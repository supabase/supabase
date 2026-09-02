import { PermissionAction } from '@supabase/shared-types/out/constants'
import { screen, waitFor } from '@testing-library/react'
import { platformComponents as components } from 'api-types'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { ResourceExhaustionWarningBanner } from './ResourceExhaustionWarningBanner'
import type { ResourceWarning } from '@/data/usage/resource-warnings-query'
import type { ProfileContextType } from '@/lib/profile'
import { createMockOrganizationResponse } from '@/tests/helpers'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

type ProjectDetailResponse = components['schemas']['ProjectDetailResponse']
type PermissionResponse = components['schemas']['AccessControlPermission']

const PROJECT_REF = 'default'
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
  connectionString: 'postgresql://postgres:password@db.default.supabase.co:5432/postgres',
  db_host: 'db.default.supabase.co',
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

const NO_WARNINGS: ResourceWarning = {
  project: PROJECT_REF,
  is_readonly_mode_enabled: false,
  disk_io_exhaustion: null,
  cpu_exhaustion: null,
  memory_and_swap_exhaustion: null,
  disk_space_exhaustion: null,
  auth_rate_limit_exhaustion: null,
  auth_email_offender: null,
  auth_restricted_email_sending: null,
  need_pitr: null,
}

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

function mockEndpoints({
  warning,
  project = PROJECT,
}: {
  warning: ResourceWarning
  project?: ProjectDetailResponse
}) {
  addAPIMock({ method: 'get', path: '/platform/projects/:ref', response: project })
  addAPIMock({
    method: 'get',
    path: '/platform/organizations',
    response: [createMockOrganizationResponse({ id: 1, slug: ORGANIZATION_SLUG })],
  })
  addAPIMock({
    method: 'get',
    path: '/platform/profile/permissions',
    response: [
      {
        actions: [PermissionAction.INFRA_EXECUTE],
        condition: null,
        organization_id: 1,
        organization_slug: ORGANIZATION_SLUG,
        project_ids: [PROJECT.id],
        project_refs: [PROJECT_REF],
        resources: ['reboot'],
        restrictive: false,
      } satisfies PermissionResponse,
    ],
  })
  addAPIMock({
    method: 'get',
    path: '/platform/projects-resource-warnings',
    response: [warning],
  })
}

describe('ResourceExhaustionWarningBanner', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('offers a database restart when memory and swap are exhausted', async () => {
    mockEndpoints({ warning: { ...NO_WARNINGS, memory_and_swap_exhaustion: 'critical' } })

    customRender(<ResourceExhaustionWarningBanner />, { profileContext: PROFILE_CONTEXT })

    expect(await screen.findByRole('button', { name: 'Restart database' })).toBeInTheDocument()
  })

  test('does not offer a restart for resource warnings a reboot cannot fix', async () => {
    mockEndpoints({ warning: { ...NO_WARNINGS, disk_io_exhaustion: 'critical' } })

    customRender(<ResourceExhaustionWarningBanner />, { profileContext: PROFILE_CONTEXT })

    // Wait for the banner itself so the absence assertion cannot pass on an empty render
    await screen.findByRole('button', { name: 'Troubleshoot' })
    expect(screen.queryByRole('button', { name: 'Restart database' })).not.toBeInTheDocument()
  })

  test('does not offer a restart while the project is in read-only mode', async () => {
    mockEndpoints({
      warning: {
        ...NO_WARNINGS,
        is_readonly_mode_enabled: true,
        memory_and_swap_exhaustion: 'critical',
      },
    })

    customRender(<ResourceExhaustionWarningBanner />, { profileContext: PROFILE_CONTEXT })

    await waitFor(() => {
      expect(screen.getByText(/read-only mode/i)).toBeInTheDocument()
    })
    expect(screen.queryByRole('button', { name: 'Restart database' })).not.toBeInTheDocument()
  })

  test('does not offer a restart while a restart is already in flight', async () => {
    mockEndpoints({
      warning: { ...NO_WARNINGS, memory_and_swap_exhaustion: 'critical' },
      project: { ...PROJECT, status: 'RESTARTING' },
    })

    customRender(<ResourceExhaustionWarningBanner />, { profileContext: PROFILE_CONTEXT })

    await screen.findByRole('button', { name: 'Troubleshoot' })
    expect(screen.queryByRole('button', { name: 'Restart database' })).not.toBeInTheDocument()
  })
})
