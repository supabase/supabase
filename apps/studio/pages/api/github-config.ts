import type { NextApiRequest, NextApiResponse } from 'next'

import { apiWrapper } from '@/lib/api/apiWrapper'
import { fetchGitHubConfig, GitHubConfigError } from '@/lib/github-config'
import type { GitHubConfigErrorResponse, GitHubConfigResponse } from '@/lib/github-config.types'

type ResponseData = GitHubConfigResponse | GitHubConfigErrorResponse

export default function githubConfigHandler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  return apiWrapper(req, res, handleRequest, { withAuth: true })
}

async function handleRequest(req: NextApiRequest, res: NextApiResponse<ResponseData>) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
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

  const branch = getSingleQueryValue(req.query.branch)
  const configuredPath = process.env.STUDIO_GITHUB_CONFIG_PATH?.trim()

  try {
    const data = await fetchGitHubConfig({
      repository,
      branch,
      token: process.env.STUDIO_GITHUB_TOKEN,
      configPaths: configuredPath ? [configuredPath] : undefined,
    })

    res.setHeader('Cache-Control', 'private, max-age=30')
    return res.status(200).json(data)
  } catch (error) {
    if (error instanceof GitHubConfigError) {
      return res.status(getStatusCode(error)).json({
        error: { code: error.code, message: error.message },
      })
    }
    throw error
  }
}

function getSingleQueryValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

function getStatusCode(error: GitHubConfigError): number {
  if (error.code === 'CONFIG_NOT_FOUND') return 404
  if (error.code === 'INVALID_CONFIG' || error.code === 'INVALID_REPOSITORY') return 422
  return 502
}
