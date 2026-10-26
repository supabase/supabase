import { platformComponents as components } from 'api-types'
import { HttpResponse } from 'msw'

import { createMockOrganizationResponse, createMockProject } from '@/tests/helpers'
import { addAPIMock } from '@/tests/lib/msw'

/**
 * Test-only fixtures for the scoped-access-token surfaces.
 *
 * The role builders mirror the shape of /platform/profile/permissions/v2 organization entries.
 * Token role logic only reads `role` (org and project level), so `permissions` stays empty.
 */

type OrganizationResponse = components['schemas']['OrganizationResponse_Output']
type ProjectsResponse = components['schemas']['ListProjectsPaginatedResponse_Output']
type OrganizationProjectsResponse = components['schemas']['OrganizationProjectsResponse_Output']
type OrganizationProject = OrganizationProjectsResponse['projects'][number]
type PermissionsV2Response = components['schemas']['UserPermissionsResponse_Output']
export type PermissionOrgFixture = PermissionsV2Response['organizations'][number]
type Role = PermissionOrgFixture['role']

/**
 * Org-wide role when `refs` is empty. With `refs`, the user only holds the role on those
 * projects and is a plain org `member`.
 */
export const roleEntry = (slug: string, role: Role, refs: string[] = []): PermissionOrgFixture =>
  refs.length === 0
    ? { slug, role, permissions: [], projects: [] }
    : {
        slug,
        role: 'member',
        permissions: [],
        projects: refs.map((ref) => ({ ref, role, permissions: [] })),
      }

export const memberRows = (slug: string, refs: string[] = []) => [roleEntry(slug, 'member', refs)]
export const readonlyRows = (slug: string, refs: string[] = []) => [
  roleEntry(slug, 'readonly', refs),
]
export const developerRows = (slug: string, refs: string[] = []) => [
  roleEntry(slug, 'developer', refs),
]
export const administratorRows = (slug: string, refs: string[] = []) => [
  roleEntry(slug, 'administrator', refs),
]
export const ownerRows = (slug: string, refs: string[] = []) => [roleEntry(slug, 'owner', refs)]

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

export const mockPermissionsApi = (organizations: PermissionOrgFixture[]) =>
  addAPIMock({
    method: 'get',
    path: '/platform/profile/permissions/v2',
    response: () => HttpResponse.json<PermissionsV2Response>({ organizations }),
  })
