import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ComponentProps } from 'react'
import { describe, expect, it, vi } from 'vitest'

import type { WebhookDelivery, WebhookEndpoint } from './PlatformWebhooks.types'
import { PlatformWebhooksEndpointDetails } from './PlatformWebhooksEndpointDetails'
import type { ResponseError } from '@/types'

vi.mock('@/components/ui/DataTable/DataTableColumn/DataTableColumnStatusCode', () => ({
  DataTableColumnStatusCode: ({ value }: { value: number }) => <span>{value}</span>,
}))

vi.mock('@/components/ui/AlertError', () => ({
  AlertError: ({ subject }: { subject: string }) => <p>{subject}</p>,
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
  eventPayload: {},
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
        deliveriesError={null}
        deliverySearch=""
        filteredDeliveries={allDeliveries.slice(0, 5)}
        hasNextPage={false}
        hasPreviousPage={false}
        isLoadingDeliveries={false}
        selectedEndpoint={selectedEndpoint}
        onCopyUrl={vi.fn()}
        onDeliverySearchChange={vi.fn()}
        onNextPage={vi.fn()}
        onPreviousPage={vi.fn()}
        onOpenDelivery={vi.fn()}
        onRetryDelivery={vi.fn()}
        {...props}
      />
    )

  it('shows every delivery it is given, without slicing them into pages', () => {
    renderComponent()

    expect(screen.getByText('Showing 5 deliveries')).toBeInTheDocument()
    expect(screen.getByText('2026-02-27T08:04:00.000Z')).toBeInTheDocument()
  })

  it('disables both pagination buttons when there is no next or previous page', () => {
    renderComponent({ hasNextPage: false, hasPreviousPage: false })

    expect(screen.getByLabelText('Previous page')).toBeDisabled()
    expect(screen.getByLabelText('Next page')).toBeDisabled()
  })

  it('calls onNextPage and onPreviousPage from the pagination buttons', async () => {
    const user = userEvent.setup()
    const onNextPage = vi.fn()
    const onPreviousPage = vi.fn()

    renderComponent({ hasNextPage: true, hasPreviousPage: true, onNextPage, onPreviousPage })

    await user.click(screen.getByLabelText('Next page'))
    expect(onNextPage).toHaveBeenCalledTimes(1)

    await user.click(screen.getByLabelText('Previous page'))
    expect(onPreviousPage).toHaveBeenCalledTimes(1)
  })

  it('keeps the pagination controls when search filters the current page to nothing', () => {
    renderComponent({ filteredDeliveries: [], hasNextPage: true })

    expect(screen.getByLabelText('Next page')).toBeEnabled()
  })

  it('shows five skeleton rows instead of the empty state while deliveries load', () => {
    const { container } = renderComponent({ filteredDeliveries: [], isLoadingDeliveries: true })

    // 5 skeleton rows in the table body plus 1 in the footer
    expect(container.querySelectorAll('.shimmering-loader')).toHaveLength(6)
    expect(screen.queryByText('No deliveries found')).not.toBeInTheDocument()
    expect(screen.queryByText(/^Showing/)).not.toBeInTheDocument()
  })

  it('shows an error instead of the empty state when deliveries fail to load', () => {
    renderComponent({
      filteredDeliveries: [],
      deliveriesError: { message: 'Something went wrong' } as ResponseError,
    })

    expect(screen.getByText(/Failed to retrieve deliveries/)).toBeInTheDocument()
    expect(screen.queryByText('No deliveries found')).not.toBeInTheDocument()
  })

  it('keeps showing deliveries when a refetch fails after they loaded', () => {
    renderComponent({ deliveriesError: { message: 'Something went wrong' } as ResponseError })

    expect(screen.getByText('Showing 5 deliveries')).toBeInTheDocument()
    expect(screen.queryByText(/Failed to retrieve deliveries/)).not.toBeInTheDocument()
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
