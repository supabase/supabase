import type { WebhookScopeParams } from './platform-webhooks-fetchers'

const scopeId = (scope: WebhookScopeParams) =>
  scope.scope === 'organization' ? scope.orgSlug : scope.projectRef

export const platformWebhooksKeys = {
  endpoints: (scope: WebhookScopeParams, limit?: number, offset?: number) =>
    ['platform-webhooks', scope.scope, scopeId(scope), 'endpoints', limit, offset].filter(
      (value) => value !== undefined
    ),
  endpoint: (scope: WebhookScopeParams, id: string | undefined) =>
    ['platform-webhooks', scope.scope, scopeId(scope), 'endpoints', id] as const,
  deliveries: (
    scope: WebhookScopeParams,
    endpointId: string | undefined,
    size?: number,
    after?: string,
    before?: string
  ) =>
    [
      'platform-webhooks',
      scope.scope,
      scopeId(scope),
      'endpoints',
      endpointId,
      'deliveries',
      size,
      after,
      before,
    ].filter((value) => value !== undefined),
  delivery: (scope: WebhookScopeParams, endpointId: string | undefined, id: string | undefined) =>
    [
      'platform-webhooks',
      scope.scope,
      scopeId(scope),
      'endpoints',
      endpointId,
      'deliveries',
      id,
    ] as const,
}
