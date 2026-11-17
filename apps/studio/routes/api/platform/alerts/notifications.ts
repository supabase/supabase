import { createFileRoute } from '@tanstack/react-router'

import {
  createSeenEvents,
  handleAlertIssueNotification,
} from '@/lib/api/self-hosted/alert-issue-notifications/handler'
import { configuredWebhookReceivers } from '@/lib/api/self-hosted/alert-issue-notifications/receivers'
import { IS_PLATFORM } from '@/lib/constants'

const seenEvents = createSeenEvents(1_000)

/** Where links in notifications point: the public Studio URL, else the request's own origin. */
const studioUrl = (request: Request) =>
  process.env.NEXT_PUBLIC_SITE_URL || process.env.SUPABASE_PUBLIC_URL || new URL(request.url).origin

// Reads the raw body itself (not through toWebHandler), since the signature covers the exact bytes.
const handleNotification = ({ request }: { request: Request }) =>
  handleAlertIssueNotification(request, {
    secret: process.env.ALERT_ISSUE_NOTIFIER_SECRET,
    receivers: IS_PLATFORM ? {} : configuredWebhookReceivers(studioUrl(request)),
    now: () => Math.floor(Date.now() / 1000),
    seenEvents,
    isPlatform: IS_PLATFORM,
  })

export const Route = createFileRoute('/api/platform/alerts/notifications')({
  server: { handlers: { POST: handleNotification } },
})
