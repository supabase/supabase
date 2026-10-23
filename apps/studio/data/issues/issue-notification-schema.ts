import * as z from 'zod'

export const issueNotificationChannelSchema = z.enum(['slack', 'linear', 'claude_code', 'webhook'])
export const issueNotificationSeveritySchema = z.enum(['all', 'critical', 'warning', 'info'])

export const issueNotificationRuleInputSchema = z
  .object({
    channel: issueNotificationChannelSchema,
    destination: z.string().trim().min(1, 'Enter a destination'),
    severity: issueNotificationSeveritySchema,
    // Advisor check IDs to notify for. Empty matches every issue, including ones that
    // people and agents file.
    check_ids: z.array(z.string()),
    is_enabled: z.boolean(),
  })
  .superRefine(({ channel, destination }, context) => {
    if (channel !== 'webhook') return
    try {
      const url = new URL(destination)
      if (url.protocol === 'https:' || url.protocol === 'http:') return
    } catch {
      // Report invalid URLs on the destination field below.
    }
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['destination'],
      message: 'Enter an HTTP or HTTPS URL',
    })
  })

export const issueNotificationRuleSchema = z
  .object({ id: z.string() })
  .and(issueNotificationRuleInputSchema)

export type IssueNotificationRuleInput = z.infer<typeof issueNotificationRuleInputSchema>
export type IssueNotificationRule = z.infer<typeof issueNotificationRuleSchema>
