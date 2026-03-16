import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ComponentProps } from 'react'
import { customRender } from 'tests/lib/custom-render'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { WebhookEndpoint } from './PlatformWebhooks.types'
import { PlatformWebhooksEndpointSheet } from './PlatformWebhooksEndpointSheet'

const { generateWebhookEndpointNameMock } = vi.hoisted(() => ({
  generateWebhookEndpointNameMock: vi.fn(() => 'winged-envelope'),
}))

vi.mock(import('./PlatformWebhooks.utils'), async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    generateWebhookEndpointName: generateWebhookEndpointNameMock,
  }
})

const PROJECT_EVENT_TYPES = ['project.updated', 'project.paused']

const createEndpoint = (overrides?: Partial<WebhookEndpoint>): WebhookEndpoint => ({
  id: '3c9b7e21-8d54-4f63-b2a1-6e7d8c9f0a12',
  name: 'Billing events',
  url: 'https://hooks.example.com/billing',
  description: 'Invoices and receipts',
  enabled: true,
  eventTypes: ['project.updated'],
  customHeaders: [],
  createdBy: 'user@supabase.io',
  createdAt: '2026-03-16T00:00:00.000Z',
  ...overrides,
})

const renderEndpointSheet = (
  props?: Partial<ComponentProps<typeof PlatformWebhooksEndpointSheet>>
) => {
  const onClose = vi.fn()
  const onSubmit = vi.fn()

  customRender(
    <PlatformWebhooksEndpointSheet
      visible
      mode="create"
      scope="project"
      eventTypes={PROJECT_EVENT_TYPES}
      onClose={onClose}
      onSubmit={onSubmit}
      {...props}
    />
  )

  return { onClose, onSubmit }
}

describe('PlatformWebhooksEndpointSheet', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('prefills the name field when creating an endpoint', async () => {
    renderEndpointSheet()

    expect(await screen.findByDisplayValue('winged-envelope')).toBeInTheDocument()
  })

  it('loads the existing name and description in edit mode', async () => {
    renderEndpointSheet({
      mode: 'edit',
      endpoint: createEndpoint(),
    })

    expect(await screen.findByDisplayValue('Billing events')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Invoices and receipts')).toBeInTheDocument()
  })

  it('submits an empty name when an existing name is cleared', async () => {
    const user = userEvent.setup()
    const { onSubmit } = renderEndpointSheet({
      mode: 'edit',
      endpoint: createEndpoint(),
    })

    const nameInput = await screen.findByDisplayValue('Billing events')
    await user.clear(nameInput)
    fireEvent.submit(document.getElementById('platform-webhook-endpoint-form')!)

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        name: '',
        url: 'https://hooks.example.com/billing',
        description: 'Invoices and receipts',
      }),
      expect.anything()
    )
  })
})
