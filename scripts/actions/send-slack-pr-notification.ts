const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL

if (!SLACK_WEBHOOK_URL) {
  console.error('SLACK_WEBHOOK_URL environment variable is required')
  process.exit(1)
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

function escapeSlack(text: string) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

async function sendSlackNotification(stalePRs: StalePR[]) {
  const count = stalePRs.length

  const prBlocks = stalePRs.map((pr) => {
    const remainingHours = pr.hoursOld % 24
    const ageText = pr.daysOld > 0 ? `${pr.daysOld}d ${remainingHours}h` : `${pr.hoursOld}h`

    const maxTitleLength = 200
    const safeTitle =
      pr.title.length > maxTitleLength
        ? escapeSlack(pr.title.substring(0, maxTitleLength) + '...')
        : escapeSlack(pr.title)

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

  const MAX_PRS_TO_SHOW = 47
  const prBlocksToShow = prBlocks.slice(0, MAX_PRS_TO_SHOW)
  const hasMorePRs = prBlocks.length > MAX_PRS_TO_SHOW

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

  const response = await fetch(SLACK_WEBHOOK_URL!, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(slackMessage),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(
      `Slack notification failed: ${response.status} ${response.statusText}\n${errorText}`
    )
  }

  console.error('Slack notification sent successfully!')
}

// Read JSON from stdin
async function readStdin(): Promise<string> {
  const chunks: Buffer[] = []
  for await (const chunk of process.stdin) {
    chunks.push(chunk)
  }
  return Buffer.concat(chunks).toString('utf-8')
}

readStdin()
  .then(async (input) => {
    const stalePRs: StalePR[] = JSON.parse(input)

    if (stalePRs.length === 0) {
      console.error('No stale PRs to notify about')
      return
    }

    await sendSlackNotification(stalePRs)
  })
  .catch((error) => {
    console.error('Error:', error.message)
    process.exit(1)
  })
