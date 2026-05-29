import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ComponentProps } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { WebhookEndpoint } from './PlatformWebhooks.types'
import { PlatformWebhooksEndpointSheet, toEndpointPayload } from './PlatformWebhooksEndpointSheet'
import { customRender } from '@/tests/lib/custom-render'

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

const submitForm = () =>
  fireEvent.submit(document.getElementById('platform-webhook-endpoint-form')!)

const getUrlInput = () => screen.getByPlaceholderText('https://api.example.com/webhooks/supabase')

const findEventTypeCheckbox = (eventType: string) =>
  screen.findByRole('checkbox', {
    name: new RegExp(eventType.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
  })
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
    submitForm()

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

  it('blocks submit when the endpoint URL is empty', async () => {
    const user = userEvent.setup()
    const { onSubmit } = renderEndpointSheet()

    await user.click(await findEventTypeCheckbox('project.updated'))
    submitForm()

    expect(await screen.findByText('Please provide a URL')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('blocks submit when the endpoint URL is malformed', async () => {
    const user = userEvent.setup()
    const { onSubmit } = renderEndpointSheet()

    await user.type(getUrlInput(), 'https://not a url')
    await user.click(await findEventTypeCheckbox('project.updated'))
    submitForm()

    expect(await screen.findByText('Please provide a valid URL')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('blocks submit when the endpoint URL uses an incomplete hostname', async () => {
    const user = userEvent.setup()
    const { onSubmit } = renderEndpointSheet()

    await user.type(getUrlInput(), 'https://webhook')
    await user.click(await findEventTypeCheckbox('project.updated'))
    submitForm()

    expect(await screen.findByText('Please provide a valid URL')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('blocks submit when the endpoint URL does not include a protocol', async () => {
    const user = userEvent.setup()
    const { onSubmit } = renderEndpointSheet()

    await user.type(getUrlInput(), 'hooks.example.com/billing')
    await user.click(await findEventTypeCheckbox('project.updated'))
    submitForm()

    expect(
      await screen.findByText('Please prefix your URL with http:// or https://')
    ).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('shows an error when no event types are selected', async () => {
    const user = userEvent.setup()
    const { onSubmit } = renderEndpointSheet()

    await user.type(getUrlInput(), 'https://hooks.example.com/billing')
    submitForm()

    expect(await screen.findByText('Select at least one event type')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('clears the event type error after selecting an event and allows submit', async () => {
    const user = userEvent.setup()
    const { onSubmit } = renderEndpointSheet()

    await user.type(getUrlInput(), 'https://hooks.example.com/billing')
    submitForm()

    expect(await screen.findByText('Select at least one event type')).toBeInTheDocument()

    await user.click(await findEventTypeCheckbox('project.updated'))

    await waitFor(() => {
      expect(screen.queryByText('Select at least one event type')).not.toBeInTheDocument()
    })

    submitForm()

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'https://hooks.example.com/billing',
        eventTypes: ['project.updated'],
      }),
      expect.anything()
    )
  })

  it('allows submit when subscribe all is enabled', async () => {
    const user = userEvent.setup()
    const { onSubmit } = renderEndpointSheet()

    await user.type(getUrlInput(), 'https://hooks.example.com/billing')
    await user.click(screen.getByRole('checkbox', { name: /subscribe to all events/i }))
    submitForm()

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        subscribeAll: true,
        eventTypes: PROJECT_EVENT_TYPES,
        url: 'https://hooks.example.com/billing',
      }),
      expect.anything()
    )
  })

  it('submits custom headers added through the shared header editor', async () => {
    const user = userEvent.setup()
    const { onSubmit } = renderEndpointSheet({
      mode: 'edit',
      endpoint: createEndpoint(),
    })

    await user.click(screen.getByRole('button', { name: 'Add header' }))
    await user.type(screen.getByPlaceholderText('Header name'), 'X-Webhook-Secret')
    await user.type(screen.getByPlaceholderText('Header value'), 'super-secret')
    submitForm()

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        customHeaders: [{ key: 'X-Webhook-Secret', value: 'super-secret' }],
      }),
      expect.anything()
    )
  })

  it('blocks submit when a custom header is missing its value', async () => {
    const user = userEvent.setup()
    const { onSubmit } = renderEndpointSheet({
      mode: 'edit',
      endpoint: createEndpoint(),
    })

    await user.click(screen.getByRole('button', { name: 'Add header' }))
    await user.type(screen.getByPlaceholderText('Header name'), 'X-Webhook-Secret')
    submitForm()

    expect(await screen.findByText('Header value is required')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('strips fully empty custom header rows from the payload', () => {
    expect(
      toEndpointPayload({
        name: 'Billing events',
        url: 'https://hooks.example.com/billing',
        description: '',
        enabled: true,
        subscribeAll: false,
        eventTypes: ['project.updated'],
        customHeaders: [
          { key: 'X-Webhook-Secret', value: 'super-secret' },
          { key: '', value: '' },
        ],
      })
    ).toEqual(
      expect.objectContaining({
        customHeaders: [{ key: 'X-Webhook-Secret', value: 'super-secret' }],
      })
    )
  })
})
