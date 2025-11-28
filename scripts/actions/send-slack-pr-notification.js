/**
 * Sends a Slack notification with stale Dashboard PRs
 *
 * @param {Array} stalePRs - Array of stale PRs from find-stale-dashboard-prs.js
 * @param {string} webhookUrl - Slack webhook URL
 */
module.exports = async (stalePRs, webhookUrl) => {
  const count = stalePRs.length

  // Build PR blocks with proper escaping for Slack mrkdwn
  const prBlocks = stalePRs.map((pr) => {
    // Format age display
    const remainingHours = pr.hoursOld % 24
    const ageText = pr.daysOld > 0 ? `${pr.daysOld}d ${remainingHours}h` : `${pr.hoursOld}h`

    // Escape special characters for Slack mrkdwn (escape &, <, >)
    const escapeSlack = (text) => {
      return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    }

    // Truncate title if too long (max 3000 chars for entire text field)
    const maxTitleLength = 200
    const safeTitle =
      pr.title.length > maxTitleLength
        ? escapeSlack(pr.title.substring(0, maxTitleLength) + '...')
        : escapeSlack(pr.title)

    // Format status text
    const reviewStatusText =
      pr.reviewStatus === 'approved'
        ? 'Approved'
        : pr.reviewStatus === 'changes-requested'
          ? 'Changes Requested'
          : pr.reviewStatus === 'commented'
            ? 'Commented'
            : 'Needs Review'

    const mergeableStatusText =
      pr.mergeableStatus === 'ready'
        ? 'Ready to Merge'
        : pr.mergeableStatus === 'conflicts'
          ? 'Has Conflicts'
          : pr.mergeableStatus === 'blocked'
            ? 'Blocked'
            : pr.mergeableStatus === 'unstable'
              ? 'Unstable'
              : pr.mergeableStatus === 'behind'
                ? 'Behind Base'
                : pr.mergeableStatus === 'draft'
                  ? 'Draft'
                  : 'Unknown'

    return {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*<${pr.url}|#${pr.number}: ${safeTitle}>*\n:bust_in_silhouette: @${pr.author} • :clock3: ${ageText} old • :file_folder: ${pr.fileCount} Dashboard files\n${pr.reviewEmoji} ${reviewStatusText} • ${pr.mergeableEmoji} ${mergeableStatusText}`,
      },
    }
  })

  // Slack has a 50 block limit, we use 3 for header/intro/divider
  // So we can show max 47 PRs
  const MAX_PRS_TO_SHOW = 47
  const prBlocksToShow = prBlocks.slice(0, MAX_PRS_TO_SHOW)
  const hasMorePRs = prBlocks.length > MAX_PRS_TO_SHOW

  // Build complete Slack message
  const slackMessage = {
    text: 'Dashboard PRs needing attention',
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: 'Dashboard PRs Older Than 24 Hours',
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `There are *${count}* open PRs affecting /apps/studio/ that are older than 24 hours:${hasMorePRs ? ` (showing first ${MAX_PRS_TO_SHOW})` : ''}`,
        },
      },
      {
        type: 'divider',
      },
      ...prBlocksToShow,
    ],
  }

  // Send to Slack
  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(slackMessage),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(
      `Slack notification failed: ${response.status} ${response.statusText}\n${errorText}`
    )
  }

  console.log('✓ Slack notification sent successfully!')
}
