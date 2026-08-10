import type { NextApiRequest, NextApiResponse } from 'next'

import { apiWrapper } from '@/lib/api/apiWrapper'
import { API_URL } from '@/lib/constants'
import { fetchGitHubConfig, GitHubConfigError } from '@/lib/github-config'
import { getAuthConfigDriftSummary } from '@/lib/github-config-drift'
import { resolveEffectiveGitHubConfig } from '@/lib/github-config-effective'
import {
  createGitHubConfigPullRequest,
  GitHubConfigPullRequestError,
} from '@/lib/github-config-pull-request'
import type {
  GitHubConfigErrorResponse,
  GitHubConfigPullRequestRequest,
  GitHubConfigPullRequestResponse,
  GitHubConfigResponse,
} from '@/lib/github-config.types'

type ResponseData =
  | GitHubConfigResponse
  | GitHubConfigPullRequestResponse
  | GitHubConfigErrorResponse

export default function githubConfigHandler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  return apiWrapper(req, res, handleRequest, { withAuth: true })
}

async function handleRequest(req: NextApiRequest, res: NextApiResponse<ResponseData>) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', ['GET', 'POST'])
    return res.status(405).json({
      error: { code: 'METHOD_NOT_ALLOWED', message: `Method ${req.method} Not Allowed` },
    })
  }

  const repository = process.env.STUDIO_GITHUB_REPOSITORY
  if (!repository) {
    return res.status(503).json({
      error: {
        code: 'GITHUB_NOT_CONFIGURED',
        message: 'Set STUDIO_GITHUB_REPOSITORY to owner/repository to enable GitHub config.',
      },
    })
  }

  try {
    if (req.method === 'POST') {
      return await handleAcceptRemoteChange(req, res, repository)
    }

    const branch = getSingleQueryValue(req.query.branch)
    const data = await fetchGitHubConfig({
      repository,
      branch,
      token: process.env.STUDIO_GITHUB_TOKEN,
      includeOriginalContent: true,
    })

    res.setHeader('Cache-Control', 'private, max-age=30')
    return res.status(200).json(data)
  } catch (error) {
    if (error instanceof GitHubConfigError) {
      return res.status(getStatusCode(error)).json({
        error: { code: error.code, message: error.message },
      })
    }
    if (error instanceof GitHubConfigPullRequestError) {
      return res.status(getPullRequestStatusCode(error)).json({
        error: { code: error.code, message: error.message },
      })
    }
    throw error
  }
}

async function handleAcceptRemoteChange(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>,
  repository: string
) {
  const request = parsePullRequestRequest(req.body)
  const token = process.env.STUDIO_GITHUB_TOKEN?.trim()
  if (!token) {
    throw new GitHubConfigPullRequestError(
      'GITHUB_WRITE_NOT_CONFIGURED',
      'Set STUDIO_GITHUB_TOKEN to create configuration pull requests.'
    )
  }

  const source = await fetchGitHubConfig({
    repository,
    branch: request.gitBranch,
    token,
    includeOriginalContent: true,
  })
  if (source.source.sha !== request.expectedSourceSha) {
    throw new GitHubConfigPullRequestError(
      'CONFIG_CHANGED',
      'config.toml changed after drift was loaded. Refresh and review the difference again.'
    )
  }

  const dashboardConfig = await fetchRemoteAuthConfig(req, request.projectRef)
  const effectiveConfig = resolveEffectiveGitHubConfig(source.config, {
    target: request.target,
    gitBranch: request.gitBranch,
  })
  const summary = getAuthConfigDriftSummary({
    dashboardConfig,
    githubConfig: effectiveConfig,
  })
  if (summary.driftedFields.length === 0) {
    throw new GitHubConfigPullRequestError(
      'CONFIG_CHANGED',
      'These settings no longer differ. Refresh before resolving configuration drift.'
    )
  }

  const result = await createGitHubConfigPullRequest({
    repository,
    token,
    source,
    changes: summary.driftedFields.map(({ fieldName, dashboardValue }) => ({
      fieldName,
      dashboardValue,
    })),
    target: request.target,
    gitBranch: request.gitBranch,
  })
  return res.status(201).json(result)
}

function parsePullRequestRequest(body: unknown): GitHubConfigPullRequestRequest {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw invalidAcceptRequest()
  }

  const value = body as Record<string, unknown>
  const allowedKeys = new Set(['action', 'projectRef', 'expectedSourceSha', 'target', 'gitBranch'])
  if (Object.keys(value).some((key) => !allowedKeys.has(key))) throw invalidAcceptRequest()

  if (
    value.action !== 'accept-remote-changes' ||
    typeof value.projectRef !== 'string' ||
    !value.projectRef.trim() ||
    typeof value.expectedSourceSha !== 'string' ||
    !value.expectedSourceSha.trim() ||
    (value.target !== 'production' && value.target !== 'preview') ||
    (value.gitBranch !== undefined && typeof value.gitBranch !== 'string') ||
    (value.target === 'preview' && (typeof value.gitBranch !== 'string' || !value.gitBranch.trim()))
  ) {
    throw invalidAcceptRequest()
  }

  return {
    action: 'accept-remote-changes',
    projectRef: value.projectRef.trim(),
    expectedSourceSha: value.expectedSourceSha.trim(),
    target: value.target,
    gitBranch:
      typeof value.gitBranch === 'string' ? value.gitBranch.trim() || undefined : undefined,
  }
}

async function fetchRemoteAuthConfig(req: NextApiRequest, projectRef: string) {
  const authorization = req.headers.authorization
  if (!authorization)
    throw new GitHubConfigPullRequestError('INVALID_ACCEPT_REQUEST', 'Unauthorized.')

  const baseUrl = API_URL.replace(/\/(?:platform|v1)\/?$/, '')
  const response = await fetch(
    `${baseUrl}/platform/auth/${encodeURIComponent(projectRef)}/config`,
    {
      headers: { Accept: 'application/json', Authorization: authorization },
    }
  )
  if (!response.ok) {
    throw new GitHubConfigPullRequestError(
      'INVALID_ACCEPT_REQUEST',
      response.status === 403
        ? 'You do not have permission to read this project Auth configuration.'
        : `Could not read the live Auth configuration (HTTP ${response.status}).`,
      response.status
    )
  }

  const data = (await response.json()) as unknown
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new GitHubConfigPullRequestError(
      'INVALID_ACCEPT_REQUEST',
      'The live Auth configuration response was invalid.'
    )
  }
  return data
}

function invalidAcceptRequest() {
  return new GitHubConfigPullRequestError(
    'INVALID_ACCEPT_REQUEST',
    'The configuration pull request payload is invalid.'
  )
}

function getSingleQueryValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

function getStatusCode(error: GitHubConfigError): number {
  if (error.code === 'CONFIG_NOT_FOUND') return 404
  if (error.code === 'INVALID_CONFIG' || error.code === 'INVALID_REPOSITORY') return 422
  return 502
}

function getPullRequestStatusCode(error: GitHubConfigPullRequestError): number {
  if (error.code === 'GITHUB_WRITE_NOT_CONFIGURED') return 503
  if (error.code === 'CONFIG_CHANGED') return 409
  if (error.code === 'INVALID_ACCEPT_REQUEST') return error.upstreamStatus ?? 422
  return 502
}
