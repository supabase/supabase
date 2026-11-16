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
