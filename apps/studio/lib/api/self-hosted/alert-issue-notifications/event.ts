import z from 'zod/v4'

export const alertIssueNotificationTypes = [
  'alert_issue.opened',
  'alert_issue.reopened',
  'alert_issue.repeat',
  'alert_issue.resolved',
] as const

/** The event Logflare sends when a notification policy matches an alert issue change. */
export const alertIssueNotificationEventSchema = z.object({
  event_id: z.string().min(1),
  type: z.enum(alertIssueNotificationTypes),
  occurred_at: z.string(),
  policy: z.object({ name: z.string(), receivers: z.array(z.string()) }),
  alert_issue: z.object({
    alert_issue_id: z.string(),
    title: z.string(),
    description: z.string().nullish(),
    status: z.string(),
    severity: z.string(),
    category: z.string(),
    rule_key: z.string().nullish(),
    identifiers: z.record(z.string(), z.string().nullable()),
    signal_count: z.number(),
    first_seen_at: z.string(),
    last_seen_at: z.string(),
    version: z.number(),
  }),
})

export type AlertIssueNotificationEvent = z.infer<typeof alertIssueNotificationEventSchema>

export type DeliveryResult =
  | { receiver: string; status: 'delivered' | 'failed'; http_status?: number; attempts: number }
  | { receiver: string; status: 'unknown_receiver' }
