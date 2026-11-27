import { render, screen } from '@testing-library/react'
import type { ComponentProps } from 'react'
import { TooltipProvider } from 'ui'
import { describe, expect, it, vi } from 'vitest'

import type { WebhookDelivery } from './PlatformWebhooks.types'
import { PlatformWebhooksDeliveryDetailsSheet } from './PlatformWebhooksDeliveryDetailsSheet'

vi.mock('@/components/ui/DataTable/DataTableColumn/DataTableColumnStatusCode', () => ({
  DataTableColumnStatusCode: ({ value }: { value: number }) => <span>{value}</span>,
}))

vi.mock('@/components/ui/ShortcutTooltip', () => ({
  ShortcutTooltip: ({ children }: { children: unknown }) => <>{children}</>,
}))

vi.mock('@/state/shortcuts/useShortcut', () => ({
  useShortcut: vi.fn(),
}))

vi.mock('ui-patterns/TimestampInfo', () => ({
  TimestampInfo: ({ utcTimestamp }: { utcTimestamp: string }) => <span>{utcTimestamp}</span>,
}))

const createDelivery = (overrides: Partial<WebhookDelivery>): WebhookDelivery => ({
  id: 'delivery',
  endpointId: 'endpoint',
  eventId: 'event',
  eventType: 'v1.project.updated',
  eventPayload: {},
  status: 'success',
  responseCode: 200,
  responseBody: null,
  responseHeaders: null,
  attemptAt: '2026-02-27T00:00:00.000Z',
  ...overrides,
})

describe('PlatformWebhooksDeliveryDetailsSheet', () => {
  const renderComponent = (
    props?: Partial<ComponentProps<typeof PlatformWebhooksDeliveryDetailsSheet>>
  ) =>
    render(
      <TooltipProvider>
        <PlatformWebhooksDeliveryDetailsSheet
          deliveryDetailsTab="event"
          deliveryEventPayload="{}"
          deliveryResponsePayload="{}"
          open
          selectedDelivery={createDelivery({})}
          onCopy={vi.fn()}
          onOpenChange={vi.fn()}
          onRetryDelivery={vi.fn()}
          onTabChange={vi.fn()}
          {...props}
        />
      </TooltipProvider>
    )

  it('shows a Test badge in the header for a test delivery', () => {
    renderComponent({
      selectedDelivery: createDelivery({ eventPayload: { is_test: true } }),
    })

    expect(screen.getByText('Test')).toBeInTheDocument()
  })

  it('does not show a Test badge for a real delivery', () => {
    renderComponent({ selectedDelivery: createDelivery({ eventPayload: {} }) })

    expect(screen.queryByText('Test')).not.toBeInTheDocument()
  })
})
