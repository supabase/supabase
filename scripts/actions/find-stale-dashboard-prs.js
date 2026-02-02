/**
 * Finds stale Dashboard PRs (older than 24 hours) and fetches their status
 * including review status and mergeable state.
 *
 * @param {Object} github - GitHub API client from actions/github-script
 * @param {Object} context - GitHub Actions context
 * @param {Object} core - GitHub Actions core utilities
 * @returns {Array} Array of stale PRs with status information
 */
module.exports = async ({ github, context, core }) => {
  const TWENTY_FOUR_HOURS_AGO = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const DASHBOARD_PATH = 'apps/studio/'

  console.log(`Looking for PRs older than: ${TWENTY_FOUR_HOURS_AGO.toISOString()}`)

  const stalePRs = []
  let page = 1
  let hasMore = true

  // Fetch PRs page by page, newest first
  while (hasMore && page <= 10) {
    // Limit to 10 pages (1000 PRs) as safety measure
    console.log(`Fetching page ${page}...`)

    const { data: prs } = await github.rest.pulls.list({
      owner: context.repo.owner,
      repo: context.repo.repo,
      state: 'open',
      sort: 'created',
      direction: 'desc',
      per_page: 100,
      page: page,
    })

    if (prs.length === 0) {
      hasMore = false
      break
    }

    // Check each PR
    for (const pr of prs) {
      // Skip PRs from forks - only check internal PRs
      if (pr.head.repo && pr.head.repo.full_name !== context.repo.owner + '/' + context.repo.repo) {
        console.log(`PR #${pr.number} is from a fork, skipping...`)
        continue
      }

      // Skip dependabot PRs
      if (pr.user.login === 'dependabot[bot]' || pr.user.login === 'dependabot') {
        console.log(`PR #${pr.number} is from dependabot, skipping...`)
        continue
      }

      // Skip draft PRs
      if (pr.draft) {
        console.log(`PR #${pr.number} is a draft, skipping...`)
        continue
      }

      const createdAt = new Date(pr.created_at)

      // If this PR is newer than 24 hours, skip it
      if (createdAt > TWENTY_FOUR_HOURS_AGO) {
        console.log(`PR #${pr.number} is too new, skipping...`)
        continue
      }

      console.log(`Checking PR #${pr.number}: ${pr.title}`)

      // Fetch files changed in this PR
      const { data: files } = await github.rest.pulls.listFiles({
        owner: context.repo.owner,
        repo: context.repo.repo,
        pull_number: pr.number,
        per_page: 100,
      })

      // Check if any file is under apps/studio/
      const touchesDashboard = files.some((file) => file.filename.startsWith(DASHBOARD_PATH))

      if (touchesDashboard) {
        const hoursOld = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60))
        const daysOld = Math.floor(hoursOld / 24)

        // Fetch review status
        let reviewStatus = 'no-reviews'
        let reviewEmoji = ':eyes:'
        try {
          const { data: reviews } = await github.rest.pulls.listReviews({
            owner: context.repo.owner,
            repo: context.repo.repo,
            pull_number: pr.number,
            per_page: 100,
          })

          if (reviews.length === 0) {
            reviewStatus = 'no-reviews'
            reviewEmoji = ':eyes:'
          } else {
            // Get the most recent review from each reviewer
            const latestReviews = {}
            reviews.forEach((review) => {
              if (
                !latestReviews[review.user.login] ||
                new Date(review.submitted_at) >
                  new Date(latestReviews[review.user.login].submitted_at)
              ) {
                latestReviews[review.user.login] = review
              }
            })

            // Check for most critical state (Changes Requested > Approved > Commented)
            const states = Object.values(latestReviews).map((r) => r.state)
            if (states.includes('CHANGES_REQUESTED')) {
              reviewStatus = 'changes-requested'
              reviewEmoji = ':warning:'
            } else if (states.includes('APPROVED')) {
              reviewStatus = 'approved'
              reviewEmoji = ':heavy_check_mark:'
            } else {
              reviewStatus = 'commented'
              reviewEmoji = ':speech_balloon:'
            }
          }
        } catch (error) {
          console.log(
            `Warning: Could not fetch review status for PR #${pr.number}: ${error.message}`
          )
        }

        // Get mergeable state
        let mergeableStatus = 'unknown'
        let mergeableEmoji = ':grey_question:'

        // Fetch full PR details to get mergeable state (it's not always in the list response)
        try {
          const { data: fullPR } = await github.rest.pulls.get({
            owner: context.repo.owner,
            repo: context.repo.repo,
            pull_number: pr.number,
          })

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
        } catch (error) {
          console.log(
            `Warning: Could not fetch mergeable state for PR #${pr.number}: ${error.message}`
          )
        }

        // Skip PRs that have already been actioned (reviewed)
        if (reviewStatus !== 'no-reviews') {
          console.log(`PR #${pr.number} has already been reviewed (${reviewStatus}), skipping...`)
          continue
        }

        // Skip PRs with merge conflicts
        if (mergeableStatus === 'conflicts') {
          console.log(`PR #${pr.number} has merge conflicts, skipping...`)
          continue
        }

        stalePRs.push({
          number: pr.number,
          title: pr.title,
          url: pr.html_url,
          author: pr.user.login,
          createdAt: pr.created_at,
          hoursOld: hoursOld,
          daysOld: daysOld,
          fileCount: files.filter((f) => f.filename.startsWith(DASHBOARD_PATH)).length,
          reviewStatus: reviewStatus,
          reviewEmoji: reviewEmoji,
          mergeableStatus: mergeableStatus,
          mergeableEmoji: mergeableEmoji,
        })

        console.log(
          `✓ Found stale Dashboard PR #${pr.number} (Review: ${reviewStatus}, Mergeable: ${mergeableStatus})`
        )
      }
    }

    page++
  }

  console.log(`Found ${stalePRs.length} stale Dashboard PRs`)

  // Sort by age (newest first)
  stalePRs.sort((a, b) => a.hoursOld - b.hoursOld)

  // Store results for next step
  core.setOutput('stale_prs', JSON.stringify(stalePRs))
  core.setOutput('count', stalePRs.length)

  return stalePRs
}
