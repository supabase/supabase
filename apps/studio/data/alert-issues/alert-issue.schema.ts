import z from 'zod/v4'

export const alertIssueStatusSchema = z.enum(['open', 'acknowledged', 'snoozed', 'resolved'])

export const alertIssueSchema = z.object({
  alert_issue_id: z.string(),
  status: alertIssueStatusSchema,
  change: z.string(),
  title: z.string(),
  description: z.string().nullish(),
  severity: z.string(),
  category: z.string(),
  rule_key: z.string().nullish(),
  identifiers: z.record(z.string(), z.string().nullable()).default({}),
  metadata: z.record(z.string(), z.unknown()).default({}),
  signal_count: z.number(),
  first_seen_at: z.string(),
  last_seen_at: z.string(),
  attention_at: z.string(),
  snoozed_until: z.string().nullish(),
  actor: z.string(),
  unread: z.boolean().optional(),
})

export type AlertIssue = z.infer<typeof alertIssueSchema>
export type AlertIssueStatus = z.infer<typeof alertIssueStatusSchema>

export const alertIssueCommentSchema = z.object({
  comment_id: z.string(),
  alert_issue_id: z.string(),
  author: z.string(),
  body: z.string(),
  created_at: z.string(),
})

export type AlertIssueComment = z.infer<typeof alertIssueCommentSchema>

export const alertLogEventsSchema = z.object({
  lql: z.string(),
  source: z.string().nullish(),
  from: z.string(),
  to: z.string(),
  total: z.number(),
  buckets: z.array(z.object({ timestamp: z.string(), count: z.number() })),
  events: z.array(
    z.object({
      id: z.string(),
      timestamp: z.union([z.string(), z.number()]),
      event_message: z.string().nullish(),
      body: z.record(z.string(), z.unknown()).default({}),
    })
  ),
})

export type AlertLogEvents = z.infer<typeof alertLogEventsSchema>
