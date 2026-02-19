const TWENTY_FOUR_HOURS_AGO = new Date(Date.now() - 24 * 60 * 60 * 1000)
const DASHBOARD_PATH = 'apps/studio/'
const REPO_OWNER = 'supabase'
const REPO_NAME = 'supabase'

const GITHUB_TOKEN = process.env.GITHUB_TOKEN

class RateLimitError extends Error {
  constructor(resetAt: string) {
    super(`GitHub API rate limit exceeded. Resets at ${resetAt}`)
  }
}

async function githubApi(path: string) {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  }
  if (GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${GITHUB_TOKEN}`
  }

  const response = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}${path}`, {
    headers,
  })

  if (
    response.status === 429 ||
    (response.status === 403 && response.headers.get('x-ratelimit-remaining') === '0')
  ) {
    const resetEpoch = response.headers.get('x-ratelimit-reset')
    const resetAt = resetEpoch ? new Date(Number(resetEpoch) * 1000).toISOString() : 'unknown'
    throw new RateLimitError(resetAt)
  }

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`GitHub API error: ${response.status} ${response.statusText}\n${errorText}`)
  }

  return response.json()
}

interface StalePR {
  number: number
  title: string
  url: string
  author: string
  createdAt: string
  hoursOld: number
  daysOld: number
  fileCount: number
  reviewStatus: string
  reviewEmoji: string
  mergeableStatus: string
  mergeableEmoji: string
}

async function findStalePRs(): Promise<StalePR[]> {
  console.error(`Looking for PRs older than: ${TWENTY_FOUR_HOURS_AGO.toISOString()}`)

  const stalePRs: StalePR[] = []
  let page = 1
  let hasMore = true

  outer: while (hasMore && page <= 10) {
    console.error(`Fetching page ${page}...`)

    let prs: any[]
    try {
      prs = await githubApi(
        `/pulls?state=open&sort=created&direction=desc&per_page=100&page=${page}`
      )
    } catch (error: any) {
      if (error instanceof RateLimitError) {
        console.error(`Rate limited while listing PRs. ${error.message}`)
        break
      }
      throw error
    }

    if (prs.length === 0) {
      hasMore = false
      break
    }

    for (const pr of prs) {
      // Skip PRs from forks
      if (pr.head.repo && pr.head.repo.full_name !== `${REPO_OWNER}/${REPO_NAME}`) {
        console.error(`PR #${pr.number} is from a fork, skipping...`)
        continue
      }

      // Skip dependabot PRs
      if (pr.user.login === 'dependabot[bot]' || pr.user.login === 'dependabot') {
        console.error(`PR #${pr.number} is from dependabot, skipping...`)
        continue
      }

      // Skip draft PRs
      if (pr.draft) {
        console.error(`PR #${pr.number} is a draft, skipping...`)
        continue
      }

      const createdAt = new Date(pr.created_at)

      if (createdAt > TWENTY_FOUR_HOURS_AGO) {
        console.error(`PR #${pr.number} is too new, skipping...`)
        continue
      }

      console.error(`Checking PR #${pr.number}: ${pr.title}`)

      let files: any[]
      try {
        files = await githubApi(`/pulls/${pr.number}/files?per_page=100`)
      } catch (error: any) {
        if (error instanceof RateLimitError) {
          console.error(`Rate limited while fetching files. ${error.message}`)
          break outer
        }
        throw error
      }

      const touchesDashboard = files.some((file: any) => file.filename.startsWith(DASHBOARD_PATH))

      if (!touchesDashboard) continue

      const hoursOld = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60))
      const daysOld = Math.floor(hoursOld / 24)

      // Fetch review status
      let reviewStatus = 'no-reviews'
      let reviewEmoji = ':eyes:'
      try {
        const reviews = await githubApi(`/pulls/${pr.number}/reviews?per_page=100`)

        if (reviews.length > 0) {
          const latestReviews: Record<string, any> = {}
          reviews.forEach((review: any) => {
            if (
              !latestReviews[review.user.login] ||
              new Date(review.submitted_at) >
                new Date(latestReviews[review.user.login].submitted_at)
            ) {
              latestReviews[review.user.login] = review
            }
          })

          const states = Object.values(latestReviews).map((r) => r.state)
          if (states.includes('CHANGES_REQUESTED')) {
            reviewStatus = 'changes-requested'
            reviewEmoji = ':warning:'
          } else if (states.includes('APPROVED')) {
            reviewStatus = 'approved'
            reviewEmoji = ':heavy_check_mark:'
          }
        }
      } catch (error: any) {
        if (error instanceof RateLimitError) {
          console.error(`Rate limited while fetching reviews. ${error.message}`)
          break outer
        }
        console.error(
          `Warning: Could not fetch review status for PR #${pr.number}: ${error.message}`
        )
      }

      // Get mergeable state
      let mergeableStatus = 'unknown'
      let mergeableEmoji = ':grey_question:'
      try {
        const fullPR = await githubApi(`/pulls/${pr.number}`)
        const mergeableState = fullPR.mergeable_state

        switch (mergeableState) {
          case 'clean':
            mergeableStatus = 'ready'
            mergeableEmoji = ':rocket:'
            break
          case 'dirty':
            mergeableStatus = 'conflicts'
            mergeableEmoji = ':collision:'
            break
          case 'blocked':
            mergeableStatus = 'blocked'
            mergeableEmoji = ':no_entry:'
            break
          case 'unstable':
            mergeableStatus = 'unstable'
            mergeableEmoji = ':warning:'
            break
          case 'behind':
            mergeableStatus = 'behind'
            mergeableEmoji = ':arrow_down:'
            break
          case 'draft':
            mergeableStatus = 'draft'
            mergeableEmoji = ':pencil2:'
            break
          default:
            mergeableStatus = mergeableState || 'unknown'
            mergeableEmoji = ':grey_question:'
        }
      } catch (error: any) {
        if (error instanceof RateLimitError) {
          console.error(`Rate limited while fetching mergeable state. ${error.message}`)
          break outer
        }
        console.error(
          `Warning: Could not fetch mergeable state for PR #${pr.number}: ${error.message}`
        )
      }

      // Skip PRs that have already been reviewed
      if (reviewStatus !== 'no-reviews') {
        console.error(`PR #${pr.number} has already been reviewed (${reviewStatus}), skipping...`)
        continue
      }

      // Skip PRs with merge conflicts
      if (mergeableStatus === 'conflicts') {
        console.error(`PR #${pr.number} has merge conflicts, skipping...`)
        continue
      }

      stalePRs.push({
        number: pr.number,
        title: pr.title,
        url: pr.html_url,
        author: pr.user.login,
        createdAt: pr.created_at,
        hoursOld,
        daysOld,
        fileCount: files.filter((f: any) => f.filename.startsWith(DASHBOARD_PATH)).length,
        reviewStatus,
        reviewEmoji,
        mergeableStatus,
        mergeableEmoji,
      })

      console.error(
        `Found stale Dashboard PR #${pr.number} (Review: ${reviewStatus}, Mergeable: ${mergeableStatus})`
      )
    }

    page++
  }

  console.error(`Found ${stalePRs.length} stale Dashboard PRs`)

  stalePRs.sort((a, b) => a.hoursOld - b.hoursOld)

  return stalePRs
}

findStalePRs()
  .then((stalePRs) => {
    // Output JSON to stdout for piping to the next script
    console.log(JSON.stringify(stalePRs))
  })
  .catch((error) => {
    console.error('Error:', error.message)
    process.exit(1)
  })
