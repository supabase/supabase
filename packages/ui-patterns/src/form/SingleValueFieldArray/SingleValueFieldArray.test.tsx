import { zodResolver } from '@hookform/resolvers/zod'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useForm } from 'react-hook-form'
import { describe, expect, it, vi } from 'vitest'
import { z } from 'zod'

import { Button, Form_Shadcn_ } from 'ui'

import { SingleValueFieldArray } from './SingleValueFieldArray'

const valueSchema = z.object({
  urls: z.array(
    z.object({
      value: z.string().min(1, 'URL is required'),
    })
  ),
})

const nameSchema = z.object({
  domains: z.array(
    z.object({
      id: z.string(),
      domain: z.string().min(1, 'Domain is required'),
    })
  ),
})

type ValueFormValues = z.infer<typeof valueSchema>
type NameFormValues = z.infer<typeof nameSchema>

const ValueForm = ({
  defaultValues = { urls: [] },
  onSubmit = vi.fn(),
}: {
  defaultValues?: ValueFormValues
  onSubmit?: (values: ValueFormValues) => void
}) => {
  const form = useForm<ValueFormValues>({
    resolver: zodResolver(valueSchema),
    defaultValues,
  })

  return (
    <Form_Shadcn_ {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <SingleValueFieldArray
          control={form.control}
          name="urls"
          valueFieldName="value"
          createEmptyRow={() => ({ value: '' })}
          placeholder="https://example.com/callback"
          addLabel="Add URL"
          removeLabel="Remove URL"
          minimumRows={1}
        />
        <Button htmlType="submit">Submit</Button>
      </form>
    </Form_Shadcn_>
  )
}

const NameForm = ({ onSubmit = vi.fn() }: { onSubmit?: (values: NameFormValues) => void }) => {
  const form = useForm<NameFormValues>({
    resolver: zodResolver(nameSchema),
    defaultValues: {
      domains: [{ id: 'row-1', domain: 'example.com' }],
    },
  })

  return (
    <Form_Shadcn_ {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <SingleValueFieldArray
          control={form.control}
          name="domains"
          valueFieldName="domain"
          createEmptyRow={() => ({ id: crypto.randomUUID(), domain: '' })}
          placeholder="example.com"
          addLabel="Add domain"
          removeLabel="Remove domain"
          minimumRows={1}
        />
        <Button htmlType="submit">Submit</Button>
      </form>
    </Form_Shadcn_>
  )
}

describe('SingleValueFieldArray', () => {
  it('appends an empty row', async () => {
    const user = userEvent.setup()

    render(<ValueForm defaultValues={{ urls: [{ value: '' }] }} />)

    await user.click(screen.getByRole('button', { name: 'Add URL' }))

    expect(screen.getAllByPlaceholderText('https://example.com/callback')).toHaveLength(2)
  })

  it('removes a row', async () => {
    const user = userEvent.setup()

    render(
      <ValueForm defaultValues={{ urls: [{ value: 'https://example.com' }, { value: '' }] }} />
    )

    expect(screen.getAllByPlaceholderText('https://example.com/callback')).toHaveLength(2)

    await user.click(screen.getAllByRole('button', { name: 'Remove URL' })[1])

    expect(screen.getAllByPlaceholderText('https://example.com/callback')).toHaveLength(1)
  })

  it('renders and submits value field names', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()

    render(<ValueForm defaultValues={{ urls: [{ value: '' }] }} onSubmit={onSubmit} />)

    await user.type(
      screen.getByPlaceholderText('https://example.com/callback'),
      'https://example.com/auth'
    )
    await user.click(screen.getByRole('button', { name: 'Submit' }))

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        { urls: [{ value: 'https://example.com/auth' }] },
        expect.anything()
      )
    )
  })

  it('renders and submits custom field names while preserving row ids', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()

    render(<NameForm onSubmit={onSubmit} />)

    await user.click(screen.getByRole('button', { name: 'Submit' }))

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        { domains: [{ id: 'row-1', domain: 'example.com' }] },
        expect.anything()
      )
    )
  })

  it('shows RHF field errors through FormMessage', async () => {
    const user = userEvent.setup()

    render(<ValueForm defaultValues={{ urls: [{ value: '' }] }} />)

    await user.click(screen.getByRole('button', { name: 'Submit' }))

    expect(await screen.findByText('URL is required')).toBeInTheDocument()
  })
})
