import { Buffer } from 'node:buffer'
import { describe, expect, it, vi } from 'vitest'

import {
  fetchGitHubConfig,
  GitHubConfigError,
  listManagedConfigPaths,
  parseConfig,
} from './github-config'

const encodedFile = (path: string, content: string) => ({
  type: 'file',
  path,
  sha: 'abc123',
  html_url: `https://github.com/example/project/blob/main/${path}`,
  encoding: 'base64',
  content: Buffer.from(content).toString('base64'),
})

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

describe('GitHub config', () => {
  it('parses TOML and exposes every managed leaf path', () => {
    const config = parseConfig(
      'project_id = "demo"\n[auth]\nenabled = true\n[auth.external.github]\nclient_id = "id"\n',
      'toml'
    )

    expect(config).toEqual({
      project_id: 'demo',
      auth: { enabled: true, external: { github: { client_id: 'id' } } },
    })
    expect(listManagedConfigPaths(config)).toEqual([
      'auth.enabled',
      'auth.external.github.client_id',
      'project_id',
    ])
  })

  it('fetches the requested branch directly from GitHub', async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(
        jsonResponse(encodedFile('supabase/config.toml', '[api]\nmax_rows = 1000\n'))
      )

    const result = await fetchGitHubConfig({
      repository: 'example/project',
      branch: 'feat/config',
      fetcher,
    })

    expect(fetcher).toHaveBeenCalledTimes(1)
    expect(new URL(String(fetcher.mock.calls[0][0])).searchParams.get('ref')).toBe('feat/config')
    expect(result.source).toMatchObject({
      repository: 'example/project',
      branch: 'feat/config',
      path: 'supabase/config.toml',
      format: 'toml',
    })
    expect(result.config).toEqual({ api: { max_rows: 1000 } })
    expect(result).not.toHaveProperty('originalContent')
  })

  it('retains the original bytes only when requested for a server-side write', async () => {
    const content = '  [auth.email]\n  enable_signup  =  true # keep me\n'
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(jsonResponse(encodedFile('supabase/config.toml', content)))

    const result = await fetchGitHubConfig({
      repository: 'example/project',
      branch: 'feat/config',
      includeOriginalContent: true,
      fetcher,
    })

    expect(result.originalContent).toBe(content)
  })

  it('keeps the GitHub token in request headers and out of the response', async () => {
    const token = 'server-only-test-token'
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(
        jsonResponse(encodedFile('supabase/config.toml', '[api]\nmax_rows = 1000\n'))
      )

    const result = await fetchGitHubConfig({
      repository: 'example/project',
      branch: 'feat/config',
      token,
      fetcher,
    })

    const [requestUrl, requestInit] = fetcher.mock.calls[0]
    expect(String(requestUrl)).toMatch(/^https:\/\/api\.github\.com\//)
    expect(new Headers(requestInit?.headers).get('Authorization')).toBe(`Bearer ${token}`)
    expect(JSON.stringify(result)).not.toContain(token)
  })

  it('resolves the repository default branch when no branch is requested', async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse({ default_branch: 'main' }))
      .mockResolvedValueOnce(
        jsonResponse(encodedFile('supabase/config.toml', '[api]\nmax_rows = 1000\n'))
      )

    const result = await fetchGitHubConfig({ repository: 'example/project', fetcher })

    expect(fetcher).toHaveBeenCalledTimes(2)
    expect(result.source.branch).toBe('main')
    expect(new URL(String(fetcher.mock.calls[1][0])).searchParams.get('ref')).toBe('main')
  })

  it('falls back to the repository default branch when config is absent on the requested branch', async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse({ message: 'Not Found' }, 404))
      .mockResolvedValueOnce(jsonResponse({ message: 'Not Found' }, 404))
      .mockResolvedValueOnce(jsonResponse({ default_branch: 'master' }))
      .mockResolvedValueOnce(jsonResponse({ message: 'Not Found' }, 404))
      .mockResolvedValueOnce(
        jsonResponse(encodedFile('supabase/config.json', '{"auth":{"enabled":true}}'))
      )

    const result = await fetchGitHubConfig({
      repository: 'example/project',
      branch: 'feat/config',
      fetcher,
    })

    expect(fetcher).toHaveBeenCalledTimes(5)
    expect(fetcher.mock.calls.map(([url]) => new URL(String(url)).searchParams.get('ref'))).toEqual(
      ['feat/config', 'feat/config', null, 'master', 'master']
    )
    expect(result.source).toMatchObject({
      branch: 'master',
      path: 'supabase/config.json',
      format: 'json',
    })
    expect(result.managedPaths).toEqual(['auth.enabled'])
  })

  it('falls back from TOML to JSON on the requested branch before using the default branch', async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse({ message: 'Not Found' }, 404))
      .mockResolvedValueOnce(
        jsonResponse(encodedFile('supabase/config.json', '{"auth":{"enabled":true}}'))
      )

    const result = await fetchGitHubConfig({
      repository: 'example/project',
      branch: 'feat/config',
      fetcher,
    })

    expect(fetcher).toHaveBeenCalledTimes(2)
    expect(result.source).toMatchObject({
      branch: 'feat/config',
      path: 'supabase/config.json',
      format: 'json',
    })
  })

  it('does not mask non-404 config errors with a default-branch fallback', async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse({ message: 'Not Found' }, 404))
      .mockResolvedValueOnce(jsonResponse({ message: 'rate limit exceeded' }, 403))

    await expect(
      fetchGitHubConfig({ repository: 'example/project', branch: 'feat/config', fetcher })
    ).rejects.toMatchObject({
      code: 'CONFIG_UNAVAILABLE',
      upstreamStatus: 403,
    } satisfies Partial<GitHubConfigError>)
    expect(fetcher).toHaveBeenCalledTimes(2)
  })

  it('does not mask non-404 errors while resolving the default branch', async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse({ message: 'service unavailable' }, 503))

    await expect(
      fetchGitHubConfig({ repository: 'example/project', fetcher })
    ).rejects.toMatchObject({
      code: 'REPOSITORY_UNAVAILABLE',
      upstreamStatus: 503,
    } satisfies Partial<GitHubConfigError>)
    expect(fetcher).toHaveBeenCalledTimes(1)
  })

  it('returns a typed error when GitHub config is invalid', async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(jsonResponse(encodedFile('supabase/config.toml', '[auth\n')))

    await expect(
      fetchGitHubConfig({ repository: 'example/project', branch: 'main', fetcher })
    ).rejects.toMatchObject({ code: 'INVALID_CONFIG' } satisfies Partial<GitHubConfigError>)
  })
})
