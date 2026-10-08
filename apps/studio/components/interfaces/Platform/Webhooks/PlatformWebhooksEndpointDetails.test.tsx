import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ComponentProps } from 'react'
import { describe, expect, it, vi } from 'vitest'

import type { WebhookDelivery, WebhookEndpoint } from './PlatformWebhooks.types'
import { PlatformWebhooksEndpointDetails } from './PlatformWebhooksEndpointDetails'

vi.mock('@/components/ui/DataTable/DataTableColumn/DataTableColumnStatusCode', () => ({
  DataTableColumnStatusCode: ({ value }: { value: number }) => <span>{value}</span>,
}))

vi.mock('@/components/ui/ShortcutTooltip', () => ({
  ShortcutTooltip: ({ children }: { children: unknown }) => <>{children}</>,
}))

vi.mock('@/state/shortcuts/useShortcut', () => ({
  useShortcut: vi.fn(),
}))

vi.mock('@/components/ui/ButtonTooltip', () => ({
  ButtonTooltip: ({
    icon,
    children,
    size: _size,
    tooltip: _tooltip,
    type: _type,
    ...props
  }: any) => (
    <button tabIndex={0} type="button" {...props}>
      {icon}
      {children}
    </button>
  ),
}))

vi.mock('ui-patterns/TimestampInfo', async () => {
  return {
    TimestampInfo: ({ utcTimestamp, className }: { utcTimestamp: string; className?: string }) => (
      <span className={className}>{utcTimestamp}</span>
    ),
  }
})

const SELECTED_ENDPOINT_ID = '7f2c9d4a-6e31-4d9d-9a1f-2c4b5e6f7081'

const selectedEndpoint: WebhookEndpoint = {
  id: SELECTED_ENDPOINT_ID,
  name: 'Lovable production',
  url: 'https://api.lovable.dev/webhooks/supabase',
  description: 'Primary organization webhook endpoint',
  enabled: true,
  eventTypes: ['v1.project.created', 'v1.project.updated'],
  customHeaders: [],
  createdBy: 'user@supabase.io',
  createdAt: '2026-02-15T21:30:00.000Z',
}

const createDelivery = (overrides: Partial<WebhookDelivery>): WebhookDelivery => ({
  id: 'delivery',
  endpointId: SELECTED_ENDPOINT_ID,
  eventId: 'event',
  eventType: 'v1.project.updated',
  status: 'success',
  responseCode: 200,
  responseBody: null,
  responseHeaders: null,
  attemptAt: '2026-02-27T00:00:00.000Z',
  ...overrides,
})

const allDeliveries: WebhookDelivery[] = [
  createDelivery({
    id: 'org-delivery-1',
    eventType: 'project.created',
    status: 'success',
    responseCode: 200,
    attemptAt: '2026-02-27T08:04:00.000Z',
  }),
  createDelivery({
    id: 'org-delivery-2',
    eventType: 'project.updated',
    status: 'failure',
    responseCode: 500,
    attemptAt: '2026-02-27T07:56:00.000Z',
  }),
  createDelivery({
    id: 'org-delivery-3',
    eventType: 'project.deleted',
    status: 'pending',
    responseCode: 0,
    attemptAt: '2026-02-27T07:45:00.000Z',
  }),
  createDelivery({
    id: 'org-delivery-4',
    eventType: 'organization.member_invited',
    status: 'success',
    responseCode: 202,
    attemptAt: '2026-02-27T07:37:00.000Z',
  }),
  createDelivery({
    id: 'org-delivery-5',
    eventType: 'project.resumed',
    status: 'success',
    responseCode: 204,
    attemptAt: '2026-02-27T07:18:00.000Z',
  }),
  createDelivery({
    id: 'org-delivery-6',
    eventType: 'organization.member_removed',
    status: 'failure',
    responseCode: 400,
    attemptAt: '2026-02-27T06:59:00.000Z',
  }),
  createDelivery({
    id: 'org-delivery-7',
    eventType: 'organization.updated',
    status: 'skipped',
    responseCode: 0,
    attemptAt: '2026-02-27T06:40:00.000Z',
  }),
  createDelivery({
    id: 'org-delivery-8',
    eventType: 'project.paused',
    status: 'success',
    responseCode: 200,
    attemptAt: '2026-02-27T06:21:00.000Z',
  }),
  createDelivery({
    id: 'org-delivery-9',
    eventType: 'project.created',
    status: 'failure',
    responseCode: 503,
    attemptAt: '2026-02-27T06:03:00.000Z',
  }),
  createDelivery({
    id: 'org-delivery-10',
    eventType: 'project.updated',
    status: 'success',
    responseCode: 200,
    attemptAt: '2026-02-27T05:44:00.000Z',
  }),
  createDelivery({
    id: 'org-delivery-11',
    eventType: 'project.deleted',
    status: 'skipped',
    responseCode: 0,
    attemptAt: '2026-02-27T05:25:00.000Z',
  }),
  createDelivery({
    id: 'org-delivery-12',
    eventType: 'organization.member_invited',
    status: 'success',
    responseCode: 201,
    attemptAt: '2026-02-27T05:07:00.000Z',
  }),
]

describe('PlatformWebhooksEndpointDetails', () => {
  const renderComponent = (
    props?: Partial<ComponentProps<typeof PlatformWebhooksEndpointDetails>>
  ) =>
    render(
      <PlatformWebhooksEndpointDetails
        deliverySearch=""
        filteredDeliveries={allDeliveries}
        selectedEndpoint={selectedEndpoint}
        onCopyUrl={vi.fn()}
        onDeliverySearchChange={vi.fn()}
        onOpenDelivery={vi.fn()}
        onRetryDelivery={vi.fn()}
        {...props}
      />
    )

  it('renders paginated deliveries with previous and next controls', async () => {
    const user = userEvent.setup()

    renderComponent()

    expect(screen.getByText('Showing 1 to 5 of 12 deliveries')).toBeInTheDocument()
    expect(screen.queryByText('2026-02-27T06:59:00.000Z')).not.toBeInTheDocument()

    await user.click(screen.getByLabelText('Next page'))

    expect(screen.getByText('Showing 6 to 10 of 12 deliveries')).toBeInTheDocument()
    expect(screen.getByText('2026-02-27T06:59:00.000Z')).toBeInTheDocument()

    await user.click(screen.getByLabelText('Previous page'))

    expect(screen.getByText('Showing 1 to 5 of 12 deliveries')).toBeInTheDocument()
    expect(screen.queryByText('2026-02-27T06:59:00.000Z')).not.toBeInTheDocument()
  })

  it('resets to the first page when the delivery search changes', async () => {
    const user = userEvent.setup()
    const projectDeliveries = allDeliveries.filter((delivery) =>
      delivery.eventType?.includes('project')
    )
    const { rerender } = renderComponent()

    await user.click(screen.getByLabelText('Next page'))
    expect(screen.getByText('Showing 6 to 10 of 12 deliveries')).toBeInTheDocument()

    rerender(
      <PlatformWebhooksEndpointDetails
        deliverySearch="project"
        filteredDeliveries={projectDeliveries}
        selectedEndpoint={selectedEndpoint}
        onCopyUrl={vi.fn()}
        onDeliverySearchChange={vi.fn()}
        onOpenDelivery={vi.fn()}
        onRetryDelivery={vi.fn()}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Showing 1 to 5 of 8 deliveries')).toBeInTheDocument()
    })
  })

  it('retries a failed delivery without opening the delivery row', async () => {
    const user = userEvent.setup()
    const onOpenDelivery = vi.fn()
    const onRetryDelivery = vi.fn()

    renderComponent({ onOpenDelivery, onRetryDelivery })

    await user.click(screen.getByLabelText('Retry org-delivery-2'))

    expect(onRetryDelivery).toHaveBeenCalledWith('org-delivery-2')
    expect(onOpenDelivery).not.toHaveBeenCalled()
  })

  it('renders a zero response code instead of the placeholder', () => {
    renderComponent({
      filteredDeliveries: [{ ...allDeliveries[0], id: 'org-delivery-zero', responseCode: 0 }],
    })

    expect(screen.getByText('0')).toBeInTheDocument()
    expect(screen.queryByText('–')).not.toBeInTheDocument()
  })
})
