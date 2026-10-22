import { QueryClient } from '@tanstack/react-query'
import { waitFor } from '@testing-library/react'
import { platformComponents as components } from 'api-types'
import { HttpResponse } from 'msw'
import { beforeEach, describe, expect, expectTypeOf, test, vi } from 'vitest'

import {
  ensureGrant,
  getGrant,
  useGrant,
  type Grant,
  type GrantFor,
  type GrantResult,
} from './grants'
import { projectKeys } from '@/data/projects/keys'
import type { ProjectDetailData } from '@/data/projects/project-detail-query'
import { createMockOrganizationResponse } from '@/tests/helpers'
import { customRenderHook } from '@/tests/lib/custom-render'
import { addAPIMock, type APIErrorBody } from '@/tests/lib/msw'
import { createMockProfileContext } from '@/tests/lib/profile-helpers'

type PermissionsV2Response = components['schemas']['UserPermissionsResponse_Output']
type OrganizationResponse = ReturnType<typeof createMockOrganizationResponse>

const mocks = vi.hoisted((): { isPlatform: boolean; params: { ref?: string } } => ({
  isPlatform: true,
  params: { ref: 'default' },
}))

vi.mock('common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('common')>()
  return {
    ...actual,
    useParams: () => mocks.params,
    useIsLoggedIn: () => true,
  }
})

vi.mock('@/lib/constants', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>()
  return {
    ...actual,
    get IS_PLATFORM() {
      return mocks.isPlatform
    },
  }
})

const ORG_SLUG = 'test-org'
const BRANCHES = 'GET /v1/projects/{ref}/branches'
const DELETE_BRANCH = 'DELETE /v1/branches/{branch_id_or_ref}'
const PROFILE_CONTEXT = createMockProfileContext()

function permissionsFor(
  org: Partial<PermissionsV2Response['organizations'][number]> = {}
): PermissionsV2Response {
  return {
    organizations: [{ slug: ORG_SLUG, role: 'developer', permissions: [], projects: [], ...org }],
  }
}

function mockPermissions(response: PermissionsV2Response) {
  addAPIMock({
    method: 'get',
    path: '/platform/profile/permissions/v2',
    response: () => HttpResponse.json<PermissionsV2Response>(response),
  })
}

function mockOrganizations(details: Partial<OrganizationResponse> = {}) {
  addAPIMock({
    method: 'get',
    path: '/platform/organizations',
    response: () =>
      HttpResponse.json<OrganizationResponse[]>([
        createMockOrganizationResponse({ id: 1, slug: ORG_SLUG, ...details }),
      ]),
  })
}

const BRANCH_PROJECT: ProjectDetailData = {
  cloud_provider: 'AWS',
  connectionString: 'postgresql://postgres:password@db.branch-ref.supabase.co:5432/postgres',
  db_host: 'db.branch-ref.supabase.co',
  dbVersion: 'supabase-postgres-15.1.0',
  high_availability: false,
  id: 2,
  infra_compute_size: 'micro',
  inserted_at: '2026-01-01T00:00:00.000Z',
  integration_source: null,
  is_branch_enabled: false,
  is_physical_backups_enabled: false,
  name: 'Branch',
  organization_id: 1,
  parent_project_ref: 'parent-ref',
  ref: 'branch-ref',
  region: 'us-east-1',
  restUrl: 'https://branch-ref.supabase.co',
  status: 'ACTIVE_HEALTHY',
  subscription_id: 'subscription-1',
  updated_at: '2026-01-01T00:00:00.000Z',
}

function mockProjectDetail() {
  addAPIMock({
    method: 'get',
    path: '/platform/projects/:ref',
    response: ({ params }) =>
      HttpResponse.json<ProjectDetailData>(
        params.ref === BRANCH_PROJECT.ref
          ? BRANCH_PROJECT
          : { ...BRANCH_PROJECT, ref: String(params.ref), parent_project_ref: undefined }
      ),
  })
}

beforeEach(() => {
  mocks.isPlatform = true
  mocks.params = { ref: 'default' }
})

describe('getGrant', () => {
  const scope = { organizationSlug: ORG_SLUG, projectRef: 'proj' }

  test('mints from any satisfied group of an OR-of-AND requirement', () => {
    const dev = permissionsFor({ permissions: ['branching_development_read'] })
    const prod = permissionsFor({ permissions: ['branching_production_read'] })

    expect(getGrant(dev, BRANCHES, scope).status).toBe('granted')
    expect(getGrant(prod, BRANCHES, scope).status).toBe('granted')
  })

  test('records the endpoint and scope on the grant', () => {
    const result = getGrant(
      permissionsFor({ permissions: ['branching_production_read'] }),
      BRANCHES,
      scope
    )

    expect(result).toEqual({
      status: 'granted',
      grant: {
        endpoint: BRANCHES,
        variant: undefined,
        organizationSlug: ORG_SLUG,
        projectRef: 'proj',
      },
    })
  })

  test('denies when no group is satisfied or permissions are missing', () => {
    expect(getGrant(permissionsFor(), BRANCHES, scope)).toEqual({ status: 'denied' })
    expect(getGrant(undefined, BRANCHES, scope)).toEqual({ status: 'denied' })
    expect(
      getGrant(permissionsFor({ permissions: ['branching_production_read'] }), BRANCHES, {
        ...scope,
        organizationSlug: 'other-org',
      })
    ).toEqual({ status: 'denied' })
  })

  test('evaluates against permissionsProjectRef but records the branch ref', () => {
    const data = permissionsFor({
      role: 'member',
      projects: [
        { ref: 'parent-ref', role: 'developer', permissions: ['branching_production_read'] },
      ],
    })

    const result = getGrant(data, BRANCHES, {
      ...scope,
      projectRef: 'branch-ref',
      permissionsProjectRef: 'parent-ref',
    })
    expect(result.status).toBe('granted')
    if (result.status === 'granted') expect(result.grant.projectRef).toBe('branch-ref')

    expect(getGrant(data, BRANCHES, { ...scope, projectRef: 'branch-ref' }).status).toBe('denied')
  })

  test('supports an explicit project scope for endpoints without the project in the path', () => {
    const data = permissionsFor({
      role: 'member',
      projects: [{ ref: 'proj', role: 'developer', permissions: ['branching_development_delete'] }],
    })

    expect(getGrant(data, DELETE_BRANCH, scope).status).toBe('granted')
    expect(getGrant(data, DELETE_BRANCH, { ...scope, projectRef: 'other' }).status).toBe('denied')
  })

  test('mints without permission data when self-hosted', () => {
    mocks.isPlatform = false

    expect(getGrant(undefined, BRANCHES, { projectRef: 'proj' }).status).toBe('granted')
  })

  test('denies an unknown variant at runtime', () => {
    const data = permissionsFor({ permissions: ['branching_production_read'] })

    const result = getGrant(data, BRANCHES, scope, { variant: 'write' as never })
    expect(result).toEqual({ status: 'denied' })
  })
})

describe('useGrant', () => {
  test('moves from loading to granted', async () => {
    mockPermissions(permissionsFor({ permissions: ['branching_production_read'] }))

    const { result } = customRenderHook(
      () => useGrant(BRANCHES, { organizationSlug: ORG_SLUG, projectRef: 'proj' }),
      { profileContext: PROFILE_CONTEXT }
    )

    expect(result.current.status).toBe('loading')
    await waitFor(() => expect(result.current.status).toBe('granted'))
    expect(result.current.grant).toEqual({
      endpoint: BRANCHES,
      variant: undefined,
      organizationSlug: ORG_SLUG,
      projectRef: 'proj',
    })
  })

  test('denies when the permissions are missing', async () => {
    mockPermissions(permissionsFor())

    const { result } = customRenderHook(
      () => useGrant(BRANCHES, { organizationSlug: ORG_SLUG, projectRef: 'proj' }),
      { profileContext: PROFILE_CONTEXT }
    )

    await waitFor(() => expect(result.current.status).toBe('denied'))
    expect(result.current.grant).toBeUndefined()
  })

  test('reports an error when the permissions request fails', async () => {
    addAPIMock({
      method: 'get',
      path: '/platform/profile/permissions/v2',
      response: () => HttpResponse.json<APIErrorBody>({ message: 'Boom' }, { status: 500 }),
    })

    const { result } = customRenderHook(
      () => useGrant(BRANCHES, { organizationSlug: ORG_SLUG, projectRef: 'proj' }),
      { profileContext: PROFILE_CONTEXT }
    )

    await waitFor(() => expect(result.current.status).toBe('error'))
    expect(result.current).toMatchObject({ error: { message: 'Boom' } })
  })

  test('grants immediately when self-hosted', () => {
    mocks.isPlatform = false

    const { result } = customRenderHook(() => useGrant(BRANCHES, { projectRef: 'proj' }), {
      profileContext: PROFILE_CONTEXT,
    })

    expect(result.current.status).toBe('granted')
  })

  test('resolves a branch from the URL to its parent but records the branch ref', async () => {
    mocks.params = { ref: 'branch-ref' }
    addAPIMock({
      method: 'get',
      path: '/platform/projects/:ref',
      response: () => HttpResponse.json<ProjectDetailData>(BRANCH_PROJECT),
    })
    mockOrganizations()
    mockPermissions(
      permissionsFor({
        role: 'member',
        projects: [
          { ref: 'parent-ref', role: 'developer', permissions: ['branching_production_read'] },
        ],
      })
    )

    const { result } = customRenderHook(() => useGrant(BRANCHES, {}), {
      profileContext: PROFILE_CONTEXT,
    })

    await waitFor(() => expect(result.current.status).toBe('granted'))
    expect(result.current.grant).toMatchObject({
      organizationSlug: ORG_SLUG,
      projectRef: 'branch-ref',
    })
  })

  test('returns a stable result across rerenders', async () => {
    mockPermissions(permissionsFor({ permissions: ['branching_production_read'] }))

    const { result, rerender } = customRenderHook(
      () => useGrant(BRANCHES, { organizationSlug: ORG_SLUG, projectRef: 'proj' }),
      { profileContext: PROFILE_CONTEXT }
    )

    await waitFor(() => expect(result.current.status).toBe('granted'))
    const first = result.current
    rerender()
    expect(result.current).toBe(first)
  })
})

describe('ensureGrant', () => {
  const scope = { organizationSlug: ORG_SLUG, projectRef: 'proj' }

  beforeEach(() => {
    mockProjectDetail()
  })

  test('grants when permissions allow', async () => {
    mockPermissions(permissionsFor({ permissions: ['branching_production_read'] }))

    const result = await ensureGrant(new QueryClient(), BRANCHES, scope)

    expect(result.status).toBe('granted')
  })

  test('denies when permissions are missing', async () => {
    mockPermissions(permissionsFor())

    expect(await ensureGrant(new QueryClient(), BRANCHES, scope)).toEqual({ status: 'denied' })
  })

  test('returns an error when permissions cannot be fetched', async () => {
    addAPIMock({
      method: 'get',
      path: '/platform/profile/permissions/v2',
      response: () => HttpResponse.json<APIErrorBody>({ message: 'Boom' }, { status: 500 }),
    })

    const result = await ensureGrant(new QueryClient(), BRANCHES, scope)

    expect(result).toMatchObject({ status: 'error', error: { message: 'Boom' } })
  })

  test('grants without fetching when self-hosted', async () => {
    mocks.isPlatform = false

    const result = await ensureGrant(new QueryClient(), BRANCHES, scope)

    expect(result.status).toBe('granted')
  })

  test('fetches the project detail to resolve the parent ref', async () => {
    mockPermissions(
      permissionsFor({
        role: 'member',
        projects: [
          { ref: 'parent-ref', role: 'developer', permissions: ['branching_production_read'] },
        ],
      })
    )
    const queryClient = new QueryClient()

    const result = await ensureGrant(queryClient, BRANCHES, {
      organizationSlug: ORG_SLUG,
      projectRef: 'branch-ref',
    })

    expect(result.status).toBe('granted')
    if (result.status === 'granted') expect(result.grant.projectRef).toBe('branch-ref')
    expect(queryClient.getQueryData(projectKeys.detail('branch-ref'))).toMatchObject({
      parent_project_ref: 'parent-ref',
    })
  })

  test('returns an error when the project detail cannot be fetched', async () => {
    mockPermissions(permissionsFor({ permissions: ['branching_production_read'] }))
    addAPIMock({
      method: 'get',
      path: '/platform/projects/:ref',
      response: () => HttpResponse.json<APIErrorBody>({ message: 'Boom' }, { status: 500 }),
    })

    const result = await ensureGrant(new QueryClient(), BRANCHES, scope)

    expect(result).toMatchObject({ status: 'error', error: { message: 'Boom' } })
  })
})

describe('types', () => {
  type BranchesGrant = Grant<'GET /v1/projects/{ref}/branches'>
  type CreateBranchGrant = Grant<'POST /v1/projects/{ref}/branches'>

  test('grants are bound to their endpoint', () => {
    function check(grant: BranchesGrant) {
      // @ts-expect-error a grant for another endpoint is not interchangeable
      const other: CreateBranchGrant = grant
      return other
    }
    expect(check).toBeDefined()
  })

  test('a plain object is not a grant', () => {
    const plain = {
      endpoint: 'GET /v1/projects/{ref}/branches' as const,
      variant: undefined,
      organizationSlug: 'org',
      projectRef: 'proj',
    }
    // @ts-expect-error the brand can only be minted by getGrant
    const grant: BranchesGrant = plain
    expect(grant).toBeDefined()
  })

  test('GrantFor resolves annotated endpoints and is never otherwise', () => {
    expectTypeOf<GrantFor<'GET', '/v1/projects/{ref}/branches'>>().toEqualTypeOf<BranchesGrant>()
    expectTypeOf<GrantFor<'GET', '/platform/profile'>>().toBeNever()
  })

  test('useGrant narrows the grant on status', () => {
    type Result = ReturnType<typeof useGrant<'GET /v1/projects/{ref}/branches'>>
    expectTypeOf<Result>().toEqualTypeOf<GrantResult<'GET /v1/projects/{ref}/branches'>>()

    function check(result: Result) {
      expectTypeOf(result.grant).toEqualTypeOf<BranchesGrant | undefined>()
      if (result.status === 'granted') {
        expectTypeOf(result.grant).toEqualTypeOf<BranchesGrant>()
      }
    }
    expect(check).toBeDefined()
  })
})
