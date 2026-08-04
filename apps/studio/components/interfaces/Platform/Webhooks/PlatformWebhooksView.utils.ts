import type { WebhookDeliveryStatus } from './PlatformWebhooks.types'

export const statusBadgeVariant: Record<
  WebhookDeliveryStatus,
  'default' | 'success' | 'destructive'
> = {
  pending: 'default',
  success: 'success',
  failure: 'destructive',
  skipped: 'default',
}

export const formatDate = (value: string) =>
  new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(value)
  )

export const formatEvents = (eventTypes: string[]) =>
  eventTypes.includes('*') ? 'All events (*)' : eventTypes.join(', ')

export const formatDeliveryStatus = (status: WebhookDeliveryStatus) =>
  `${status.charAt(0).toUpperCase()}${status.slice(1)}`

export const responseCodeBadgeVariant = (
  responseCode?: number
): 'default' | 'success' | 'destructive' => {
  if (!responseCode) return 'default'
  if (responseCode >= 200 && responseCode < 300) return 'success'
  if (responseCode >= 400) return 'destructive'
  return 'default'
}
