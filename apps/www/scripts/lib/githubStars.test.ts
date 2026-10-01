import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { getGitHubStars } from './githubStars.mjs'

const { request, readFile, Octokit } = vi.hoisted(() => ({
  request: vi.fn(),
  readFile: vi.fn(),
  Octokit: vi.fn(),
}))

vi.mock('@octokit/core', () => ({ Octokit }))
vi.mock('node:fs/promises', () => ({ readFile }))

const cachePath = '/staticContent/_index.json'

describe('getGitHubStars', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.stubEnv('GITHUB_TOKEN', '')
    Octokit.mockImplementation(function () {
      return { request }
    })
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    readFile.mockRejectedValue(new Error('ENOENT'))
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
  })

  it('uses the live count and authenticates when a token is available', async () => {
    vi.stubEnv('GITHUB_TOKEN', 'test-token')
    request.mockResolvedValue({ data: { stargazers_count: 110565 } })

    expect(await getGitHubStars(cachePath)).toBe(110565)
    expect(Octokit).toHaveBeenCalledWith({ auth: 'test-token' })
    expect(readFile).not.toHaveBeenCalled()
  })

  it('can fetch public stars without a token', async () => {
    request.mockResolvedValue({ data: { stargazers_count: 110565 } })

    expect(await getGitHubStars(cachePath)).toBe(110565)
    expect(Octokit).toHaveBeenCalledWith({})
  })

  it('keeps the previous count when GitHub rate limits the build', async () => {
    request.mockRejectedValue(Object.assign(new Error('API rate limit exceeded'), { status: 403 }))
    readFile.mockResolvedValue(JSON.stringify({ githubStars: 109037 }))

    expect(await getGitHubStars(cachePath)).toBe(109037)
    expect(readFile).toHaveBeenCalledWith(cachePath, 'utf8')
  })

  it.each([undefined, null, 0, -1, '110565', NaN, Infinity, 1.5])(
    'falls back to the previous count for invalid API data: %s',
    async (stargazers_count) => {
      request.mockResolvedValue({ data: { stargazers_count } })
      readFile.mockResolvedValue(JSON.stringify({ githubStars: 109037 }))

      expect(await getGitHubStars(cachePath)).toBe(109037)
    }
  )

  it('returns unknown when the request fails on a clean build', async () => {
    request.mockRejectedValue(new Error('Network error'))

    expect(await getGitHubStars(cachePath)).toBeNull()
  })

  it.each(['invalid json', '{}', '{"githubStars":0}', '{"githubStars":null}'])(
    'does not reuse invalid cached content: %s',
    async (content) => {
      request.mockRejectedValue(new Error('Network error'))
      readFile.mockResolvedValue(content)

      expect(await getGitHubStars(cachePath)).toBeNull()
    }
  )
})
