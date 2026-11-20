import type { WebhookScopeParams } from './platform-webhooks-fetchers'

const scopeId = (scope: WebhookScopeParams) =>
  scope.scope === 'organization' ? scope.orgSlug : scope.projectRef

export const platformWebhooksKeys = {
  endpoints: (scope: WebhookScopeParams, limit?: number, offset?: number) =>
    ['platform-webhooks', scope.scope, scopeId(scope), 'endpoints', { limit, offset }] as const,
  endpoint: (scope: WebhookScopeParams, id: string | undefined) =>
    ['platform-webhooks', scope.scope, scopeId(scope), 'endpoints', id] as const,
  // Prefix shared by every paginated deliveries query of an endpoint. Use it to
  // invalidate all pages at once, since `deliveries(...)` also embeds the cursors.
  deliveriesAll: (scope: WebhookScopeParams, endpointId: string | undefined) =>
    [
      'platform-webhooks',
      scope.scope,
      scopeId(scope),
      'endpoints',
      endpointId,
      'deliveries',
    ] as const,
  deliveries: (
    scope: WebhookScopeParams,
    endpointId: string | undefined,
    size?: number,
    after?: string,
    before?: string
  ) => [...platformWebhooksKeys.deliveriesAll(scope, endpointId), { size, after, before }] as const,
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
