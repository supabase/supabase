import { assertType, describe, expect, it, vi } from 'vitest'

import { client, get, patch, post } from './fetchers'
import { assertGrant, GrantAssertionError, guardMethod, unguarded } from './guarded-fetch'
import type { Grant } from '@/lib/grants'
import { testGrant } from '@/tests/lib/test-grant'

const BRANCHES = 'GET /v1/projects/{ref}/branches'
const API_KEYS = 'GET /v1/projects/{ref}/api-keys'
const API_KEY = 'GET /v1/projects/{ref}/api-keys/{id}'
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

  it('require a variant where the refinement says so', () => {
    const branchParams = { params: { path: { branch_id_or_ref: 'branch' } }, body: {} }
    const UPDATE_BRANCH = 'PATCH /v1/branches/{branch_id_or_ref}'

    void (() =>
      patch('/v1/branches/{branch_id_or_ref}', {
        ...branchParams,
        grant: testGrant(UPDATE_BRANCH, { variant: 'production' }),
      }))
    void (() =>
      patch('/v1/branches/{branch_id_or_ref}', {
        ...branchParams,
        grant: testGrant(UPDATE_BRANCH, { variant: 'development' }),
      }))
    const plain = { ...branchParams, grant: testGrant(UPDATE_BRANCH) }
    // @ts-expect-error plain grant where a variant is required
    void (() => patch('/v1/branches/{branch_id_or_ref}', plain))
  })
})

describe('guarded fetch types for an endpoint with an owned query param', () => {
  it('match the raw client with a plain or reveal grant', () => {
    const r = () => client.GET('/v1/projects/{ref}/api-keys', { params })

    const plain = () => get('/v1/projects/{ref}/api-keys', { params, grant: testGrant(API_KEYS) })
    assertType<Equals<Result<typeof plain>, Result<typeof r>>>(true)

    const reveal = () =>
      get('/v1/projects/{ref}/api-keys', {
        params,
        grant: testGrant(API_KEYS, { variant: 'reveal' }),
      })
    assertType<Equals<Result<typeof reveal>, Result<typeof r>>>(true)
  })

  it('reject the owned query param', () => {
    const query = { reveal: 'true' } as const
    const plainWithReveal = {
      params: { path: params.path, query },
      grant: testGrant(API_KEYS),
    }
    // @ts-expect-error `reveal` is set from the grant, not by the caller (plain grant)
    void (() => get('/v1/projects/{ref}/api-keys', plainWithReveal))

    const revealGrantWithReveal = {
      params: { path: params.path, query },
      grant: testGrant(API_KEYS, { variant: 'reveal' }),
    }
    // @ts-expect-error `reveal` is set from the grant, not by the caller (reveal grant)
    void (() => get('/v1/projects/{ref}/api-keys', revealGrantWithReveal))
  })

  it('reject a variant the endpoint does not have', () => {
    void (() => get('/v1/projects/{ref}/branches', { params, grant: testGrant(BRANCHES) }))
    // @ts-expect-error the endpoint has no `reveal` variant
    void (() => testGrant(BRANCHES, { variant: 'reveal' }))
    const revealGrant = testGrant(API_KEYS, { variant: 'reveal' })
    const wrongEndpoint = { params, grant: revealGrant }
    // @ts-expect-error a reveal grant for api-keys isn't a grant for branches
    void (() => get('/v1/projects/{ref}/branches', wrongEndpoint))
  })

  it('match the raw client for a single key with a plain or reveal grant', () => {
    const keyParams = { path: { ref: 'proj', id: 'key' } }
    const r = () => client.GET('/v1/projects/{ref}/api-keys/{id}', { params: keyParams })

    const plain = () =>
      get('/v1/projects/{ref}/api-keys/{id}', { params: keyParams, grant: testGrant(API_KEY) })
    assertType<Equals<Result<typeof plain>, Result<typeof r>>>(true)

    const reveal = () =>
      get('/v1/projects/{ref}/api-keys/{id}', {
        params: keyParams,
        grant: testGrant(API_KEY, { variant: 'reveal' }),
      })
    assertType<Equals<Result<typeof reveal>, Result<typeof r>>>(true)
  })

  it('reject the owned query param and a list grant for a single key', () => {
    const path = { ref: 'proj', id: 'key' }
    const withReveal = {
      params: { path, query: { reveal: 'true' } as const },
      grant: testGrant(API_KEY, { variant: 'reveal' }),
    }
    // @ts-expect-error `reveal` is set from the grant, not by the caller
    void (() => get('/v1/projects/{ref}/api-keys/{id}', withReveal))

    const listGrant = { params: { path }, grant: testGrant(API_KEYS, { variant: 'reveal' }) }
    // @ts-expect-error a reveal grant for api-keys isn't a grant for api-keys/{id}
    void (() => get('/v1/projects/{ref}/api-keys/{id}', listGrant))
  })

  it('treat grants with different variants as distinct types', () => {
    type Plain = Grant<typeof API_KEYS>
    type Reveal = Grant<typeof API_KEYS, 'reveal'>
    assertType<Equals<Reveal extends Plain ? true : false, false>>(true)
    assertType<Equals<Plain extends Reveal ? true : false, false>>(true)
  })
})

describe('guardMethod', () => {
  it('strips the grant before calling the raw method', async () => {
    const raw = vi.fn().mockResolvedValue({})
    const guarded = guardMethod('get', raw)

    await guarded('/v1/projects/{ref}/branches', { params, grant: testGrant(BRANCHES) })

    expect(raw).toHaveBeenCalledWith('/v1/projects/{ref}/branches', { params })
  })

  it.each([
    { name: 'a reveal grant', grant: testGrant(API_KEYS, { variant: 'reveal' }), reveal: 'true' },
    { name: 'a plain grant', grant: testGrant(API_KEYS), reveal: 'false' },
    { name: 'unguarded', grant: unguarded.byDesign('test'), reveal: 'false' },
  ])('sets reveal=$reveal for $name', async ({ grant, reveal }) => {
    const raw = vi.fn().mockResolvedValue({})
    const guarded = guardMethod('get', raw)

    await guarded('/v1/projects/{ref}/api-keys', { params, grant })

    expect(raw).toHaveBeenCalledWith('/v1/projects/{ref}/api-keys', {
      params: { path: params.path, query: { reveal } },
    })
  })

  it.each([
    { name: 'a reveal grant', grant: testGrant(API_KEY, { variant: 'reveal' }), reveal: 'true' },
    { name: 'a plain grant', grant: testGrant(API_KEY), reveal: 'false' },
  ])('sets reveal=$reveal on a single key for $name', async ({ grant, reveal }) => {
    const raw = vi.fn().mockResolvedValue({})
    const guarded = guardMethod('get', raw)
    const keyParams = { path: { ref: 'proj', id: 'key' } }

    await guarded('/v1/projects/{ref}/api-keys/{id}', { params: keyParams, grant })

    expect(raw).toHaveBeenCalledWith('/v1/projects/{ref}/api-keys/{id}', {
      params: { path: keyParams.path, query: { reveal } },
    })
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

  it('rejects a grant with an unknown variant', () => {
    const grant = testGrant(API_KEYS, { variant: 'nope' as never })
    expect(check(API_KEYS, grant)).toThrow("unknown variant 'nope'")
    expect(check(API_KEYS, testGrant(API_KEYS, { variant: 'reveal' }))).not.toThrow()
  })

  it('accepts a grant without a project ref for any project', () => {
    expect(check(BRANCHES, testGrant(BRANCHES))).not.toThrow()
  })

  it.each([
    'GET /v1/branches/{branch_id_or_ref}',
    'PATCH /v1/branches/{branch_id_or_ref}',
    'DELETE /v1/branches/{branch_id_or_ref}',
    'GET /v1/branches/{branch_id_or_ref}/diff',
    'POST /v1/branches/{branch_id_or_ref}/merge',
    'POST /v1/branches/{branch_id_or_ref}/push',
    'POST /v1/branches/{branch_id_or_ref}/reset',
    'POST /v1/branches/{branch_id_or_ref}/restore',
  ] as const)('requires a variant for %s', (endpoint) => {
    const init = { params: { path: { branch_id_or_ref: 'branch' } } }
    expect(check(endpoint, testGrant(endpoint), init)).toThrow('grant needs a variant')
    expect(check(endpoint, testGrant(endpoint, { variant: 'development' }), init)).not.toThrow()
  })

  it('requires the production variant to create a default or data branch', () => {
    const endpoint = 'POST /v1/projects/{ref}/branches'
    const create = (body: object) => ({ params, body: { branch_name: 'dev', ...body } })
    expect(check(endpoint, testGrant(endpoint), create({}))).not.toThrow()
    expect(check(endpoint, testGrant(endpoint), create({ is_default: true }))).toThrow(
      "request needs variant 'production'"
    )
    expect(check(endpoint, testGrant(endpoint), create({ with_data: true }))).toThrow(
      "request needs variant 'production'"
    )
    expect(
      check(endpoint, testGrant(endpoint, { variant: 'production' }), create({ with_data: true }))
    ).not.toThrow()
  })

  it('rejects a grant for another organization', () => {
    const endpoint = 'DELETE /platform/organizations/{slug}/members/invitations/{id}'
    const init = { params: { path: { slug: 'org', id: 1 } } }
    expect(check(endpoint, testGrant(endpoint, { organizationSlug: 'org' }), init)).not.toThrow()
    expect(check(endpoint, testGrant(endpoint, { organizationSlug: 'other' }), init)).toThrow(
      "grant is for organization 'other'"
    )
  })
})
