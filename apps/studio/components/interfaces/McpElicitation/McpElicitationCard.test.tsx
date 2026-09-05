import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import type { ElicitationRequest } from './McpElicitation.types'
import { McpElicitationCard } from './McpElicitationCard'
import { customRender } from '@/tests/lib/custom-render'

const request: ElicitationRequest = {
  tool: 'create_edge_function_secret',
  ref: 'aaaaaaaaaaaaaaaaaaaa',
  project: 'acme-production',
  account: 'ops@example.com',
  keyName: 'OPENAI_API_KEY',
}

const noop = () => {}

const renderCard = (state: Parameters<typeof McpElicitationCard>[0]['state']) =>
  customRender(
    <McpElicitationCard
      state={state}
      isSaving={false}
      onSave={noop}
      onCancel={noop}
      onSwitchAccount={noop}
    />
  )

const secretField = () => screen.getByLabelText<HTMLInputElement>('Secret value')

describe('McpElicitationCard', () => {
  it('does not carry a typed secret across a change of request', async () => {
    const user = userEvent.setup()
    const { rerender } = renderCard({ status: 'form', request })

    await user.type(secretField(), 'sk-for-the-first-request')
    await user.click(screen.getByRole('button', { name: 'Show secret value' }))
    expect(secretField().value).toBe('sk-for-the-first-request')
    expect(secretField().type).toBe('text')

    rerender(
      <McpElicitationCard
        state={{ status: 'form', request: { ...request, keyName: 'RESEND_API_KEY' } }}
        isSaving={false}
        onSave={noop}
        onCancel={noop}
        onSwitchAccount={noop}
      />
    )

    await waitFor(() => expect(screen.getByDisplayValue('RESEND_API_KEY')).toBeInTheDocument())
    expect(secretField().value).toBe('')
    expect(secretField().type).toBe('password')
  })

  it('resets when only the project changes, since a ref can move under one name', async () => {
    const user = userEvent.setup()
    const { rerender } = renderCard({ status: 'form', request })

    await user.type(secretField(), 'sk-for-project-a')

    rerender(
      <McpElicitationCard
        state={{
          status: 'form',
          request: { ...request, ref: 'bbbbbbbbbbbbbbbbbbbb', project: 'acme-production' },
        }}
        isSaving={false}
        onSave={noop}
        onCancel={noop}
        onSwitchAccount={noop}
      />
    )

    await waitFor(() => expect(secretField().value).toBe(''))
  })

  it('keeps what the user typed when the request is unchanged', async () => {
    const user = userEvent.setup()
    const { rerender } = renderCard({ status: 'form', request })

    await user.type(secretField(), 'sk-still-being-typed')

    rerender(
      <McpElicitationCard
        state={{
          status: 'form',
          request: { ...request, existingSecret: { updatedAt: new Date().toISOString() } },
        }}
        isSaving={false}
        onSave={noop}
        onCancel={noop}
        onSwitchAccount={noop}
      />
    )

    expect(await screen.findByText(/already exists/)).toBeInTheDocument()
    expect(secretField().value).toBe('sk-still-being-typed')
  })

  it('blocks an empty submit and explains why, without calling onSave', async () => {
    const onSave = vi.fn()
    customRender(
      <McpElicitationCard
        state={{ status: 'form', request }}
        isSaving={false}
        onSave={onSave}
        onCancel={noop}
        onSwitchAccount={noop}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByText('Enter the key value')).toBeInTheDocument()
    expect(secretField()).toHaveAttribute('aria-invalid', 'true')
    expect(secretField().getAttribute('aria-describedby')).toContain('form-item-message')
    expect(onSave).not.toHaveBeenCalled()
  })

  it('submits the value exactly as typed, with no trimming', async () => {
    const onSave = vi.fn()
    const user = userEvent.setup()
    customRender(
      <McpElicitationCard
        state={{ status: 'form', request }}
        isSaving={false}
        onSave={onSave}
        onCancel={noop}
        onSwitchAccount={noop}
      />
    )

    await user.type(secretField(), '  sk-padded  ')
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => expect(onSave).toHaveBeenCalledWith('  sk-padded  '))
  })
})
