import 'server-only'

import { createAppAuth } from '@octokit/auth-app'
import { Octokit } from '@octokit/core'
import crypto from 'node:crypto'

import { fetchRevalidatePerDay } from '~/features/helpers.fetch'

let octokitInstance: Octokit

function octokit() {
  if (!octokitInstance) {
    const privateKeyPkcs8 = crypto
      .createPrivateKey(process.env.DOCS_GITHUB_APP_PRIVATE_KEY)
      .export({
        type: 'pkcs8',
        format: 'pem',
      })

    octokitInstance = new Octokit({
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

export async function getGitHubFileContents({
  org,
  repo,
  path,
  branch,
  options: { onError },
}: {
  org: string
  repo: string
  path: string
  branch: string
  options: {
    onError: (err?: unknown) => void
    /**
     *
     * A custom fetch implementation to control Next.js caching.
     * By default, uses a "once-per-day" revalidation strategy.
     * This default may change later as we move to on-demand revalidation.
     */
    fetch?: (info: RequestInfo, init?: RequestInit) => Promise<Response>
  }
}) {
  if (path.startsWith('/')) {
    path = path.slice(1)
  }

  try {
    const response = await octokit().request('GET /repos/{owner}/{repo}/contents/{path}', {
      owner: org,
      repo: repo,
      path: path,
      ref: branch,
      options: {
        fetch: fetchRevalidatePerDay,
      },
    })
    if (response.status !== 200 || !response.data) {
      throw Error(`Could not find contents of ${path} in ${org}/${repo}`)
    }
    if (!('type' in response.data) || response.data.type !== 'file') {
      throw Error(`${path} in ${org}/${repo} is not a file`)
    }
    const content = Buffer.from(response.data.content, 'base64').toString('utf-8')
    return content
  } catch (err) {
    console.error('Error fetching GitHub file: %o', err)
    onError?.(err)
  }
}
