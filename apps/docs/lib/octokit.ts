import 'server-only'

import { createAppAuth } from '@octokit/auth-app'
import { Octokit } from '@octokit/core'
import { retry } from '@octokit/plugin-retry'
import crypto from 'node:crypto'

import { fetchRevalidatePerDay } from '~/features/helpers.fetch'

const RetryOctokit = Octokit.plugin(retry)

export const OCTOKIT_RETRY_OPTIONS = {
  retries: 5,
  retryAfter: 1,
} as const

let octokitInstance: InstanceType<typeof RetryOctokit>

export function octokit() {
  if (!octokitInstance) {
    const privateKey = process.env.DOCS_GITHUB_APP_PRIVATE_KEY
    if (!privateKey) {
      throw new Error('DOCS_GITHUB_APP_PRIVATE_KEY environment variable is required')
    }

    // https://github.com/gr2m/universal-github-app-jwt?tab=readme-ov-file#converting-pkcs1-to-pkcs8
    const privateKeyPkcs8 = crypto.createPrivateKey(privateKey).export({
      type: 'pkcs8',
      format: 'pem',
    })

    octokitInstance = new RetryOctokit({
      authStrategy: createAppAuth,
      auth: {
        appId: process.env.DOCS_GITHUB_APP_ID,
        installationId: process.env.DOCS_GITHUB_APP_INSTALLATION_ID,
        privateKey: privateKeyPkcs8,
      },
    })
  }

  return octokitInstance
}

type GithubFileRequest = {
  org: string
  repo: string
  path: string
  branch: string
  options?: {
    onError?: (err?: unknown) => void
    /**
     *
     * A custom fetch implementation to control Next.js caching.
     * By default, uses a "once-per-day" revalidation strategy.
     * This default may change later as we move to on-demand revalidation.
     */
    fetch?: (info: RequestInfo, init?: RequestInit) => Promise<Response>
  }
}

export async function getGitHubFileContents({
  org,
  repo,
  path,
  branch,
  options: { onError, fetch } = {},
}: GithubFileRequest) {
  if (path.startsWith('/')) {
    path = path.slice(1)
  }

  const client = octokit()
  let response: Awaited<
    ReturnType<typeof client.request<'GET /repos/{owner}/{repo}/contents/{path}'>>
  >
  try {
    response = await client.request('GET /repos/{owner}/{repo}/contents/{path}', {
      owner: org,
      repo: repo,
      path: path,
      ref: branch,
      request: OCTOKIT_RETRY_OPTIONS,
      options: {
        fetch: fetch ?? fetchRevalidatePerDay,
      },
    })
  } catch (err) {
    const error = new Error(
      `getGitHubFileContents: request failed for ${org}/${repo}/${path}@${branch}`,
      { cause: err }
    )
    onError?.(error)
    throw error
  }

  if (Array.isArray(response.data)) {
    const error = new Error(
      `getGitHubFileContents: ${path} in ${org}/${repo} is a directory, not a file`
    )
    onError?.(error)
    throw error
  }
  if (!('content' in response.data) || response.data.type !== 'file') {
    const error = new Error(
      `getGitHubFileContents: unexpected response for ${path} in ${org}/${repo} (type: ${'type' in response.data ? response.data.type : 'unknown'})`
    )
    onError?.(error)
    throw error
  }

  return Buffer.from(response.data.content, 'base64').toString('utf-8')
}

export async function getGitHubFileContentsImmutableOnly({
  org,
  repo,
  branch,
  path,
  options: { onError, fetch } = {},
}: GithubFileRequest): Promise<string> {
  const isImmutableCommit = await checkForImmutableCommit({
    org,
    repo,
    branch,
  })
  if (!isImmutableCommit) {
    throw Error('The commit is not an immutable commit SHA. Tags and branch names are not allowed.')
  }

  const result = await getGitHubFileContents({
    org,
    repo,
    branch,
    path,
    options: { onError, fetch },
  })
  return result || ''
}

async function checkForImmutableCommit({
  org,
  repo,
  branch,
  options: { fetch: _fetch = fetch } = {},
}: {
  org: string
  repo: string
  branch: string
  options?: {
    /**
     *
     * A custom fetch implementation to control Next.js caching.
     */
    fetch?: (info: RequestInfo, init?: RequestInit) => Promise<Response>
  }
}) {
  try {
    const response = await octokit().request('GET /repos/{owner}/{repo}/git/commits/{commit_sha}', {
      owner: org,
      repo: repo,
      commit_sha: branch,
      headers: {
        'X-GitHub-Api-Version': '2022-11-28',
      },
      request: OCTOKIT_RETRY_OPTIONS,
      options: {
        fetch: _fetch,
      },
    })
    if (response.status === 200) {
      return true
    } else {
      throw Error(
        "Checking for an immutable commit didn't throw an error, but it also didn't return a 200. Erring on the side of safety, assuming this is not an immutable commit.",
        { cause: response }
      )
    }
  } catch (err) {
    console.error('Not an immutable commit: %o', err)
    return false
  }
}
