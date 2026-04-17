import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ComponentProps } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { PLATFORM_WEBHOOKS_MOCK_DATA } from './PlatformWebhooks.mock'
import { PlatformWebhooksEndpointDetails } from './PlatformWebhooksEndpointDetails'

vi.mock('@/components/ui/DataTable/DataTableColumn/DataTableColumnStatusCode', () => ({
  DataTableColumnStatusCode: ({ value }: { value: number }) => <span>{value}</span>,
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
    <button type="button" {...props}>
      {icon}
      {children}
    </button>
  ),
}))

vi.mock('ui-patterns', async () => {
  const actual = await vi.importActual<typeof import('ui-patterns')>('ui-patterns')

  return {
    ...actual,
    TimestampInfo: ({ utcTimestamp, className }: { utcTimestamp: string; className?: string }) => (
      <span className={className}>{utcTimestamp}</span>
    ),
  }
})

describe('PlatformWebhooksEndpointDetails', () => {
  const selectedEndpoint = PLATFORM_WEBHOOKS_MOCK_DATA.organization.endpoints[0]
  const allDeliveries = PLATFORM_WEBHOOKS_MOCK_DATA.organization.deliveries.filter(
    (delivery) => delivery.endpointId === selectedEndpoint.id
  )

  const renderComponent = (
    props?: Partial<ComponentProps<typeof PlatformWebhooksEndpointDetails>>
  ) =>
    render(
      <PlatformWebhooksEndpointDetails
        deliverySearch=""
        filteredDeliveries={allDeliveries}
        selectedEndpoint={selectedEndpoint}
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
    expect(screen.queryByText('organization.member_removed')).not.toBeInTheDocument()

    await user.click(screen.getByLabelText('Next page'))

    expect(screen.getByText('Showing 6 to 10 of 12 deliveries')).toBeInTheDocument()
    expect(screen.getByText('organization.member_removed')).toBeInTheDocument()

    await user.click(screen.getByLabelText('Previous page'))

    expect(screen.getByText('Showing 1 to 5 of 12 deliveries')).toBeInTheDocument()
    expect(screen.queryByText('organization.member_removed')).not.toBeInTheDocument()
  })

  it('sorts deliveries by event type from the header', async () => {
    const user = userEvent.setup()

    renderComponent()

    await user.click(screen.getByRole('button', { name: 'Event type' }))

    expect(screen.getAllByRole('row')[1]).toHaveTextContent('organization.member_invited')

    await user.click(screen.getByRole('button', { name: 'Event type' }))

    expect(screen.getAllByRole('row')[1]).toHaveTextContent('project.updated')
  })

  it('resets to the first page when the delivery search changes', async () => {
    const user = userEvent.setup()
    const projectDeliveries = allDeliveries.filter((delivery) =>
      delivery.eventType.includes('project')
    )
    const { rerender } = renderComponent()

    await user.click(screen.getByLabelText('Next page'))
    expect(screen.getByText('Showing 6 to 10 of 12 deliveries')).toBeInTheDocument()

    rerender(
      <PlatformWebhooksEndpointDetails
        deliverySearch="project"
        filteredDeliveries={projectDeliveries}
        selectedEndpoint={selectedEndpoint}
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
