import { constructHeaders, fetchHandler } from '@/data/fetchers'
import { API_URL } from '@/lib/constants'

export type GitHubRepoArchive = {
  url: string
  expires_at: string
  ref: string
  sha: string
  workdir: string
  repository: { owner: string; name: string; default_branch: string }
}

export type GitHubPullRequest = {
  url: string
  number: number
  branch: string
  sha: string
}

async function post<T>({
  path,
  body,
  authorization,
  signal,
}: {
  path: string
  body: unknown
  authorization: string
  signal?: AbortSignal
}): Promise<T> {
  const baseUrl = API_URL.replace(/\/(platform|v1)\/?$/, '')
  const headers = await constructHeaders({
    'Content-Type': 'application/json',
    Authorization: authorization,
  })
  const response = await fetchHandler(`${baseUrl}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    signal,
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(error || `Platform request failed (${response.status})`)
  }

  return response.json() as Promise<T>
}

export function createGitHubRepoArchive({
  connectionId,
  ref,
  authorization,
  signal,
}: {
  connectionId: number
  ref?: string
  authorization: string
  signal?: AbortSignal
}) {
  return post<GitHubRepoArchive>({
    path: `/platform/integrations/github/connections/${connectionId}/archive`,
    body: { ref },
    authorization,
    signal,
  })
}

export function createGitHubPullRequest({
  connectionId,
  baseRef,
  headBranch,
  title,
  body,
  patch,
  authorization,
  signal,
}: {
  connectionId: number
  baseRef: string
  headBranch: string
  title: string
  body?: string
  patch: string
  authorization: string
  signal?: AbortSignal
}) {
  return post<GitHubPullRequest>({
    path: `/platform/integrations/github/connections/${connectionId}/pull-requests`,
    body: { base_ref: baseRef, head_branch: headBranch, title, body, patch },
    authorization,
    signal,
  })
}
