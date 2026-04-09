import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useForm } from 'react-hook-form'
import { Form_Shadcn_ } from 'ui'
import { describe, expect, it } from 'vitest'

import { type WebhookFormValues } from './EditHookPanel.constants'
import { HTTPParameters } from './HTTPParameters'

const HTTPParametersHarness = () => {
  const form = useForm<WebhookFormValues>({
    defaultValues: {
      name: 'test-hook',
      table_id: 'public.messages',
      http_method: 'POST',
      timeout_ms: 1000,
      events: ['INSERT'],
      function_type: 'http_request',
      http_url: 'https://hooks.example.com/webhook',
      httpHeaders: [],
      httpParameters: [{ id: 'param-1', name: 'tenant', value: 'prod' }],
    },
  })

  return (
    <Form_Shadcn_ {...form}>
      <HTTPParameters form={form} />
    </Form_Shadcn_>
  )
}

describe('HTTPParameters', () => {
  it('appends a new parameter row', async () => {
    const user = userEvent.setup()

    render(<HTTPParametersHarness />)

    await user.click(screen.getByRole('button', { name: 'Add a new parameter' }))

    expect(screen.getAllByPlaceholderText('Parameter name')).toHaveLength(2)
    expect(screen.getAllByPlaceholderText('Parameter value')).toHaveLength(2)
  })

  it('removes an existing parameter row', async () => {
    const user = userEvent.setup()

    render(<HTTPParametersHarness />)

    expect(screen.getByDisplayValue('tenant')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Remove parameter' }))

    expect(screen.queryByDisplayValue('tenant')).not.toBeInTheDocument()
  })
})
