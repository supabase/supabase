import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ComponentProps } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { LogDrainDestinationSheetForm } from './LogDrainDestinationSheetForm'
import { render } from '@/tests/helpers'

const { trackMock, useFlagMock, useLogDrainsQueryMock, useParamsMock, useTrackMock } = vi.hoisted(
  () => ({
    trackMock: vi.fn(),
    useFlagMock: vi.fn(),
    useLogDrainsQueryMock: vi.fn(),
    useParamsMock: vi.fn(),
    useTrackMock: vi.fn(),
  })
)

vi.mock(import('common'), async (importOriginal) => {
  const actual = await importOriginal()

  return {
    ...actual,
    IS_PLATFORM: false,
    useFlag: useFlagMock,
    useParams: useParamsMock,
  }
})

vi.mock(import('@/data/log-drains/log-drains-query'), async (importOriginal) => {
  const actual = await importOriginal()

  return {
    ...actual,
    useLogDrainsQuery: useLogDrainsQueryMock,
  }
})

vi.mock('@/lib/telemetry/track', () => ({
  useTrack: useTrackMock,
}))

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}))

const renderForm = (props?: Partial<ComponentProps<typeof LogDrainDestinationSheetForm>>) => {
  const onOpenChange = vi.fn()
  const onSubmit = vi.fn()

  render(
    <LogDrainDestinationSheetForm
      open
      mode="create"
      isLoading={false}
      onOpenChange={onOpenChange}
      onSubmit={onSubmit}
      defaultValues={{ type: 'webhook' }}
      {...props}
    />
  )

  return { onOpenChange, onSubmit }
}

const submitForm = () =>
  fireEvent.submit(document.getElementById('log-drain-destination-form') as HTMLFormElement)

describe('LogDrainDestinationSheetForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    useFlagMock.mockReturnValue(true)
    useParamsMock.mockReturnValue({ ref: 'project-ref' })
    useLogDrainsQueryMock.mockReturnValue({ data: [] })
    useTrackMock.mockReturnValue(trackMock)
  })

  it('shows the JSON content type header for webhook create mode', async () => {
    renderForm()

    await screen.findByRole('dialog')

    expect(screen.getByDisplayValue('Content-Type')).toBeInTheDocument()
    expect(screen.getByDisplayValue('application/json')).toBeInTheDocument()
  })

  it('shows the protobuf content type header for OTLP create mode', async () => {
    renderForm({
      defaultValues: { type: 'otlp' },
    })

    await screen.findByRole('dialog')

    expect(screen.getByDisplayValue('Content-Type')).toBeInTheDocument()
    expect(screen.getByDisplayValue('application/x-protobuf')).toBeInTheDocument()
  })

  it('submits headers as a record without leaking the internal headerEntries field', async () => {
    const user = userEvent.setup()
    const { onSubmit } = renderForm()

    await screen.findByRole('dialog')

    await user.type(screen.getByPlaceholderText('My Destination'), 'Webhook sink')
    await user.type(
      screen.getByPlaceholderText('https://example.com/log-drain'),
      'https://logs.example.com/ingest'
    )
    await user.click(screen.getByRole('button', { name: 'Add a new header' }))

    const headerNameInputs = screen.getAllByPlaceholderText('Header name')
    const headerValueInputs = screen.getAllByPlaceholderText('Header value')

    await user.type(headerNameInputs[1], 'X-API-Key')
    await user.type(headerValueInputs[1], 'secret-key')

    submitForm()

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'webhook',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': 'secret-key',
        },
      })
    )
    expect(onSubmit.mock.calls[0][0]).not.toHaveProperty('headerEntries')
  })

  it('rejects duplicate header names with an inline field error', async () => {
    const user = userEvent.setup()
    const { onSubmit } = renderForm()

    await screen.findByRole('dialog')

    await user.type(screen.getByPlaceholderText('My Destination'), 'Webhook sink')
    await user.type(
      screen.getByPlaceholderText('https://example.com/log-drain'),
      'https://logs.example.com/ingest'
    )
    await user.click(screen.getByRole('button', { name: 'Add a new header' }))

    const headerNameInputs = screen.getAllByPlaceholderText('Header name')
    const headerValueInputs = screen.getAllByPlaceholderText('Header value')

    await user.type(headerNameInputs[1], 'Content-Type')
    await user.type(headerValueInputs[1], 'application/custom')

    submitForm()

    expect((await screen.findAllByText('Header name already exists')).length).toBeGreaterThan(0)
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('allows fully empty header rows without blocking submit', async () => {
    const user = userEvent.setup()
    const { onSubmit } = renderForm()

    await screen.findByRole('dialog')

    await user.type(screen.getByPlaceholderText('My Destination'), 'Webhook sink')
    await user.type(
      screen.getByPlaceholderText('https://example.com/log-drain'),
      'https://logs.example.com/ingest'
    )
    await user.click(screen.getByRole('button', { name: 'Add a new header' }))

    submitForm()

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'webhook',
        headers: {
          'Content-Type': 'application/json',
        },
      })
    )
    expect(screen.queryByText('undefined')).not.toBeInTheDocument()
  })

  it('shows an inline value error when a header key is entered without a value', async () => {
    const user = userEvent.setup()
    const { onSubmit } = renderForm()

    await screen.findByRole('dialog')

    await user.type(screen.getByPlaceholderText('My Destination'), 'Webhook sink')
    await user.type(
      screen.getByPlaceholderText('https://example.com/log-drain'),
      'https://logs.example.com/ingest'
    )
    await user.click(screen.getByRole('button', { name: 'Add a new header' }))

    const headerNameInputs = screen.getAllByPlaceholderText('Header name')
    await user.type(headerNameInputs[1], 'X-Draft-Only')

    submitForm()

    expect(await screen.findByText('Header value is required')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
    expect(screen.queryByText('undefined')).not.toBeInTheDocument()
  })

  it('shows an inline key error when a header value is entered without a key', async () => {
    const user = userEvent.setup()
    const { onSubmit } = renderForm()

    await screen.findByRole('dialog')

    await user.type(screen.getByPlaceholderText('My Destination'), 'Webhook sink')
    await user.type(
      screen.getByPlaceholderText('https://example.com/log-drain'),
      'https://logs.example.com/ingest'
    )
    await user.click(screen.getByRole('button', { name: 'Add a new header' }))

    const headerValueInputs = screen.getAllByPlaceholderText('Header value')
    await user.type(headerValueInputs[1], 'draft-value')

    submitForm()

    expect(await screen.findByText('Header name is required')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
    expect(screen.queryByText('undefined')).not.toBeInTheDocument()
  })
})
