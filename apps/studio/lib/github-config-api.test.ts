import type { NextApiRequest, NextApiResponse } from 'next'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type {
  GitHubConfigPullRequestResponse,
  GitHubConfigResponse,
} from '@/lib/github-config.types'
import githubConfigHandler from '@/pages/api/github-config'

const { createPullRequestMock, fetchGitHubConfigMock } = vi.hoisted(() => ({
  createPullRequestMock: vi.fn(),
  fetchGitHubConfigMock: vi.fn(),
}))

vi.mock('@/lib/api/apiWrapper', () => ({
  apiWrapper: (
    req: NextApiRequest,
    res: NextApiResponse,
    handler: (req: NextApiRequest, res: NextApiResponse) => unknown
  ) => handler(req, res),
}))

vi.mock('@/lib/github-config', async () => {
  const actual = await vi.importActual<typeof import('@/lib/github-config')>('@/lib/github-config')
  return { ...actual, fetchGitHubConfig: fetchGitHubConfigMock }
})

vi.mock('@/lib/github-config-pull-request', async () => {
  const actual = await vi.importActual<typeof import('@/lib/github-config-pull-request')>(
    '@/lib/github-config-pull-request'
  )
  return { ...actual, createGitHubConfigPullRequest: createPullRequestMock }
})

const githubConfigResponse: GitHubConfigResponse = {
  source: {
    repository: 'example/project',
    branch: 'feat/config',
    path: 'supabase/config.toml',
    format: 'toml',
    sha: 'abc123',
    htmlUrl: 'https://github.com/example/project/blob/feat/config/supabase/config.toml',
  },
  config: { api: { max_rows: 1000 } },
  managedPaths: ['api.max_rows'],
}

function createResponse() {
  const json = vi.fn()
  const response = {
    setHeader: vi.fn(),
    status: vi.fn(() => response),
    json,
  }

  return { response: response as unknown as NextApiResponse, json }
}

describe('/api/github-config', () => {
  afterEach(() => {
    vi.clearAllMocks()
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it('uses only the server GitHub fetcher when the client integration mock is enabled', async () => {
    const token = 'server-only-test-token'
    vi.stubEnv('STUDIO_GITHUB_REPOSITORY', 'example/project')
    vi.stubEnv('STUDIO_GITHUB_TOKEN', token)
    vi.stubEnv('NEXT_PUBLIC_STUDIO_GITHUB_APP_MOCK', 'true')
    fetchGitHubConfigMock.mockResolvedValue(githubConfigResponse)

    const request = {
      method: 'GET',
      query: { branch: 'feat/config' },
    } as unknown as NextApiRequest
    const { response, json } = createResponse()

    await githubConfigHandler(request, response)

    expect(fetchGitHubConfigMock).toHaveBeenCalledWith({
      repository: 'example/project',
      branch: 'feat/config',
      token,
      includeOriginalContent: true,
    })
    expect(json).toHaveBeenCalledWith(githubConfigResponse)
    expect(JSON.stringify(json.mock.calls[0][0])).not.toContain(token)
  })

  it('re-reads the live value and creates a PR without accepting client-supplied config values', async () => {
    const token = 'server-only-test-token'
    const pullRequest: GitHubConfigPullRequestResponse = {
      pullRequestUrl: 'https://github.com/example/project/pull/42',
      pullRequestNumber: 42,
      pullRequestTitle: 'Accept remote configuration',
      branch: 'studio/config-drift-test',
      commitSha: 'commit-sha',
      affectedPaths: ['auth.additional_redirect_urls'],
    }
    vi.stubEnv('STUDIO_GITHUB_REPOSITORY', 'example/project')
    vi.stubEnv('STUDIO_GITHUB_TOKEN', token)
    fetchGitHubConfigMock.mockResolvedValue({
      ...githubConfigResponse,
      config: {
        auth: { additional_redirect_urls: ['https://config.example.com/callback'] },
      },
      managedPaths: ['auth.additional_redirect_urls'],
    })
    createPullRequestMock.mockResolvedValue(pullRequest)
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ URI_ALLOW_LIST: 'https://live.example.com/callback' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      )
    )

    const request = {
      method: 'POST',
      headers: { authorization: 'Bearer studio-user-token' },
      query: {},
      body: {
        action: 'accept-remote-changes',
        projectRef: 'project-ref',
        expectedSourceSha: 'abc123',
        target: 'production',
      },
    } as unknown as NextApiRequest
    const { response, json } = createResponse()

    await githubConfigHandler(request, response)

    expect(fetchGitHubConfigMock).toHaveBeenCalledWith({
      repository: 'example/project',
      branch: undefined,
      token,
      includeOriginalContent: true,
    })
    expect(createPullRequestMock).toHaveBeenCalledWith(
      expect.objectContaining({
        repository: 'example/project',
        token,
        changes: [
          {
            fieldName: 'URI_ALLOW_LIST',
            dashboardValue: 'https://live.example.com/callback',
          },
        ],
        target: 'production',
      })
    )
    expect(json).toHaveBeenCalledWith(pullRequest)
    expect(JSON.stringify(json.mock.calls[0][0])).not.toContain(token)
  })

  it('rejects forged repository, path, or config values in the POST body', async () => {
    vi.stubEnv('STUDIO_GITHUB_REPOSITORY', 'example/project')
    vi.stubEnv('STUDIO_GITHUB_TOKEN', 'server-only-test-token')
    const request = {
      method: 'POST',
      headers: { authorization: 'Bearer studio-user-token' },
      query: {},
      body: {
        action: 'accept-remote-changes',
        projectRef: 'project-ref',
        expectedSourceSha: 'abc123',
        target: 'production',
        repository: 'attacker/repository',
        value: 'https://attacker.example.com',
      },
    } as unknown as NextApiRequest
    const { response, json } = createResponse()

    await githubConfigHandler(request, response)

    expect(response.status).toHaveBeenCalledWith(422)
    expect(json).toHaveBeenCalledWith({
      error: expect.objectContaining({ code: 'INVALID_ACCEPT_REQUEST' }),
    })
    expect(fetchGitHubConfigMock).not.toHaveBeenCalled()
    expect(createPullRequestMock).not.toHaveBeenCalled()
  })
})
