/**
 * Script to authorize Vercel deployments from PR information.
 *
 * Gets the current SHA from environment variable, fetches GitHub statuses,
 * finds authorization-required statuses, and authorizes them via Vercel API.
 */

import { z } from 'zod'

const DEFAULT_TIMEOUT_MS = 30_000
const MAX_RETRIES = 3

interface GitHubStatus {
  url: string
  avatar_url: string
  id: number
  node_id: string
  state: 'success' | 'pending' | 'failure' | 'error'
  description: string
  target_url: string
  context: string
  created_at: string
  updated_at: string
}

const jobInfoSchema = z.object({
  job: z.object({
    headInfo: z.object({
      sha: z.string().min(1, 'SHA is required'),
    }),
    id: z.string().min(1, 'ID is required'),
    org: z.string().min(1, 'Org is required'),
    prId: z.number().int().positive('PR ID must be a positive integer'),
    repo: z.string().min(1, 'Repo is required'),
  }),
})

type JobInfo = z.infer<typeof jobInfoSchema>

async function fetchWithTimeoutAndRetry(
  url: string,
  options: RequestInit & { timeout?: number } = {},
  retries: number = MAX_RETRIES,
): Promise<Response> {
  const timeout = options.timeout ?? DEFAULT_TIMEOUT_MS
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    })
    return response
  } catch (error) {
    if (retries > 0 && error instanceof TypeError) {
      console.warn(`Request failed, retrying... (${MAX_RETRIES - retries + 1}/${MAX_RETRIES})`)
      await new Promise((resolve) => setTimeout(resolve, 1000 * (MAX_RETRIES - retries + 1)))
      return fetchWithTimeoutAndRetry(url, options, retries - 1)
    }
    throw error
  } finally {
    clearTimeout(timeoutId)
  }
}

async function fetchGitHubStatuses(
  sha: string,
  token: string,
  repo: string,
): Promise<GitHubStatus[]> {
  const url = `https://api.github.com/repos/${repo}/statuses/${sha}`
  console.log(`Fetching GitHub statuses for SHA: ${sha}`)

  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetchWithTimeoutAndRetry(url, {
    headers,
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch GitHub statuses: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

function extractJobInfoFromTargetUrl(targetUrl: string): JobInfo | null {
  if (!targetUrl) {
    console.warn('Status has no target_url, skipping')
    return null
  }

  let url: URL
  try {
    url = new URL(targetUrl)
  } catch {
    console.warn(`Invalid target_url: ${targetUrl}, skipping`)
    return null
  }

  const jobParam = url.searchParams.get('job')

  if (!jobParam) {
    console.warn('No job parameter found in target URL, skipping')
    return null
  }

  try {
    const jobData = JSON.parse(jobParam)
    const parsed = jobInfoSchema.parse({ job: jobData })
    return parsed
  } catch (e) {
    if (e instanceof z.ZodError) {
      throw new Error(
        `Invalid job info structure: ${e.errors.map((err) => `${err.path.join('.')}: ${err.message}`).join(', ')}`,
      )
    }
    throw new Error(`Failed to parse job parameter as JSON: ${e}`)
  }
}

async function authorizeVercelJob(jobInfo: JobInfo, vercelToken: string): Promise<void> {
  const url = 'https://vercel.com/api/v1/integrations/authorize-job'

  const response = await fetchWithTimeoutAndRetry(url, {
    method: 'POST',
    headers: {
      Accept: '*/*',
      'Content-Type': 'application/json; charset=utf-8',
      Authorization: `Bearer ${vercelToken}`,
    },
    body: JSON.stringify(jobInfo),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(
      `Failed to authorize Vercel job: ${response.status} ${response.statusText}\n${errorText}`,
    )
  }

  console.log('✓ Vercel job authorized successfully!')
}

async function main() {
  const sha = process.env.HEAD_COMMIT_SHA
  if (!sha) {
    throw new Error('HEAD_COMMIT_SHA environment variable is required')
  }

  const vercelToken = process.env.VERCEL_TOKEN
  if (!vercelToken) {
    throw new Error('VERCEL_TOKEN environment variable is required')
  }

  const githubToken = process.env.GITHUB_TOKEN || ''
  const repo = process.env.GITHUB_REPO || 'supabase/supabase'

  console.log(`Starting authorization process for SHA: ${sha} on repo: ${repo}`)

  // Fetch GitHub statuses
  const statuses = await fetchGitHubStatuses(sha, githubToken, repo)
  console.log(`Found ${statuses.length} statuses`)

  // Filter for authorization-required statuses
  const authRequiredStatuses = statuses.filter(
    (status) => status.description === 'Authorization required to deploy.',
  )

  if (authRequiredStatuses.length === 0) {
    console.log('No authorization-required statuses found. Nothing to authorize.')
    return
  }

  console.log(`Found ${authRequiredStatuses.length} authorization-required status(es)`)

  let hasFailure = false

  // Process each authorization-required status
  for (const status of authRequiredStatuses) {
    if (status.context === 'Vercel - studio') {
      console.log(`\nSkipping status: ${status.context}`)
      continue
    }

    try {
      console.log(`\nProcessing status: ${status.context}`)
      console.log(`Target URL: ${status.target_url}`)

      // Extract job info from target URL
      const jobInfo = extractJobInfoFromTargetUrl(status.target_url)

      if (!jobInfo) {
        console.warn(`Skipping status ${status.context} due to missing or invalid job info`)
        continue
      }

      // Authorize the job
      await authorizeVercelJob(jobInfo, vercelToken)
    } catch (error) {
      console.error(`Failed to process status ${status.context}:`, error)
      hasFailure = true
    }
  }

  if (hasFailure) {
    throw new Error('One or more Vercel job authorizations failed')
  }

  console.log('\n✓ Authorization process completed!')
}

main().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
