// Vercel's GitHub App has stopped writing GitHub Deployment objects since
// 2026-02-17 (broken app auth), so polling the Deployments API (as
// vercel/wait-for-deployment-action does) times out even though the preview
// builds fine. Poll the project's Vercel commit status instead, then resolve
// the actual preview URL via Vercel's own deployments API.
//
// A build that Vercel's Ignored Build Step skips still gets a successful
// commit status, but the deployment behind it is CANCELED and its URL serves
// a placeholder page with a 200 status. Such a preview is not testable, so
// the URL is resolved from the newest earlier commit of the pull request
// whose deployment is READY. Vercel skips a build only when the commit does
// not affect the project, so that earlier preview serves the same content.
//
// Set VERCEL_STATUS_CONTEXT to the project's commit status name, e.g.
// "Vercel – docs" or "Vercel – zone-www-dot-com". PR_NUMBER enables the
// fallback to earlier commits of the pull request.
const { appendFileSync } = require('fs')

const TIMEOUT_MS = 900_000
const POLL_INTERVAL_MS = 15_000
const GITHUB_PAGE_SIZE = 100

function deploymentIdFromTargetUrl(targetUrl) {
  let rawId
  try {
    rawId = new URL(targetUrl).pathname.split('/').filter(Boolean).pop()
  } catch {
    rawId = undefined
  }
  if (!rawId) {
    throw new Error(`Could not parse a deployment ID from target_url: ${targetUrl}`)
  }
  return rawId.startsWith('dpl_') ? rawId : `dpl_${rawId}`
}

function shortSha(sha) {
  return sha.slice(0, 10)
}

function createClients({ fetchImpl = fetch, repository, githubToken, vercelToken, teamId }) {
  const githubHeaders = {
    Authorization: `Bearer ${githubToken}`,
    Accept: 'application/vnd.github+json',
  }
  const vercelHeaders = { Authorization: `Bearer ${vercelToken}` }

  async function getJson(url, headers, what) {
    const response = await fetchImpl(url, { headers })
    if (!response.ok) {
      throw new Error(`Failed to ${what}: ${response.status} ${response.statusText}`)
    }
    return response.json()
  }

  return {
    // Newest status for the context, or undefined when Vercel has not posted one.
    async latestStatus(sha, statusContext) {
      const statuses = await getJson(
        `https://api.github.com/repos/${repository}/commits/${sha}/statuses`,
        githubHeaders,
        `fetch commit statuses for ${shortSha(sha)}`
      )
      return statuses
        .filter((status) => status.context === statusContext)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
    },

    // Commit SHAs of the pull request, newest first.
    async pullRequestShas(prNumber) {
      const shas = []
      for (let page = 1; ; page += 1) {
        const commits = await getJson(
          `https://api.github.com/repos/${repository}/pulls/${prNumber}/commits?per_page=${GITHUB_PAGE_SIZE}&page=${page}`,
          githubHeaders,
          `fetch commits for pull request #${prNumber}`
        )
        shas.push(...commits.map((commit) => commit.sha))
        if (commits.length < GITHUB_PAGE_SIZE) break
      }
      return shas.reverse()
    },

    async deployment(targetUrl) {
      const deploymentId = deploymentIdFromTargetUrl(targetUrl)
      const query = teamId ? `?teamId=${teamId}` : ''
      const deployment = await getJson(
        `https://api.vercel.com/v13/deployments/${deploymentId}${query}`,
        vercelHeaders,
        `resolve Vercel deployment ${deploymentId}`
      )
      return { url: `https://${deployment.url}`, state: deployment.readyState ?? deployment.status }
    },
  }
}

async function resolveFromEarlierCommits(clients, { headSha, prNumber, statusContext, log }) {
  if (!prNumber) {
    throw new Error(
      `The "${statusContext}" build for ${shortSha(headSha)} was skipped, and PR_NUMBER is required to fall back to an earlier commit's preview`
    )
  }

  const shas = await clients.pullRequestShas(prNumber)
  for (const sha of shas) {
    if (sha === headSha) continue

    const status = await clients.latestStatus(sha, statusContext)
    if (status?.state !== 'success' || !status.target_url) continue

    const deployment = await clients.deployment(status.target_url)
    if (deployment.state === 'READY') {
      log(`Using the "${statusContext}" preview built for ${shortSha(sha)}: ${deployment.url}`)
      return deployment.url
    }
  }

  throw new Error(
    `No READY "${statusContext}" preview among the ${shas.length} commits of pull request #${prNumber}`
  )
}

async function resolvePreviewUrl(clients, options) {
  const { headSha, statusContext, timeoutMs, pollIntervalMs, sleep, now, log } = options
  const start = now()

  for (;;) {
    const latest = await clients.latestStatus(headSha, statusContext)

    if (latest?.state === 'success') {
      if (!latest.target_url) {
        throw new Error(
          `"${statusContext}" commit status succeeded but had no target_url to resolve a deployment from`
        )
      }

      const deployment = await clients.deployment(latest.target_url)
      if (deployment.state === 'READY') {
        return deployment.url
      }
      if (deployment.state === 'CANCELED') {
        log(
          `"${statusContext}" for ${shortSha(headSha)} reports "${latest.description}" and its deployment is CANCELED; looking for the newest READY preview among earlier commits`
        )
        return resolveFromEarlierCommits(clients, options)
      }
      throw new Error(
        `"${statusContext}" deployment for ${shortSha(headSha)} is ${deployment.state}, not READY`
      )
    }

    if (latest?.state === 'failure' || latest?.state === 'error') {
      throw new Error(`"${statusContext}" deployment failed (commit status: ${latest.state})`)
    }

    if (now() - start > timeoutMs) {
      throw new Error(
        `Timed out after ${Math.round(timeoutMs / 1000)}s waiting for the "${statusContext}" preview deployment`
      )
    }

    await sleep(pollIntervalMs)
  }
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
  const statusContext = process.env.VERCEL_STATUS_CONTEXT
  const prNumber = process.env.PR_NUMBER

  if (!repository) throw new Error('GITHUB_REPOSITORY environment variable is required')
  if (!sha) throw new Error('HEAD_SHA environment variable is required')
  if (!githubToken) throw new Error('GITHUB_TOKEN environment variable is required')
  if (!vercelToken) throw new Error('VERCEL_TOKEN environment variable is required')
  if (!statusContext) throw new Error('VERCEL_STATUS_CONTEXT environment variable is required')

  const clients = createClients({ repository, githubToken, vercelToken, teamId })
  const url = await resolvePreviewUrl(clients, {
    headSha: sha,
    prNumber,
    statusContext,
    timeoutMs: TIMEOUT_MS,
    pollIntervalMs: POLL_INTERVAL_MS,
    sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
    now: Date.now,
    log: console.log,
  })
  writeOutput('deployment-url', url)
}

module.exports = { createClients, deploymentIdFromTargetUrl, resolvePreviewUrl }

if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
}
