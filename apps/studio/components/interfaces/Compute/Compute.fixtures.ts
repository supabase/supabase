import type { components } from 'api-types'
import { HttpResponse } from 'msw'

import type { ProfileContextType } from '@/lib/profile'
import { addAPIMock } from '@/tests/lib/msw'

type OrganizationProjectsResponse = components['schemas']['OrganizationProjectsResponse_Output']
type OrganizationProject = OrganizationProjectsResponse['projects'][number]

/**
 * The projects Compute usage is generated against. Mock figures get draped over the real
 * project list, so any surface reading org-wide Compute usage needs this mock registered.
 */
export const COMPUTE_MOCK_PROJECTS = [
  { ref: 'prod-api', name: 'Production API' },
  { ref: 'media-jobs', name: 'Media jobs' },
  { ref: 'webhooks', name: 'Webhook relay' },
] as const

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

export const mockOrgProjectsForCompute = (
  projects: readonly { ref: string; name: string }[] = COMPUTE_MOCK_PROJECTS
) => {
  addAPIMock({
    method: 'get',
    path: '/platform/organizations/:slug/projects',
    response: () =>
      HttpResponse.json<OrganizationProjectsResponse>({
        projects: projects.map(toOrganizationProject),
        pagination: { count: projects.length, limit: 100, offset: 0 },
      }),
  })
}

/**
 * Several queries behind the Compute surfaces hold until a profile resolves —
 * useOrganizationsQuery and useOrgProjectsInfiniteQuery among them — so a test that omits
 * this never leaves its loading state.
 */
export const COMPUTE_PROFILE_CONTEXT: ProfileContextType = {
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
