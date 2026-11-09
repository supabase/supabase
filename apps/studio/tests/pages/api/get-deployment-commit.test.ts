import type { NextApiRequest, NextApiResponse } from 'next'
import { createMocks } from 'node-mocks-http'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { toWebHandler } from '@/compat/next/api'
import handler from '@/pages/api/get-deployment-commit'

const SHA = '0123456789abcdef0123456789abcdef01234567'
const COMMIT_URL = `https://api.github.com/repos/supabase/supabase/git/commits/${SHA}`
const fetchMock = vi.fn<typeof fetch>()

async function invokeNext() {
  const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
    method: 'GET',
    query: { sha: 'untrusted-request-sha' },
    headers: { authorization: 'Bearer test-session', cookie: 'session=test-session' },
  })
  await handler(req, res)
  return {
    status: res._getStatusCode(),
    body: res._getJSONData(),
    cacheControl: res.getHeader('Cache-Control'),
  }
}

async function invokeTanstack() {
  const response = await toWebHandler(handler)({
    request: new Request(
      'https://studio.example/api/get-deployment-commit?sha=untrusted-request-sha',
      {
        headers: { authorization: 'Bearer test-session', cookie: 'session=test-session' },
      }
    ),
  })
  return {
    status: response.status,
    body: await response.json(),
    cacheControl: response.headers.get('Cache-Control'),
  }
}

beforeEach(() => {
  vi.stubEnv('VERCEL_GIT_COMMIT_SHA', SHA)
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})

describe.each([
  { runtime: 'Next.js', invoke: invokeNext },
  { runtime: 'TanStack adapter', invoke: invokeTanstack },
])('$runtime deployment metadata', ({ invoke }) => {
  it.each([
    ['2026-09-29T19:28:49Z', '2026-09-29T19:28:49.000Z'],
    ['2026-09-29T15:28:49-04:00', '2026-09-29T19:28:49.000Z'],
  ])('normalizes committer date %s and caches public metadata', async (date, commitTime) => {
    fetchMock.mockResolvedValue(
      Response.json({
        committer: { date, name: 'Example Committer' },
        author: { date: '2020-01-01T00:00:00Z' },
        sha: SHA,
      })
    )

    expect(await invoke()).toEqual({
      status: 200,
      body: { commitSha: SHA, commitTime },
      cacheControl: 'public, max-age=0, s-maxage=600',
    })
    expect(fetchMock).toHaveBeenCalledExactlyOnceWith(COMMIT_URL, {
      headers: {
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2026-03-10',
        'User-Agent': 'Supabase-Studio',
      },
    })
  })

  it.each([undefined, '', 'development'])('skips GitHub when the build SHA is %s', async (sha) => {
    vi.stubEnv('VERCEL_GIT_COMMIT_SHA', sha)

    expect(await invoke()).toEqual({
      status: 200,
      body: { commitSha: 'development', commitTime: 'unknown' },
      cacheControl: 'private, no-store',
    })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it.each([
    ['missing committer', {}],
    ['null payload', null],
    ['null committer', { committer: null }],
    ['missing date', { committer: {} }],
    ['null date', { committer: { date: null } }],
    ['numeric date', { committer: { date: 0 } }],
    ['empty date', { committer: { date: '' } }],
    ['invalid date', { committer: { date: 'not-a-date' } }],
    ['impossible date', { committer: { date: '2026-02-30T00:00:00Z' } }],
    ['author date only', { author: { date: '2026-09-29T19:28:49Z' } }],
    [
      'website payload',
      { payload: { commitRoute: { commit: { committedDate: '2026-09-29T19:28:49Z' } } } },
    ],
  ])('keeps %s private with the existing unknown fallback', async (_name, data) => {
    fetchMock.mockResolvedValue(Response.json(data))

    expect(await invoke()).toEqual({
      status: 200,
      body: { commitSha: SHA, commitTime: 'unknown' },
      cacheControl: 'private, no-store',
    })
  })

  it.each([403, 404, 429, 500])('does not cache GitHub HTTP %s failures', async (status) => {
    fetchMock.mockResolvedValue(new Response('Upstream failure', { status }))

    expect(await invoke()).toEqual({
      status: 200,
      body: { commitSha: SHA, commitTime: 'unknown' },
      cacheControl: 'private, no-store',
    })
  })

  it('does not cache invalid JSON', async () => {
    fetchMock.mockResolvedValue(new Response('{invalid json'))

    expect(await invoke()).toEqual({
      status: 200,
      body: { commitSha: SHA, commitTime: 'unknown' },
      cacheControl: 'private, no-store',
    })
  })

  it('allows recovery after a network failure', async () => {
    fetchMock.mockRejectedValueOnce(new Error('Connection failed'))
    fetchMock.mockResolvedValueOnce(Response.json({ committer: { date: '2026-09-29T19:28:49Z' } }))

    expect(await invoke()).toEqual({
      status: 200,
      body: { commitSha: SHA, commitTime: 'unknown' },
      cacheControl: 'private, no-store',
    })
    expect(await invoke()).toEqual({
      status: 200,
      body: { commitSha: SHA, commitTime: '2026-09-29T19:28:49.000Z' },
      cacheControl: 'public, max-age=0, s-maxage=600',
    })
  })
})
