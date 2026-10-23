import type { IssueNotificationRuleInput } from '@/data/issues/issue-notification-schema'

export const NOTIFICATION_DESTINATIONS = {
  slack: { label: 'Slack', fieldLabel: 'Channel', placeholder: '#project-alerts' },
  linear: { label: 'Linear', fieldLabel: 'Team', placeholder: 'Engineering' },
  claude_code: { label: 'Claude Code', fieldLabel: 'Agent', placeholder: 'Production triage' },
  webhook: { label: 'Webhook', fieldLabel: 'URL', placeholder: 'https://example.com/issues' },
} satisfies Record<
  IssueNotificationRuleInput['channel'],
  { label: string; fieldLabel: string; placeholder: string }
>

export const NOTIFICATION_SEVERITIES = {
  all: 'All severities',
  critical: 'Critical only',
  warning: 'Warning only',
  info: 'Info only',
} satisfies Record<IssueNotificationRuleInput['severity'], string>
