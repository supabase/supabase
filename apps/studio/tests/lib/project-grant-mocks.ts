import type { platformComponents as components } from 'api-types'

import { createMockOrganizationResponse } from '@/tests/helpers'
import { addAPIMock } from '@/tests/lib/msw'
import { mockPermissions } from '@/tests/lib/msw-permissions'
import { allPermissionsFor, type PermissionsV2Response } from '@/tests/lib/permissions-fixtures'

type ProjectDetailResponse = components['schemas']['ProjectDetailResponse_Output']

/**
 * Mocks what `useGrant` resolves for a project page: the selected project and organization, and
 * the user's permissions (everything by default). Render with `useParams` returning `ref`.
 */
export function mockProjectGrantContext({
  ref,
  slug = 'acme',
  permissions = allPermissionsFor([slug]),
}: {
  ref: string
  slug?: string
  permissions?: PermissionsV2Response
}) {
  const project: ProjectDetailResponse = {
    cloud_provider: 'AWS',
    connectionString: `postgresql://postgres:password@db.${ref}.supabase.co:5432/postgres`,
    db_host: `db.${ref}.supabase.co`,
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
    ref,
    region: 'us-east-1',
    restUrl: `https://${ref}.supabase.co`,
    status: 'ACTIVE_HEALTHY',
    subscription_id: 'subscription-1',
    updated_at: '2026-01-01T00:00:00.000Z',
  }

  addAPIMock({ method: 'get', path: '/platform/projects/:ref', response: project })
  addAPIMock({
    method: 'get',
    path: '/platform/organizations',
    response: [createMockOrganizationResponse({ id: 1, slug })],
  })
  mockPermissions(permissions)
}
