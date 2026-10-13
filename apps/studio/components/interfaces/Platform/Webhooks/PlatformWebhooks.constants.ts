import type { WebhookEventType } from '@/data/platform-webhooks/platform-webhooks-fetchers'

// The full list of event types the real API accepts, identical for organization-scoped
// and project-scoped endpoints.
export const PLATFORM_WEBHOOK_EVENT_TYPES = [
  'v1.project.paused',
  'v1.project.created',
  'v1.project.restored',
  'v1.project.transferred',
  'v1.project.removed',
  'v1.project.restarted',
  'v1.project.status.changed',
  'v1.project.backup.started',
  'v1.project.branch.created',
  'v1.project.branch.updated',
  'v1.project.branch.removed',
  'v1.organization.member.invitation.created',
  'v1.organization.member.invitation.canceled',
  'v1.organization.member.added',
  'v1.organization.member.removed',
  'v1.organization.member.role.assigned',
  'v1.organization.member.role.removed',
  'v1.organization.member.role.updated',
  'v1.organization.billing.plan.upgraded',
  'v1.organization.billing.plan.downgraded',
] as const satisfies readonly WebhookEventType[]
