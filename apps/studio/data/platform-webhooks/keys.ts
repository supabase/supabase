import type { WebhookScopeParams } from './platform-webhooks-fetchers'

const scopeId = (scope: WebhookScopeParams) =>
  scope.scope === 'organization' ? scope.orgSlug : scope.projectRef

export const platformWebhooksKeys = {
  endpoints: (scope: WebhookScopeParams, limit?: number, offset?: number) =>
    ['platform-webhooks', scope.scope, scopeId(scope), 'endpoints', { limit, offset }] as const,
  endpoint: (scope: WebhookScopeParams, id: string | undefined) =>
    ['platform-webhooks', scope.scope, scopeId(scope), 'endpoints', id] as const,
  // Prefix shared by every deliveries query for an endpoint, regardless of page
  // size or cursor. Invalidate with this (not `deliveries`) to catch every page.
  deliveriesList: (scope: WebhookScopeParams, endpointId: string | undefined) =>
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
  ) =>
    [...platformWebhooksKeys.deliveriesList(scope, endpointId), { size, after, before }] as const,
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
