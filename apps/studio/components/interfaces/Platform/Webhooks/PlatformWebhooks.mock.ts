import type {
  PlatformWebhooksMockSeed,
  WebhookDelivery,
  WebhookScope,
} from './PlatformWebhooks.types'

const createDeliveries = (
  endpointId: string,
  prefix: string,
  deliveries: Array<Pick<WebhookDelivery, 'eventType' | 'status' | 'responseCode' | 'attemptAt'>>
): WebhookDelivery[] =>
  deliveries.map((delivery, index) => ({
    id: `${prefix}-${index + 1}`,
    endpointId,
    ...delivery,
  }))

const organizationPrimaryDeliveries = createDeliveries(
  '7f2c9d4a-6e31-4d9d-9a1f-2c4b5e6f7081',
  'org-delivery',
  [
    {
      eventType: 'project.created',
      status: 'success',
      responseCode: 200,
      attemptAt: '2026-02-27T08:04:00.000Z',
    },
    {
      eventType: 'project.updated',
      status: 'failure',
      responseCode: 500,
      attemptAt: '2026-02-27T07:56:00.000Z',
    },
    {
      eventType: 'project.deleted',
      status: 'pending',
      attemptAt: '2026-02-27T07:45:00.000Z',
    },
    {
      eventType: 'organization.member_invited',
      status: 'success',
      responseCode: 202,
      attemptAt: '2026-02-27T07:37:00.000Z',
    },
    {
      eventType: 'project.resumed',
      status: 'success',
      responseCode: 204,
      attemptAt: '2026-02-27T07:18:00.000Z',
    },
    {
      eventType: 'organization.member_removed',
      status: 'failure',
      responseCode: 400,
      attemptAt: '2026-02-27T06:59:00.000Z',
    },
    {
      eventType: 'organization.updated',
      status: 'skipped',
      attemptAt: '2026-02-27T06:40:00.000Z',
    },
    {
      eventType: 'project.paused',
      status: 'success',
      responseCode: 200,
      attemptAt: '2026-02-27T06:21:00.000Z',
    },
    {
      eventType: 'project.created',
      status: 'failure',
      responseCode: 503,
      attemptAt: '2026-02-27T06:03:00.000Z',
    },
    {
      eventType: 'project.updated',
      status: 'success',
      responseCode: 200,
      attemptAt: '2026-02-27T05:44:00.000Z',
    },
    {
      eventType: 'project.deleted',
      status: 'skipped',
      attemptAt: '2026-02-27T05:25:00.000Z',
    },
    {
      eventType: 'organization.member_invited',
      status: 'success',
      responseCode: 201,
      attemptAt: '2026-02-27T05:07:00.000Z',
    },
  ]
)

const organizationSecondaryDeliveries = createDeliveries(
  '1a4e8c73-5b29-44af-8c62-9f1d2b3c4d5e',
  'org-secondary-delivery',
  [
    {
      eventType: 'organization.updated',
      status: 'skipped',
      attemptAt: '2026-02-26T14:12:00.000Z',
    },
  ]
)

const projectDeliveries = createDeliveries(
  '3c9b7e21-8d54-4f63-b2a1-6e7d8c9f0a12',
  'project-delivery',
  [
    {
      eventType: 'project.updated',
      status: 'success',
      responseCode: 200,
      attemptAt: '2026-02-27T09:01:00.000Z',
    },
    {
      eventType: 'project.resource_exhausted',
      status: 'failure',
      responseCode: 429,
      attemptAt: '2026-02-27T08:47:00.000Z',
    },
    {
      eventType: 'project.paused',
      status: 'success',
      responseCode: 202,
      attemptAt: '2026-02-26T21:10:00.000Z',
    },
    {
      eventType: 'project.branch_created',
      status: 'success',
      responseCode: 200,
      attemptAt: '2026-02-26T19:45:00.000Z',
    },
    {
      eventType: 'project.resumed',
      status: 'pending',
      attemptAt: '2026-02-26T18:30:00.000Z',
    },
    {
      eventType: 'project.branch_deleted',
      status: 'success',
      responseCode: 204,
      attemptAt: '2026-02-26T17:04:00.000Z',
    },
    {
      eventType: 'project.updated',
      status: 'failure',
      responseCode: 500,
      attemptAt: '2026-02-26T15:59:00.000Z',
    },
    {
      eventType: 'project.resource_exhausted',
      status: 'skipped',
      attemptAt: '2026-02-26T14:12:00.000Z',
    },
  ]
)

export const PLATFORM_WEBHOOKS_MOCK_DATA: Record<WebhookScope, PlatformWebhooksMockSeed> = {
  organization: {
    eventTypes: [
      'organization.member_invited',
      'organization.member_removed',
      'organization.updated',
      'project.created',
      'project.updated',
      'project.deleted',
      'project.paused',
      'project.resumed',
    ],
    endpoints: [
      {
        id: '7f2c9d4a-6e31-4d9d-9a1f-2c4b5e6f7081',
        name: 'Lovable production',
        url: 'https://api.lovable.dev/webhooks/supabase',
        description: 'Primary organization webhook endpoint',
        enabled: true,
        eventTypes: ['project.created', 'project.updated', 'project.deleted'],
        customHeaders: [
          { id: 'org-header-1', key: 'X-Lovable-Version', value: 'v2' },
          { id: 'org-header-2', key: 'X-Environment', value: 'production' },
        ],
        createdBy: 'user@supabase.io',
        createdAt: '2026-02-15T21:30:00.000Z',
      },
      {
        id: '1a4e8c73-5b29-44af-8c62-9f1d2b3c4d5e',
        name: 'Slack notifications',
        url: 'https://hooks.slack.com/services/abc1234/def5678/ghi9012',
        description: 'Operational alerts for organization-level events',
        enabled: false,
        eventTypes: ['organization.updated'],
        customHeaders: [],
        createdBy: 'ops@supabase.io',
        createdAt: '2026-02-12T10:14:00.000Z',
      },
    ],
    deliveries: [...organizationPrimaryDeliveries, ...organizationSecondaryDeliveries],
  },
  project: {
    eventTypes: [
      'project.updated',
      'project.paused',
      'project.resumed',
      'project.branch_created',
      'project.branch_deleted',
      'project.resource_exhausted',
    ],
    endpoints: [
      {
        id: '3c9b7e21-8d54-4f63-b2a1-6e7d8c9f0a12',
        name: 'Project analytics',
        url: 'https://analytics.example.com/hooks/supabase-project',
        description: 'Project-level status updates for analytics pipeline',
        enabled: true,
        eventTypes: ['project.updated', 'project.resource_exhausted'],
        customHeaders: [{ id: 'project-header-1', key: 'X-Project-Type', value: 'platform' }],
        createdBy: 'owner@project.dev',
        createdAt: '2026-02-18T11:23:00.000Z',
      },
    ],
    deliveries: projectDeliveries,
  },
}
