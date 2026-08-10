import { Buffer } from 'node:buffer'
import { parse as parseToml } from 'smol-toml'
import { describe, expect, it, vi } from 'vitest'

import {
  applyConfigValueToTarget,
  createGitHubConfigPullRequest,
} from './github-config-pull-request'
import type { GitHubConfigResponse } from './github-config.types'

const response = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

const source: GitHubConfigResponse = {
  source: {
    repository: 'example/project',
    branch: 'feat/source-branch',
    path: 'supabase/config.toml',
    format: 'toml',
    sha: 'file-sha',
    htmlUrl: 'https://github.com/example/project/blob/feat/source-branch/supabase/config.toml',
  },
  config: {
    auth: {
      additional_redirect_urls: ['https://config.example.com/callback'],
    },
  },
  managedPaths: ['auth.additional_redirect_urls'],
}

describe('GitHub configuration pull requests', () => {
  it('creates one branch, commit, and PR for every live value', async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(response({ object: { sha: 'branch-head-sha' } }))
      .mockResolvedValueOnce(response({}, 201))
      .mockResolvedValueOnce(response({ commit: { sha: 'commit-sha' } }))
      .mockResolvedValueOnce(
        response({ html_url: 'https://github.com/example/project/pull/42', number: 42 }, 201)
      )

    const result = await createGitHubConfigPullRequest({
      repository: 'example/project',
      token: 'server-only-token',
      source,
      changes: [
        {
          fieldName: 'URI_ALLOW_LIST',
          dashboardValue: 'https://live.example.com/callback, https://second.example.com/callback',
        },
        { fieldName: 'SITE_URL', dashboardValue: 'https://live.example.com' },
      ],
      target: 'production',
      branchName: 'studio/config-drift-redirect-urls-test',
      fetcher,
    })

    expect(result).toEqual({
      pullRequestUrl: 'https://github.com/example/project/pull/42',
      pullRequestNumber: 42,
      pullRequestTitle: 'Accept remote configuration',
      branch: 'studio/config-drift-redirect-urls-test',
      commitSha: 'commit-sha',
      affectedPaths: ['auth.additional_redirect_urls', 'auth.site_url'],
    })
    expect(String(fetcher.mock.calls[0][0])).toContain('/git/ref/heads/feat/source-branch')

    const updateBody = JSON.parse(String(fetcher.mock.calls[2][1]?.body)) as {
      content: string
      sha: string
      branch: string
    }
    const committedContent = Buffer.from(updateBody.content, 'base64').toString('utf8')
    const committedConfig = parseToml(committedContent)
    expect(committedContent).toContain(
      'additional_redirect_urls = ["https://config.example.com/callback"]'
    )
    expect(committedContent).toContain('[env.production]\n\n  [env.production.auth]')
    expect(committedContent).not.toContain('[ "')
    expect(committedConfig).toMatchObject({
      auth: {
        additional_redirect_urls: ['https://config.example.com/callback'],
      },
      env: {
        production: {
          auth: {
            additional_redirect_urls: [
              'https://live.example.com/callback',
              'https://second.example.com/callback',
            ],
            site_url: 'https://live.example.com',
          },
        },
      },
    })
    expect(updateBody).toMatchObject({
      sha: 'file-sha',
      branch: 'studio/config-drift-redirect-urls-test',
    })

    const pullRequestBody = JSON.parse(String(fetcher.mock.calls[3][1]?.body)) as {
      head: string
      base: string
    }
    expect(pullRequestBody).toMatchObject({
      head: 'studio/config-drift-redirect-urls-test',
      base: 'feat/source-branch',
    })
    expect(JSON.stringify(result)).not.toContain('server-only-token')
  })

  it('writes preview values under the exact branch key without splitting slashes or dots', () => {
    const updated = applyConfigValueToTarget({
      config: source.config,
      configPath: 'auth.site_url',
      value: 'https://live-preview.example.com',
      target: 'preview',
      gitBranch: 'feat/google-auth.v2',
    })

    expect(updated).toMatchObject({
      env: {
        preview: {
          branches: {
            'feat/google-auth.v2': {
              auth: { site_url: 'https://live-preview.example.com' },
            },
          },
        },
      },
    })
    expect((updated.env as Record<string, unknown>).feat).toBeUndefined()
  })

  it('serializes a preview PR with the same stable TOML layout as the CLI', async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(response({ object: { sha: 'branch-head-sha' } }))
      .mockResolvedValueOnce(response({}, 201))
      .mockResolvedValueOnce(response({ commit: { sha: 'commit-sha' } }))
      .mockResolvedValueOnce(
        response({ html_url: 'https://github.com/example/project/pull/43', number: 43 }, 201)
      )
    const original = [
      'project_id = "ndfbhjzkqovpyfpxygwq"',
      '',
      '[api]',
      'schemas = ["public", "graphql_public"]',
      'extra_search_path = ["public", "extensions"]',
      '',
      '[auth]',
      'additional_redirect_urls = ["https://toml-test.example/auth/callback"]',
      '',
      '[env.development]',
      '',
      '  [env.development.auth]',
      '  site_url = "http://localhost:3000"',
      '',
      '[env.preview]',
      '',
      '  [env.preview.auth]',
      '  site_url = "https://preview.toml-test.example"',
      '',
      '  [env.preview.branches."feat/google-auth".auth]',
      '  additional_redirect_urls = ["https://google-auth.preview.toml-test.example/auth/callback"]',
      '',
    ].join('\n')
    const realisticSource: GitHubConfigResponse = {
      ...source,
      source: { ...source.source, branch: 'jsm/test-1' },
      config: parseToml(original),
      originalContent: original,
    }

    await createGitHubConfigPullRequest({
      repository: 'example/project',
      token: 'server-only-token',
      source: realisticSource,
      changes: [
        {
          fieldName: 'URI_ALLOW_LIST',
          dashboardValue: ['https://vercel.app/something', 'https://bbc.com'],
        },
      ],
      target: 'preview',
      gitBranch: 'jsm/test-1',
      branchName: 'studio/config-drift-preview-test',
      fetcher,
    })

    const updateBody = JSON.parse(String(fetcher.mock.calls[2][1]?.body)) as { content: string }
    const committed = Buffer.from(updateBody.content, 'base64').toString('utf8')
    const expectedAddition = [
      '',
      '',
      '  [env.preview.branches."jsm/test-1".auth]',
      '  additional_redirect_urls = ["https://vercel.app/something", "https://bbc.com"]',
      '',
    ].join('\n')

    expect(committed).toBe(`${original.trimEnd()}${expectedAddition}`)
  })

  it('changes only the intended branch override in an indented, commented TOML file', async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(response({ object: { sha: 'branch-head-sha' } }))
      .mockResolvedValueOnce(response({}, 201))
      .mockResolvedValueOnce(response({ commit: { sha: 'commit-sha' } }))
      .mockResolvedValueOnce(
        response({ html_url: 'https://github.com/example/project/pull/44', number: 44 }, 201)
      )
    const original = [
      '[auth]',
      'enable_signup = false',
      'enable_anonymous_sign_ins = false',
      '',
      '  [auth.email]',
      '  enable_signup  =  true # preserve this spacing',
      '',
      '[env.preview]',
      '',
      '  [env.preview.auth]',
      '  site_url = "https://preview.toml-test.example"',
      '  additional_redirect_urls = ["https://vercel.app/something"]',
      '',
      '  ## [env.preview.branches."jsm/test-1".auth]',
      '  ## site_url = "https://test-1.preview.toml-test.example"',
      '  ## additional_redirect_urls = ["https://old.example/auth/callback"]',
      '',
    ].join('\n')

    await createGitHubConfigPullRequest({
      repository: 'example/project',
      token: 'server-only-token',
      source: {
        ...source,
        source: { ...source.source, branch: 'jsm/test-1' },
        config: parseToml(original),
        originalContent: original,
      },
      changes: [
        {
          fieldName: 'URI_ALLOW_LIST',
          dashboardValue: ['https://vercel.app/something', 'https://bbc.com'],
        },
        { fieldName: 'SITE_URL', dashboardValue: 'https://preview.toml-test.exampleeer' },
      ],
      target: 'preview',
      gitBranch: 'jsm/test-1',
      branchName: 'studio/config-drift-surgical-preview-test',
      fetcher,
    })

    const updateBody = JSON.parse(String(fetcher.mock.calls[2][1]?.body)) as { content: string }
    const committed = Buffer.from(updateBody.content, 'base64').toString('utf8')
    const addition = [
      '  [env.preview.branches."jsm/test-1".auth]',
      '  additional_redirect_urls = ["https://vercel.app/something", "https://bbc.com"]',
      '  site_url = "https://preview.toml-test.exampleeer"',
      '',
    ].join('\n')

    expect(committed).toBe(`${original}\n${addition}`)
    expect(committed).toContain('  [auth.email]\n  enable_signup  =  true # preserve this spacing')
    expect(committed).toContain('  additional_redirect_urls = ["https://vercel.app/something"]')
    expect(committed).toContain('  ## [env.preview.branches."jsm/test-1".auth]')
    expect(parseToml(committed)).toMatchObject({
      env: {
        preview: {
          branches: {
            'jsm/test-1': {
              auth: {
                additional_redirect_urls: ['https://vercel.app/something', 'https://bbc.com'],
                site_url: 'https://preview.toml-test.exampleeer',
              },
            },
          },
        },
      },
    })
  })

  it('writes production values to env.production without changing the shared base', () => {
    const config = {
      auth: {
        site_url: 'https://base.example.com',
        email: { enable_signup: true },
      },
      env: {
        preview: { auth: { site_url: 'https://preview.example.com' } },
      },
    }

    const updated = applyConfigValueToTarget({
      config,
      configPath: 'auth.site_url',
      value: 'https://live-production.example.com',
      target: 'production',
    })

    expect(updated).toEqual({
      auth: {
        site_url: 'https://base.example.com',
        email: { enable_signup: true },
      },
      env: {
        production: { auth: { site_url: 'https://live-production.example.com' } },
        preview: { auth: { site_url: 'https://preview.example.com' } },
      },
    })
  })

  it('writes development values to env.development without changing the shared base', () => {
    const config = { auth: { site_url: 'https://base.example.com' } }

    const updated = applyConfigValueToTarget({
      config,
      configPath: 'auth.site_url',
      value: 'http://localhost:54323',
      target: 'development',
    })

    expect(updated).toEqual({
      auth: { site_url: 'https://base.example.com' },
      env: {
        development: { auth: { site_url: 'http://localhost:54323' } },
      },
    })
  })

  it('rejects secret fields before making a GitHub request', async () => {
    const fetcher = vi.fn<typeof fetch>()

    await expect(
      createGitHubConfigPullRequest({
        repository: 'example/project',
        token: 'server-only-token',
        source,
        changes: [{ fieldName: 'EXTERNAL_GITHUB_SECRET', dashboardValue: 'secret' }],
        target: 'production',
        branchName: 'studio/config-drift-secret-test',
        fetcher,
      })
    ).rejects.toMatchObject({ code: 'INVALID_ACCEPT_REQUEST' })
    expect(fetcher).not.toHaveBeenCalled()
  })
})
