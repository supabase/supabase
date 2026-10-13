import { waitFor } from '@testing-library/react'
import { platformComponents as components } from 'api-types'
import { HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { useUserProjectRegions } from '../useUserProjectRegions'
import { createMockOrganizationResponse } from '@/tests/helpers'
import { customRenderHook } from '@/tests/lib/custom-render'
import { addAPIMock, type APIErrorBody } from '@/tests/lib/msw'
import { createMockProfileContext } from '@/tests/lib/profile-helpers'

type OrganizationResponse = components['schemas']['OrganizationResponse_Output']
type OrganizationProjectsResponse = components['schemas']['OrganizationProjectsResponse_Output']
type OrgProject = OrganizationProjectsResponse['projects'][number]
type OrgDatabase = OrgProject['databases'][number]

function mockProject(
  ref: string,
  databases: Array<{ region: string; type: 'PRIMARY' | 'READ_REPLICA' }>
): OrgProject {
  return {
    cloud_provider: 'AWS',
    databases: databases.map(
      ({ region, type }): OrgDatabase => ({
        cloud_provider: 'AWS',
        identifier: ref,
        region,
        status: 'ACTIVE_HEALTHY',
        type,
      })
    ),
    inserted_at: new Date().toISOString(),
    integration_source: null,
    is_branch: false,
    name: ref,
    ref,
    region: databases[0]?.region ?? 'us-east-1',
    status: 'ACTIVE_HEALTHY',
  }
}

describe('useUserProjectRegions', () => {
  it('resolves normalized regions across orgs, primaries, and read replicas', async () => {
    addAPIMock({
      method: 'get',
      path: '/platform/organizations',
      response: () =>
        HttpResponse.json<OrganizationResponse[]>([
          createMockOrganizationResponse({ slug: 'org-a' }),
          createMockOrganizationResponse({ slug: 'org-b' }),
        ]),
    })
    addAPIMock({
      method: 'get',
      path: '/platform/organizations/:slug/projects',
      response: ({ params }) => {
        if (params.slug === 'org-a') {
          return HttpResponse.json<OrganizationProjectsResponse>({
            pagination: { count: 1, limit: 100, offset: 0 },
            projects: [
              mockProject('project-a', [
                { region: 'US-East-1', type: 'PRIMARY' },
                { region: 'eu-west-1', type: 'READ_REPLICA' },
              ]),
            ],
          })
        }
        return HttpResponse.json<OrganizationProjectsResponse>({
          pagination: { count: 1, limit: 100, offset: 0 },
          projects: [mockProject('project-b', [{ region: 'ap-southeast-1', type: 'PRIMARY' }])],
        })
      },
    })

    const { result } = customRenderHook(() => useUserProjectRegions({ enabled: true }), {
      profileContext: createMockProfileContext(),
    })

    await waitFor(() =>
      expect(result.current).toEqual({
        status: 'resolved',
        context: {
          hasProjects: true,
          regions: new Set(['us-east-1', 'eu-west-1', 'ap-southeast-1']),
          isComplete: true,
        },
      })
    )
  })

  it('marks the context incomplete when an org has more projects than the page returned', async () => {
    addAPIMock({
      method: 'get',
      path: '/platform/organizations',
      response: () =>
        HttpResponse.json<OrganizationResponse[]>([
          createMockOrganizationResponse({ slug: 'org-a' }),
        ]),
    })
    addAPIMock({
      method: 'get',
      path: '/platform/organizations/:slug/projects',
      response: () =>
        HttpResponse.json<OrganizationProjectsResponse>({
          pagination: { count: 150, limit: 100, offset: 0 },
          projects: [mockProject('project-a', [{ region: 'us-east-1', type: 'PRIMARY' }])],
        }),
    })

    const { result } = customRenderHook(() => useUserProjectRegions({ enabled: true }), {
      profileContext: createMockProfileContext(),
    })

    await waitFor(() =>
      expect(result.current).toEqual({
        status: 'resolved',
        context: {
          hasProjects: true,
          regions: new Set(['us-east-1']),
          isComplete: false,
        },
      })
    )
  })

  it('fails open when the organizations query errors', async () => {
    addAPIMock({
      method: 'get',
      path: '/platform/organizations',
      response: () =>
        HttpResponse.json<APIErrorBody>({ message: 'Boom from the backend' }, { status: 500 }),
    })

    const { result } = customRenderHook(() => useUserProjectRegions({ enabled: true }), {
      profileContext: createMockProfileContext(),
    })

    await waitFor(() =>
      expect(result.current).toEqual({
        status: 'resolved',
        context: {
          hasProjects: true,
          regions: new Set(),
          isComplete: false,
        },
      })
    )
  })
})
