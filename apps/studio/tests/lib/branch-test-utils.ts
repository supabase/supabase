import type { platformComponents } from 'api-types'

import type { Branch } from '@/data/branches/branches-query'
import type { FgaPermissions } from '@/hooks/misc/useCheckPermissionsV2'
import { createMockOrganizationResponse } from '@/tests/helpers'
import { addAPIMock } from '@/tests/lib/msw'
import { mockPermissions } from '@/tests/lib/msw-permissions'

type ProjectDetailResponse = platformComponents['schemas']['ProjectDetailResponse_Output']

export const createTestBranch = (overrides: Partial<Branch> = {}): Branch => ({
  created_at: '2026-01-01T00:00:00Z',
  id: 'branch-id',
  is_default: false,
  name: 'branch',
  parent_project_ref: 'parent-ref',
  persistent: false,
  project_ref: 'branch-ref',
  status: 'MIGRATIONS_PASSED',
  updated_at: '2026-01-01T00:00:00Z',
  with_data: false,
  ...overrides,
})

export const BRANCH_TEST_SCOPE = {
  organizationSlug: 'acme',
  parentRef: 'parent-ref',
  branchRef: 'branch-ref',
} as const

export function mockBranchProject() {
  const { organizationSlug, parentRef, branchRef } = BRANCH_TEST_SCOPE
  addAPIMock({
    method: 'get',
    path: '/platform/projects/:ref',
    response: {
      cloud_provider: 'AWS',
      connectionString: null,
      db_host: `db.${branchRef}.supabase.co`,
      dbVersion: 'supabase-postgres-15.1.0',
      high_availability: false,
      id: 2,
      infra_compute_size: 'micro',
      inserted_at: '2026-01-01T00:00:00.000Z',
      integration_source: null,
      is_branch_enabled: true,
      is_physical_backups_enabled: false,
      name: 'branch',
      organization_id: 1,
      parent_project_ref: parentRef,
      ref: branchRef,
      region: 'us-east-1',
      restUrl: `https://${branchRef}.supabase.co`,
      status: 'ACTIVE_HEALTHY',
      subscription_id: 'subscription-1',
      updated_at: '2026-01-01T00:00:00.000Z',
    } satisfies ProjectDetailResponse,
  })
  addAPIMock({
    method: 'get',
    path: '/platform/organizations',
    response: [createMockOrganizationResponse({ id: 1, slug: organizationSlug })],
  })
}

export function mockParentProjectPermissions(permissions: FgaPermissions[]) {
  mockPermissions({
    organizations: [
      {
        slug: BRANCH_TEST_SCOPE.organizationSlug,
        role: 'developer',
        permissions: [],
        projects: [{ ref: BRANCH_TEST_SCOPE.parentRef, role: 'developer', permissions }],
      },
    ],
  })
}
