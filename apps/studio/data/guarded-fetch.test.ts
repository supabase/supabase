import type { FgaGuardedEndpoint } from 'api-types'
import { assertType, describe, expect, it, vi } from 'vitest'

import { client, get, post } from './fetchers'
import { assertGrant, GrantAssertionError, guardMethod, unguarded } from './guarded-fetch'
import type { Grant } from '@/lib/grants'

function testGrant<E extends FgaGuardedEndpoint>(
  endpoint: E,
  opts: { projectRef?: string; permissionsProjectRef?: string; slug?: string } = {}
) {
  return {
    endpoint,
    variant: undefined,
    organizationSlug: opts.slug,
    projectRef: opts.projectRef,
    permissionsProjectRef: opts.permissionsProjectRef ?? opts.projectRef,
  } as unknown as Grant<E>
}

const BRANCHES = 'GET /v1/projects/{ref}/branches'
const params = { path: { ref: 'proj' } }

type Result<F extends () => unknown> = Awaited<ReturnType<F>>
type Equals<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false

describe('guarded fetch types', () => {
  it('match the raw client', () => {
    const branchesGrant = testGrant(BRANCHES)

    const g1 = () => get('/v1/projects/{ref}/branches', { params, grant: branchesGrant })
    const r1 = () => client.GET('/v1/projects/{ref}/branches', { params })
    assertType<Equals<Result<typeof g1>, Result<typeof r1>>>(true)

    const body = { branch_name: 'dev' }
    const g2 = () =>
      post('/v1/projects/{ref}/branches', {
        params,
        body,
        grant: testGrant('POST /v1/projects/{ref}/branches'),
      })
    const r2 = () => client.POST('/v1/projects/{ref}/branches', { params, body })
    assertType<Equals<Result<typeof g2>, Result<typeof r2>>>(true)

    const path = `/v1/projects/{ref}/${'branches'}` as const
    const g3 = () => get(path, { params, grant: branchesGrant })
    assertType<Equals<Result<typeof g3>, Result<typeof r1>>>(true)

    const g4 = () =>
      get('/v1/projects/{ref}/branches', { params, parseAs: 'text', grant: branchesGrant })
    const r4 = () => client.GET('/v1/projects/{ref}/branches', { params, parseAs: 'text' })
    assertType<Equals<Result<typeof g4>, Result<typeof r4>>>(true)

    const signal = new AbortController().signal
    const headers = { 'x-test': '1' }
    const g5 = () =>
      get('/v1/projects/{ref}/branches', { params, signal, headers, grant: branchesGrant })
    const r5 = () => client.GET('/v1/projects/{ref}/branches', { params, signal, headers })
    assertType<Equals<Result<typeof g5>, Result<typeof r5>>>(true)

    const g6 = () => get('/platform/profile')
    const r6 = () => client.GET('/platform/profile')
    assertType<Equals<Result<typeof g6>, Result<typeof r6>>>(true)

    const g7 = () => get('/platform/projects/{ref}/settings', { params })
    const r7 = () => client.GET('/platform/projects/{ref}/settings', { params })
    assertType<Equals<Result<typeof g7>, Result<typeof r7>>>(true)

    const g8 = () => get('/v1/organizations', { grant: unguarded.migrating })
    const r8 = () => client.GET('/v1/organizations')
    assertType<Equals<Result<typeof g8>, Result<typeof r8>>>(true)

    const g9 = () =>
      get('/v1/projects/{ref}/branches', { params, grant: unguarded.byDesign('test') })
    assertType<Equals<Result<typeof g9>, Result<typeof r1>>>(true)
  })

  it('reject missing or mismatched grants', () => {
    const branchesGrant = testGrant(BRANCHES)

    // @ts-expect-error missing grant
    void (() => get('/v1/projects/{ref}/branches', { params }))
    // @ts-expect-error undefined grant
    void (() => get('/v1/projects/{ref}/branches', { params, grant: undefined }))
    // @ts-expect-error missing init on an annotated endpoint whose init was optional
    void (() => get('/v1/organizations'))
    // @ts-expect-error grant for a different path
    void (() => get('/v1/organizations', { grant: branchesGrant }))
    const wrongMethod = { params, body: { branch_name: 'dev' }, grant: branchesGrant }
    // @ts-expect-error grant for the same path with a different method
    void (() => post('/v1/projects/{ref}/branches', wrongMethod))
    // @ts-expect-error grant on an unannotated endpoint
    void (() => get('/platform/projects/{ref}/settings', { params, grant: branchesGrant }))
    const unannotatedUnguarded = { params, grant: unguarded.migrating }
    // @ts-expect-error unguarded on an unannotated endpoint
    void (() => get('/platform/projects/{ref}/settings', unannotatedUnguarded))
    // @ts-expect-error forged grant
    void (() => get('/v1/projects/{ref}/branches', { params, grant: { endpoint: BRANCHES } }))
    // @ts-expect-error string as grant
    void (() => get('/v1/projects/{ref}/branches', { params, grant: BRANCHES }))
    // @ts-expect-error grant doesn't make required params optional
    void (() => get('/v1/projects/{ref}/branches', { grant: branchesGrant }))
    const wrongBody = {
      params,
      body: { nope: 1 },
      grant: testGrant('POST /v1/projects/{ref}/branches'),
    }
    // @ts-expect-error body is still checked
    void (() => post('/v1/projects/{ref}/branches', wrongBody))
    // @ts-expect-error path not in the spec
    void (() => get('/v1/not-a-path', { grant: unguarded.migrating }))
  })
})

describe('guardMethod', () => {
  it('strips the grant before calling the raw method', async () => {
    const raw = vi.fn().mockResolvedValue({})
    const guarded = guardMethod('get', raw)

    await guarded('/v1/projects/{ref}/branches', { params, grant: testGrant(BRANCHES) })

    expect(raw).toHaveBeenCalledWith('/v1/projects/{ref}/branches', { params })
  })

  it('throws in development when the grant is missing', () => {
    const guarded = guardMethod('get', vi.fn())
    expect(() => guarded('/v1/projects/{ref}/branches', { params })).toThrow(GrantAssertionError)
  })
})

describe('assertGrant', () => {
  const check =
    (endpoint: string, grant: unknown, init: object = { params }) =>
    () =>
      assertGrant(endpoint, grant, init)

  it('accepts a matching grant', () => {
    expect(check(BRANCHES, testGrant(BRANCHES, { projectRef: 'proj' }))).not.toThrow()
  })

  it('accepts unguarded, and requires a byDesign reason', () => {
    expect(check(BRANCHES, unguarded.migrating)).not.toThrow()
    expect(check(BRANCHES, unguarded.byDesign('optimistic call'))).not.toThrow()
    // eslint-disable-next-line fga/unguarded-by-design-reason -- asserts the runtime check
    expect(check(BRANCHES, unguarded.byDesign(''))).toThrow('needs a reason')
  })

  it('rejects a missing grant on an annotated endpoint', () => {
    expect(check(BRANCHES, undefined)).toThrow('missing grant')
  })

  it('rejects a grant on an unannotated endpoint', () => {
    expect(check('GET /platform/profile', testGrant(BRANCHES), {})).toThrow('no FGA annotation')
  })

  it('rejects a grant for another endpoint', () => {
    expect(check(BRANCHES, testGrant('GET /v1/organizations'))).toThrow(
      'grant is for GET /v1/organizations'
    )
  })

  it('rejects a grant for another project', () => {
    expect(check(BRANCHES, testGrant(BRANCHES, { projectRef: 'other' }))).toThrow(
      "grant is for project 'other'"
    )
  })

  it("accepts a branch project's grant for its parent project", () => {
    const grant = testGrant(BRANCHES, { projectRef: 'branch', permissionsProjectRef: 'proj' })
    expect(check(BRANCHES, grant)).not.toThrow()
  })

  it('accepts a grant without a project ref for any project', () => {
    expect(check(BRANCHES, testGrant(BRANCHES))).not.toThrow()
  })

  it('rejects a grant for another organization', () => {
    const endpoint = 'DELETE /platform/organizations/{slug}/members/invitations/{id}'
    const init = { params: { path: { slug: 'org', id: 1 } } }
    expect(check(endpoint, testGrant(endpoint, { slug: 'org' }), init)).not.toThrow()
    expect(check(endpoint, testGrant(endpoint, { slug: 'other' }), init)).toThrow(
      "grant is for organization 'other'"
    )
  })
})
