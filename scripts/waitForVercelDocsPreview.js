// Vercel's GitHub App has stopped writing GitHub Deployment objects since
// 2026-02-17 (broken app auth), so polling the Deployments API (as
// vercel/wait-for-deployment-action does) times out even though the docs
// preview builds fine. Poll the "Vercel – docs" commit status instead, then
// resolve the actual preview URL via Vercel's own deployments API.
const { appendFileSync } = require('fs')

const STATUS_CONTEXT = 'Vercel – docs'
const TIMEOUT_MS = 900_000
const POLL_INTERVAL_MS = 15_000

async function fetchLatestStatus(repository, sha, githubToken) {
  const url = `https://api.github.com/repos/${repository}/commits/${sha}/statuses`
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${githubToken}`,
      Accept: 'application/vnd.github+json',
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch commit statuses: ${response.status} ${response.statusText}`)
  }

  const statuses = await response.json()

  return statuses
    .filter((status) => status.context === STATUS_CONTEXT)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
}

async function resolveDeploymentUrl(targetUrl, vercelToken, teamId) {
  const rawId = targetUrl.split('/').filter(Boolean).pop()
  if (!rawId) {
    throw new Error(`Could not parse a deployment ID from target_url: ${targetUrl}`)
  }
  const deploymentId = rawId.startsWith('dpl_') ? rawId : `dpl_${rawId}`

  const url = teamId
    ? `https://api.vercel.com/v13/deployments/${deploymentId}?teamId=${teamId}`
    : `https://api.vercel.com/v13/deployments/${deploymentId}`

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${vercelToken}` },
  })

  if (!response.ok) {
    throw new Error(
      `Failed to resolve Vercel deployment ${deploymentId}: ${response.status} ${response.statusText}`
    )
  }

  const deployment = await response.json()
  return `https://${deployment.url}`
}

function writeOutput(name, value) {
  const outputFile = process.env.GITHUB_OUTPUT
  if (!outputFile) {
    throw new Error('GITHUB_OUTPUT environment variable is required')
  }
  appendFileSync(outputFile, `${name}=${value}\n`)
}

async function main() {
  const repository = process.env.GITHUB_REPOSITORY
  const sha = process.env.HEAD_SHA
  const githubToken = process.env.GITHUB_TOKEN
  const vercelToken = process.env.VERCEL_TOKEN
  const teamId = process.env.VERCEL_TEAM_ID

  if (!repository) throw new Error('GITHUB_REPOSITORY environment variable is required')
  if (!sha) throw new Error('HEAD_SHA environment variable is required')
  if (!githubToken) throw new Error('GITHUB_TOKEN environment variable is required')
  if (!vercelToken) throw new Error('VERCEL_TOKEN environment variable is required')

  const start = Date.now()

  for (;;) {
    const latest = await fetchLatestStatus(repository, sha, githubToken)

    if (latest?.state === 'success') {
      if (!latest.target_url) {
        throw new Error(
          'Vercel docs commit status succeeded but had no target_url to resolve a deployment from'
        )
      }
      const deploymentUrl = await resolveDeploymentUrl(latest.target_url, vercelToken, teamId)
      writeOutput('deployment-url', deploymentUrl)
      return
    }

    if (latest?.state === 'failure' || latest?.state === 'error') {
      throw new Error(`Vercel docs deployment failed (commit status: ${latest.state})`)
    }

    if (Date.now() - start > TIMEOUT_MS) {
      throw new Error('Timed out after 900s waiting for the Vercel docs preview deployment')
    }

    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS))
  }
}

main().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
