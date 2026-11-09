import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ComponentProps } from 'react'
import { describe, expect, it, vi } from 'vitest'

import type { WebhookEndpoint } from './PlatformWebhooks.types'
import { PlatformWebhooksEndpointSheet, toEndpointPayload } from './PlatformWebhooksEndpointSheet'
import { customRender } from '@/tests/lib/custom-render'

const PROJECT_EVENT_TYPES = ['project.updated', 'project.paused']

const createEndpoint = (overrides?: Partial<WebhookEndpoint>): WebhookEndpoint => ({
  id: '3c9b7e21-8d54-4f63-b2a1-6e7d8c9f0a12',
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

const fillInput = async (
  user: ReturnType<typeof userEvent.setup>,
  input: HTMLElement,
  value: string
) => {
  await user.click(input)
  await user.paste(value)
}

const getUrlInput = () => screen.getByPlaceholderText('https://api.example.com/webhooks/supabase')

const findEventTypeCheckbox = (eventType: string) =>
  screen.findByRole('checkbox', {
    name: new RegExp(eventType.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
  })
describe('PlatformWebhooksEndpointSheet', () => {
  it('loads the existing url and description in edit mode', async () => {
    renderEndpointSheet({
      mode: 'edit',
      endpoint: createEndpoint(),
    })

    expect(await screen.findByDisplayValue('https://hooks.example.com/billing')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Invoices and receipts')).toBeInTheDocument()
  })

  it('blocks submit when the endpoint URL is empty', async () => {
    const user = userEvent.setup()
    const { onSubmit } = renderEndpointSheet()

    await user.click(await findEventTypeCheckbox('project.updated'))
    submitForm()

    expect(await screen.findByText('Please provide a URL')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  // URL parsing rules are covered in lib/validation/http-url.test.ts; this only checks the form
  // surfaces the sheet-specific messages.
  it.each([
    ['is malformed', 'https://not a url', 'Please provide a valid URL'],
    [
      'has no protocol',
      'hooks.example.com/billing',
      'Please prefix your URL with http:// or https://',
    ],
  ])('blocks submit when the endpoint URL %s', async (_, url, message) => {
    const user = userEvent.setup()
    const { onSubmit } = renderEndpointSheet()

    await fillInput(user, getUrlInput(), url)
    await user.click(await findEventTypeCheckbox('project.updated'))
    submitForm()

    expect(await screen.findByText(message)).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('clears the event type error after selecting an event and allows submit', async () => {
    const user = userEvent.setup()
    const { onSubmit } = renderEndpointSheet()

    await fillInput(user, getUrlInput(), 'https://hooks.example.com/billing')
    submitForm()

    expect(await screen.findByText('Select at least one event type')).toBeInTheDocument()

    await user.click(await findEventTypeCheckbox('project.updated'))

    await waitFor(() => {
      expect(screen.queryByText('Select at least one event type')).not.toBeInTheDocument()
    })

    submitForm()

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'https://hooks.example.com/billing',
          eventTypes: ['project.updated'],
        }),
        expect.anything()
      )
    )
  })

  it('allows submit when subscribe all is enabled', async () => {
    const user = userEvent.setup()
    const { onSubmit } = renderEndpointSheet()

    await fillInput(user, getUrlInput(), 'https://hooks.example.com/billing')
    await user.click(screen.getByRole('checkbox', { name: /subscribe to all events/i }))
    submitForm()

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          subscribeAll: true,
          eventTypes: PROJECT_EVENT_TYPES,
          url: 'https://hooks.example.com/billing',
        }),
        expect.anything()
      )
    )
  })

  it('submits custom headers added through the shared header editor', async () => {
    const user = userEvent.setup()
    const { onSubmit } = renderEndpointSheet({
      mode: 'edit',
      endpoint: createEndpoint(),
    })

    await user.click(screen.getByRole('button', { name: 'Add header' }))
    await fillInput(user, screen.getByPlaceholderText('Header name'), 'X-Webhook-Secret')
    await fillInput(user, screen.getByPlaceholderText('Header value'), 'super-secret')
    submitForm()

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          customHeaders: [{ key: 'X-Webhook-Secret', value: 'super-secret' }],
        }),
        expect.anything()
      )
    )
  })

  it('blocks submit when a custom header is missing its value', async () => {
    const user = userEvent.setup()
    const { onSubmit } = renderEndpointSheet({
      mode: 'edit',
      endpoint: createEndpoint(),
    })

    await user.click(screen.getByRole('button', { name: 'Add header' }))
    await fillInput(user, screen.getByPlaceholderText('Header name'), 'X-Webhook-Secret')
    submitForm()

    expect(await screen.findByText('Header value is required')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('strips fully empty custom header rows from the payload', () => {
    expect(
      toEndpointPayload({
        url: 'https://hooks.example.com/billing',
        description: '',
        enabled: true,
        subscribeAll: false,
        eventTypes: ['project.updated'],
        customHeaders: [
          { key: 'X-Webhook-Secret', value: 'super-secret' },
          { key: '', value: '' },
        ],
        signingSecret: 'whsec_example',
      })
    ).toEqual(
      expect.objectContaining({
        customHeaders: [{ key: 'X-Webhook-Secret', value: 'super-secret' }],
      })
    )
  })
})
