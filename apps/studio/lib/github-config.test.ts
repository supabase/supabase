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
  })

  it('resolves the repository default branch and falls back to config.json', async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse({ default_branch: 'master' }))
      .mockResolvedValueOnce(jsonResponse({ message: 'Not Found' }, 404))
      .mockResolvedValueOnce(
        jsonResponse(encodedFile('supabase/config.json', '{"auth":{"enabled":true}}'))
      )

    const result = await fetchGitHubConfig({ repository: 'example/project', fetcher })

    expect(fetcher).toHaveBeenCalledTimes(3)
    expect(result.source.branch).toBe('master')
    expect(result.source.format).toBe('json')
    expect(result.managedPaths).toEqual(['auth.enabled'])
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
