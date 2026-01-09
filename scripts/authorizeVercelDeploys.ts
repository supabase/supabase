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
    org: z.literal('supabase'),
    prId: z.number().int().positive('PR ID must be a positive integer'),
    repo: z.literal('supabase'),
  }),
})

type JobInfo = z.infer<typeof jobInfoSchema>

async function fetchGitHubStatuses(sha: string): Promise<GitHubStatus[]> {
  const url = `https://api.github.com/repos/supabase/supabase/statuses/${sha}`
  console.log(`Fetching GitHub statuses for SHA: ${sha}`)

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch GitHub statuses: ${response.status} ${response.statusText}`)
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

async function authorizeVercelJob(jobInfo: JobInfo, vercelToken: string): Promise<void> {
  const url = 'https://vercel.com/api/v1/integrations/authorize-job'

  const response = await fetch(url, {
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
      `Failed to authorize Vercel job: ${response.status} ${response.statusText}\n${errorText}`
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

  console.log(`Starting authorization process for SHA: ${sha}`)

  // Fetch GitHub statuses
  const statuses = await fetchGitHubStatuses(sha)
  console.log(`Found ${statuses.length} statuses`)

  // Filter for authorization-required statuses
  const authRequiredStatuses = statuses.filter(
    (status) => status.description === 'Authorization required to deploy.'
  )

  if (authRequiredStatuses.length === 0) {
    console.log('No authorization-required statuses found. Nothing to authorize.')
    return
  }

  console.log(`Found ${authRequiredStatuses.length} authorization-required status(es)`)

  // Process each authorization-required status
  for (const status of authRequiredStatuses) {
    try {
      console.log(`\nProcessing status: ${status.context}`)
      console.log(`Target URL: ${status.target_url}`)

      // Extract job info from target URL
      const jobInfo = extractJobInfoFromTargetUrl(status.target_url)

      // Authorize the job
      await authorizeVercelJob(jobInfo, vercelToken)
    } catch (error) {
      console.error(`Failed to process status ${status.context}:`, error)
      // Continue with other statuses even if one fails
    }
  }

  console.log('\n✓ Authorization process completed!')
}

main().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
