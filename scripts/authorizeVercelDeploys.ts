/**
 * Script to authorize Vercel deployments from PR information.
 *
 * Gets the current SHA from environment variable, fetches GitHub statuses,
 * finds authorization-required statuses, and authorizes them via Vercel API.
 */

import { z } from 'zod'

interface GitHubStatus {
  url: string
  avatar_url: string
  id: number
  node_id: string
  state: 'success' | 'pending' | 'failure' | 'error'
  description: string | null
  target_url: string | null
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
    org: z.string().min(1, 'Organization is required'),
    prId: z.number().int().positive('PR ID must be a positive integer'),
    repo: z.string().min(1, 'Repository is required'),
  }),
})

type JobInfo = z.infer<typeof jobInfoSchema>

type GitHubRepository = {
  owner: string
  repo: string
}

const MAX_ATTEMPTS = 3
const REQUEST_TIMEOUT_MS = 10_000

function getRequiredEnv(name: string) {
  const value = process.env[name]
  if (!value) {
    throw new Error(`${name} environment variable is required`)
  }

  return value
}

function getGitHubRepository(): GitHubRepository {
  const repository = getRequiredEnv('GITHUB_REPOSITORY')
  const [owner, repo, ...rest] = repository.split('/')

  if (!owner || !repo || rest.length > 0) {
    throw new Error(`GITHUB_REPOSITORY must use the "owner/repo" format. Received: ${repository}`)
  }

  return { owner, repo }
}

function isRateLimitedResponse(status: number, headers: Headers) {
  return (
    status === 403 && (headers.get('x-ratelimit-remaining') === '0' || headers.has('retry-after'))
  )
}

function isRetryableStatus(status: number, headers: Headers) {
  return isRateLimitedResponse(status, headers) || status === 408 || status === 429 || status >= 500
}

function getRetryDelayMs(attempt: number) {
  return 500 * 2 ** (attempt - 1)
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function fetchWithRetry(input: string, init: RequestInit, label: string): Promise<Response> {
  let lastError: unknown

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

    try {
      const response = await fetch(input, {
        ...init,
        signal: controller.signal,
      })

      if (
        response.ok ||
        !isRetryableStatus(response.status, response.headers) ||
        attempt === MAX_ATTEMPTS
      ) {
        return response
      }

      lastError = new Error(`${label} failed with ${response.status} ${response.statusText}`)
    } catch (error) {
      lastError = error

      if (attempt === MAX_ATTEMPTS) {
        throw error
      }
    } finally {
      clearTimeout(timeout)
    }

    const delayMs = getRetryDelayMs(attempt)
    console.warn(`${label} failed on attempt ${attempt}. Retrying in ${delayMs}ms...`)
    await sleep(delayMs)
  }

  throw lastError instanceof Error ? lastError : new Error(`${label} failed`)
}

async function fetchGitHubStatuses(
  sha: string,
  repository: GitHubRepository,
  githubToken: string
): Promise<GitHubStatus[]> {
  const url = `https://api.github.com/repos/${repository.owner}/${repository.repo}/statuses/${sha}`
  console.log(`Fetching GitHub statuses for ${repository.owner}/${repository.repo}@${sha}`)

  const response = await fetchWithRetry(
    url,
    {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${githubToken}`,
        'X-GitHub-Api-Version': '2022-11-28',
      },
    },
    'GitHub statuses request'
  )

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(
      `Failed to fetch GitHub statuses: ${response.status} ${response.statusText}\n${errorText}`
    )
  }

  return response.json()
}

function extractJobInfoFromTargetUrl(targetUrl: string): JobInfo {
  const url = new URL(targetUrl)
  const jobParam = url.searchParams.get('job')

  if (!jobParam) {
    throw new Error('No job parameter found in target URL')
  }

  try {
    const jobData = JSON.parse(jobParam)
    const parsed = jobInfoSchema.parse({ job: jobData })
    return parsed
  } catch (e) {
    if (e instanceof z.ZodError) {
      throw new Error(
        `Invalid job info structure: ${e.errors.map((err) => `${err.path.join('.')}: ${err.message}`).join(', ')}`
      )
    }
    throw new Error(`Failed to parse job parameter as JSON: ${e}`)
  }
}

function assertJobMatchesRepository(jobInfo: JobInfo, repository: GitHubRepository) {
  if (jobInfo.job.org !== repository.owner || jobInfo.job.repo !== repository.repo) {
    throw new Error(
      `Refusing to authorize ${jobInfo.job.org}/${jobInfo.job.repo}; expected ${repository.owner}/${repository.repo}`
    )
  }
}

async function authorizeVercelJob(jobInfo: JobInfo, vercelToken: string): Promise<void> {
  const url = 'https://vercel.com/api/v1/integrations/authorize-job'

  const response = await fetchWithRetry(
    url,
    {
      method: 'POST',
      headers: {
        Accept: '*/*',
        'Content-Type': 'application/json; charset=utf-8',
        Authorization: `Bearer ${vercelToken}`,
      },
      body: JSON.stringify(jobInfo),
    },
    `Vercel authorization request for ${jobInfo.job.org}/${jobInfo.job.repo}#${jobInfo.job.prId}`
  )

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(
      `Failed to authorize Vercel job: ${response.status} ${response.statusText}\n${errorText}`
    )
  }

  console.log('✓ Vercel job authorized successfully!')
}

function isAuthorizationRequiredStatus(status: GitHubStatus) {
  const description = status.description?.toLowerCase() ?? ''

  return status.context.startsWith('Vercel - ') && description.includes('authorization required')
}

async function main() {
  const sha = getRequiredEnv('HEAD_COMMIT_SHA')
  const vercelToken = getRequiredEnv('VERCEL_TOKEN')
  const githubToken = getRequiredEnv('GITHUB_TOKEN')
  const repository = getGitHubRepository()

  console.log(`Starting authorization process for SHA: ${sha}`)

  // Fetch GitHub statuses
  const statuses = await fetchGitHubStatuses(sha, repository, githubToken)
  console.log(`Found ${statuses.length} statuses`)

  // Filter for authorization-required statuses
  const authRequiredStatuses = statuses.filter(isAuthorizationRequiredStatus)

  if (authRequiredStatuses.length === 0) {
    console.log('No authorization-required statuses found. Nothing to authorize.')
    return
  }

  console.log(`Found ${authRequiredStatuses.length} authorization-required status(es)`)

  let failedCount = 0
  let skippedCount = 0

  // Process each authorization-required status
  for (const status of authRequiredStatuses) {
    if (status.context === 'Vercel - studio') {
      console.log(`\nSkipping status: ${status.context}`)
      continue
    }

    try {
      console.log(`\nProcessing status: ${status.context}`)

      if (!status.target_url) {
        skippedCount++
        console.warn(`Skipping status ${status.context}: target_url is missing`)
        continue
      }

      console.log(`Target URL: ${status.target_url}`)

      // Extract job info from target URL
      const jobInfo = extractJobInfoFromTargetUrl(status.target_url)
      assertJobMatchesRepository(jobInfo, repository)

      // Authorize the job
      await authorizeVercelJob(jobInfo, vercelToken)
    } catch (error) {
      failedCount++
      console.error(`Failed to process status ${status.context}:`, error)
      // Continue with other statuses even if one fails
    }
  }

  if (failedCount > 0) {
    throw new Error(`Failed to authorize ${failedCount} Vercel status(es)`)
  }

  console.log(`\n✓ Authorization process completed! Skipped ${skippedCount} status(es).`)
}

main().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
