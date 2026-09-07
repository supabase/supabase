import { platformComponents as components } from 'api-types'
import { HttpResponse } from 'msw'

import { createMockOrganizationResponse, createMockProject } from '@/tests/helpers'
import { addAPIMock } from '@/tests/lib/msw'
import type { Permission } from '@/types'

/**
 * Test-only fixtures for the scoped-access-token surfaces.
 *
 * The permission-row builders mirror the shape of /platform/profile/permissions rows for each
 * base role, per the ABAC default_permissions seeds (platform: middleware-db). Roles inherit
 * lower roles' rows. Keep the rows in lockstep with ROLE_PROBES in AccessToken.roles.ts.
 */

type AccessControlPermission = components['schemas']['AccessControlPermission']
type OrganizationResponse = components['schemas']['OrganizationResponse']
type ProjectsResponse = components['schemas']['ListProjectsPaginatedResponse']
type OrganizationProjectsResponse = components['schemas']['OrganizationProjectsResponse']
type OrganizationProject = OrganizationProjectsResponse['projects'][number]

/** Satisfies both Studio's `Permission` type and the API's `AccessControlPermission` row shape. */
export type PermissionRowFixture = Permission & {
  organization_id: number | null
  project_ids: number[] | null
}

export const permissionRow = (
  organization_slug: string,
  actions: string[],
  resources: string[],
  // Org-wide rows serialize as [] or null on the wire (nullable in the API contract; the
  // view-synthesized admin rows for auth.subject_roles/user_invites are null).
  project_refs: string[] | null = []
): PermissionRowFixture => ({
  actions: actions as Permission['actions'],
  condition: null as unknown as Permission['condition'],
  organization_id: null,
  organization_slug,
  project_ids: null,
  resources,
  restrictive: false,
  project_refs,
})

export const memberRows = (slug: string, refs: string[] = []) => [
  permissionRow(slug, ['read:Read'], ['members', 'organizations', 'auth.subject_roles'], refs),
]

export const readonlyRows = (slug: string, refs: string[] = []) => [
  ...memberRows(slug, refs),
  permissionRow(slug, ['analytics:Read', 'tenant:Sql:Read:Select'], ['%'], refs),
]

export const developerRows = (slug: string, refs: string[] = []) => [
  ...readonlyRows(slug, refs),
  permissionRow(
    slug,
    ['functions:Write', 'tenant:Sql:Admin:Write', 'tenant:Sql:Query'],
    ['%'],
    refs
  ),
]

export const administratorRows = (slug: string, refs: string[] = []) => [
  ...developerRows(slug, refs),
  permissionRow(slug, ['write:Create', 'write:Update'], ['projects'], refs),
  permissionRow(slug, ['billing:Write', 'infra:Execute'], ['%'], refs),
]

export const ownerRows = (slug: string, refs: string[] = []) => [
  ...administratorRows(slug, refs),
  permissionRow(slug, ['write:Update'], ['organizations'], refs),
  permissionRow(slug, ['write:Create', 'write:Delete'], ['auth.subject_roles'], refs),
]

export const MOCK_ORG = { slug: 'acme-prod', name: 'Acme Production' }
export const MOCK_ORG_2 = { slug: 'acme-staging', name: 'Acme Staging' }
export const MOCK_PROJECT = { ref: 'project-1', name: 'Project 1' }
export const MOCK_PROJECT_2 = { ref: 'project-2', name: 'Project 2' }

const toOrganizationProject = (project: { ref: string; name: string }): OrganizationProject => ({
  cloud_provider: 'AWS',
  databases: [],
  inserted_at: new Date().toISOString(),
  integration_source: null,
  is_branch: false,
  name: project.name,
  ref: project.ref,
  region: 'us-east-1',
  status: 'ACTIVE_HEALTHY',
})

/** Per-org project lists backing the `/platform/organizations/{slug}/projects` mock below. */
const PROJECTS_BY_ORG: Record<string, { ref: string; name: string }[]> = {
  [MOCK_ORG.slug]: [MOCK_PROJECT],
  [MOCK_ORG_2.slug]: [MOCK_PROJECT_2],
}

/**
 * Registers the GET mocks every scoped-token surface fires on mount: one organization
 * ({@link MOCK_ORG}), one project ({@link MOCK_PROJECT}), and the permission scope map.
 */
export const mockScopedTokenEnvironment = () => {
  addAPIMock({
    method: 'get',
    path: '/platform/organizations',
    response: () =>
      HttpResponse.json<OrganizationResponse[]>([
        createMockOrganizationResponse({ slug: MOCK_ORG.slug, name: MOCK_ORG.name }),
      ]),
  })
  addAPIMock({
    method: 'get',
    path: '/platform/projects',
    response: () =>
      HttpResponse.json<ProjectsResponse>({
        pagination: { count: 1, limit: 100, offset: 0 },
        projects: [
          {
            ...createMockProject({ id: 1, ref: MOCK_PROJECT.ref, name: MOCK_PROJECT.name }),
            organization_slug: MOCK_ORG.slug,
            preview_branch_refs: [],
          },
        ],
      }),
  })
  addAPIMock({
    method: 'get',
    path: '/platform/organizations/:slug/projects',
    response: ({ params }) => {
      const slug = (params as { slug: string }).slug
      const projects = (PROJECTS_BY_ORG[slug] ?? []).map(toOrganizationProject)
      return HttpResponse.json<OrganizationProjectsResponse>({
        projects,
        pagination: { count: projects.length, limit: 100, offset: 0 },
      })
    },
  })
  addAPIMock({
    method: 'get',
    // @ts-expect-error Studio API is missing from types
    path: '/scoped-access-token-permissions',
    response: () => HttpResponse.json({ scopes: {}, endpoints: {}, mcp_tools: {} }),
  })
}

export const mockPermissionsApi = (rows: PermissionRowFixture[]) =>
  addAPIMock({
    method: 'get',
    path: '/platform/profile/permissions',
    // Permission['condition'] (jsonLogic operator interfaces) has no index signature, so TS won't
    // match it against the API row's `{ [key: string]: unknown }` — the runtime shape is fine.
    response: () =>
      HttpResponse.json<AccessControlPermission[]>(rows as unknown as AccessControlPermission[]),
  })
