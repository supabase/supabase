import { zodResolver } from '@hookform/resolvers/zod'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useForm } from 'react-hook-form'
import { describe, expect, it, vi } from 'vitest'
import { z } from 'zod'

import { Button, Form_Shadcn_ } from 'ui'

import { KeyValueFieldArray, type KeyValueFieldArrayAction } from './KeyValueFieldArray'

const keyValueSchema = z.object({
  headers: z.array(
    z.object({
      key: z.string().min(1, 'Header name is required'),
      value: z.string().min(1, 'Header value is required'),
    })
  ),
})

const nameValueSchema = z.object({
  headers: z.array(
    z.object({
      id: z.string(),
      name: z.string().min(1, 'Header name is required'),
      value: z.string().min(1, 'Header value is required'),
    })
  ),
})

type KeyValueFormValues = z.infer<typeof keyValueSchema>
type NameValueFormValues = z.infer<typeof nameValueSchema>

const presetActions: KeyValueFieldArrayAction<KeyValueFormValues['headers'][number]>[] = [
  {
    key: 'auth',
    label: 'Add auth header with secret key',
    description: 'Required if your edge function enforces JWT verification',
    createRows: () => [
      { key: 'Authorization', value: 'Bearer test-secret' },
      { key: 'apikey', value: 'test-secret' },
    ],
  },
  {
    key: 'source',
    label: 'Add custom source header',
    description: 'Useful to verify that the edge function was triggered from this webhook',
    createRows: () => ({ key: 'x-supabase-webhook-source', value: '[Use a secret value]' }),
    separatorAbove: true,
  },
]

const KeyValueForm = ({
  defaultValues = { headers: [] },
  addActions,
  onSubmit = vi.fn(),
}: {
  defaultValues?: KeyValueFormValues
  addActions?: KeyValueFieldArrayAction<KeyValueFormValues['headers'][number]>[]
  onSubmit?: (values: KeyValueFormValues) => void
}) => {
  const form = useForm<KeyValueFormValues>({
    resolver: zodResolver(keyValueSchema),
    defaultValues,
  })

  return (
    <Form_Shadcn_ {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <KeyValueFieldArray
          control={form.control}
          name="headers"
          keyFieldName="key"
          valueFieldName="value"
          createEmptyRow={() => ({ key: '', value: '' })}
          keyPlaceholder="Header name"
          valuePlaceholder="Header value"
          addLabel="Add header"
          addActions={addActions}
          removeLabel="Remove header"
        />
        <Button htmlType="submit">Submit</Button>
      </form>
    </Form_Shadcn_>
  )
}

const NameValueForm = ({
  onSubmit = vi.fn(),
}: {
  onSubmit?: (values: NameValueFormValues) => void
}) => {
  const form = useForm<NameValueFormValues>({
    resolver: zodResolver(nameValueSchema),
    defaultValues: {
      headers: [{ id: 'row-1', name: 'Authorization', value: 'Bearer token' }],
    },
  })

  return (
    <Form_Shadcn_ {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <KeyValueFieldArray
          control={form.control}
          name="headers"
          keyFieldName="name"
          valueFieldName="value"
          createEmptyRow={() => ({ id: crypto.randomUUID(), name: '', value: '' })}
          keyPlaceholder="Header name"
          valuePlaceholder="Header value"
          addLabel="Add header"
          removeLabel="Remove header"
        />
        <Button htmlType="submit">Submit</Button>
      </form>
    </Form_Shadcn_>
  )
}

describe('KeyValueFieldArray', () => {
  it('appends an empty row', async () => {
    const user = userEvent.setup()

    render(<KeyValueForm />)

    await user.click(screen.getByRole('button', { name: 'Add header' }))

    expect(screen.getByPlaceholderText('Header name')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Header value')).toBeInTheDocument()
  })

  it('removes a row', async () => {
    const user = userEvent.setup()

    render(<KeyValueForm defaultValues={{ headers: [{ key: 'x-test', value: '1' }] }} />)

    await user.click(screen.getByRole('button', { name: 'Add header' }))
    expect(screen.getAllByPlaceholderText('Header name')).toHaveLength(2)

    await user.click(screen.getAllByRole('button', { name: 'Remove header' })[1])

    expect(screen.getAllByPlaceholderText('Header name')).toHaveLength(1)
  })

  it('renders and submits key/value field names', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()

    render(
      <KeyValueForm defaultValues={{ headers: [{ key: '', value: '' }] }} onSubmit={onSubmit} />
    )

    await user.type(screen.getByPlaceholderText('Header name'), 'X-Test-Header')
    await user.type(screen.getByPlaceholderText('Header value'), 'test-value')
    await user.click(screen.getByRole('button', { name: 'Submit' }))

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        { headers: [{ key: 'X-Test-Header', value: 'test-value' }] },
        expect.anything()
      )
    )
  })

  it('renders and submits name/value field names while preserving row ids', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()

    render(<NameValueForm onSubmit={onSubmit} />)

    await user.click(screen.getByRole('button', { name: 'Submit' }))

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        {
          headers: [{ id: 'row-1', name: 'Authorization', value: 'Bearer token' }],
        },
        expect.anything()
      )
    )
  })

  it('shows RHF field errors through FormMessage', async () => {
    const user = userEvent.setup()

    render(<KeyValueForm defaultValues={{ headers: [{ key: '', value: '' }] }} />)

    await user.click(screen.getByRole('button', { name: 'Submit' }))

    expect(await screen.findByText('Header name is required')).toBeInTheDocument()
    expect(screen.getByText('Header value is required')).toBeInTheDocument()
  })

  it('supports preset actions that append one or multiple rows', async () => {
    const user = userEvent.setup()

    render(<KeyValueForm addActions={presetActions} />)

    await user.click(screen.getByRole('button', { name: 'Add header options' }))
    await user.click(screen.getByText('Add auth header with secret key'))

    expect(screen.getAllByPlaceholderText('Header name')).toHaveLength(2)

    await user.click(screen.getByRole('button', { name: 'Add header options' }))
    await user.click(screen.getByText('Add custom source header'))

    expect(screen.getAllByPlaceholderText('Header name')).toHaveLength(3)
    expect(screen.getByDisplayValue('Authorization')).toBeInTheDocument()
    expect(screen.getByDisplayValue('apikey')).toBeInTheDocument()
    expect(screen.getByDisplayValue('x-supabase-webhook-source')).toBeInTheDocument()
  })
})
