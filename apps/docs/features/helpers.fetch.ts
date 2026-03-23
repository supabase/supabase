/**
 * Next.js extends native `fetch` with revalidation options.
 *
 * This module provides some reusable utility functions to set revalidation
 * options for `fetch`, for example when it needs to be passed to a
 * third-party API.
 */

import { Octokit } from '@octokit/core'

import { ONE_DAY_IN_SECONDS } from './helpers.time'

export const REVALIDATION_TAGS = {
  GRAPHQL: 'graphql',
  PARTNERS: 'partners',
  WRAPPERS: 'wrappers',
} as const
// Casting to avoid problems with using this as a Zod enum, TypeScript does
// not recognize the casted type as a supertype of the original type
export const VALID_REVALIDATION_TAGS = Object.values(REVALIDATION_TAGS) as unknown as readonly [
  string,
  ...string[],
]

function fetchWithNextOptions({
  next,
  cache,
}: {
  next?: NextFetchRequestConfig
  cache?: RequestInit['cache']
}) {
  return (info: RequestInfo) => fetch(info, { next, cache })
}

const fetchRevalidatePerDay = fetchWithNextOptions({
  next: { revalidate: ONE_DAY_IN_SECONDS },
})

async function fetchGitHubFile({
  owner,
  repo,
  path,
  ref,
}: {
  owner: string
  repo: string
  path: string
  ref: string
}): Promise<string> {
  const client = new Octokit({ request: { fetch: fetchRevalidatePerDay } })
  let response: Awaited<
    ReturnType<typeof client.request<'GET /repos/{owner}/{repo}/contents/{path}'>>
  >
  try {
    response = await client.request('GET /repos/{owner}/{repo}/contents/{path}', {
      owner,
      repo,
      path,
      ref,
    })
  } catch (err) {
    throw new Error(`fetchGitHubFile: request failed for ${owner}/${repo}/${path}@${ref}`, {
      cause: err,
    })
  }
  if (Array.isArray(response.data)) {
    throw new Error(`fetchGitHubFile: ${path} in ${owner}/${repo} is a directory, not a file`)
  }
  if (!('content' in response.data) || response.data.type !== 'file') {
    throw new Error(
      `fetchGitHubFile: unexpected response for ${path} in ${owner}/${repo} (type: ${'type' in response.data ? response.data.type : 'unknown'})`
    )
  }
  return Buffer.from(response.data.content, 'base64').toString('utf-8')
}

export { fetchGitHubFile, fetchRevalidatePerDay, fetchWithNextOptions }
