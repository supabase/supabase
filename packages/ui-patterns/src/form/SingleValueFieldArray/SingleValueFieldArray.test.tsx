import { zodResolver } from '@hookform/resolvers/zod'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { UserEvent } from '@testing-library/user-event'
import { useForm } from 'react-hook-form'
import { Button, Form } from 'ui'
import { describe, expect, it, vi } from 'vitest'
import { z } from 'zod'

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
  pasteSeparator,
}: {
  defaultValues?: ValueFormValues
  onSubmit?: (values: ValueFormValues) => void
  pasteSeparator?: RegExp
}) => {
  const form = useForm<ValueFormValues>({
    resolver: zodResolver(valueSchema),
    defaultValues,
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <SingleValueFieldArray
          control={form.control}
          name="urls"
          valueFieldName="value"
          createEmptyRow={() => ({ value: '' })}
          pasteSeparator={pasteSeparator}
          placeholder="https://example.com/callback"
          addLabel="Add URL"
          removeLabel="Remove URL"
          minimumRows={1}
        />
        <Button type="submit">Submit</Button>
      </form>
    </Form>
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
    <Form {...form}>
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
        <Button type="submit">Submit</Button>
      </form>
    </Form>
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

  it('expands a multi-value paste into one row per value', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()

    render(
      <ValueForm
        defaultValues={{ urls: [{ value: '' }] }}
        onSubmit={onSubmit}
        pasteSeparator={/[\s,]+/}
      />
    )

    await user.click(screen.getByPlaceholderText('https://example.com/callback'))
    await user.paste('https://a.example.com\nhttps://b.example.com https://c.example.com')

    expect(screen.getAllByPlaceholderText('https://example.com/callback')).toHaveLength(3)

    await user.click(screen.getByRole('button', { name: 'Submit' }))

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        {
          urls: [
            { value: 'https://a.example.com' },
            { value: 'https://b.example.com' },
            { value: 'https://c.example.com' },
          ],
        },
        expect.anything()
      )
    )
  })

  it('inserts pasted values after the row being pasted into', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()

    render(
      <ValueForm
        defaultValues={{ urls: [{ value: '' }, { value: 'https://last.example.com' }] }}
        onSubmit={onSubmit}
        pasteSeparator={/[\s,]+/}
      />
    )

    await user.click(screen.getAllByPlaceholderText('https://example.com/callback')[0])
    await user.paste('https://a.example.com,https://b.example.com')

    await user.click(screen.getByRole('button', { name: 'Submit' }))

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        {
          urls: [
            { value: 'https://a.example.com' },
            { value: 'https://b.example.com' },
            { value: 'https://last.example.com' },
          ],
        },
        expect.anything()
      )
    )
  })

  it('leaves a single-value paste to the browser', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()

    render(
      <ValueForm
        defaultValues={{ urls: [{ value: '' }] }}
        onSubmit={onSubmit}
        pasteSeparator={/[\s,]+/}
      />
    )

    await user.click(screen.getByPlaceholderText('https://example.com/callback'))
    await user.paste('https://a.example.com')

    expect(screen.getAllByPlaceholderText('https://example.com/callback')).toHaveLength(1)

    await user.click(screen.getByRole('button', { name: 'Submit' }))

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        { urls: [{ value: 'https://a.example.com' }] },
        expect.anything()
      )
    )
  })

  describe('pasteSeparator', () => {
    const pasteInto = async (user: UserEvent, text: string) => {
      await user.click(screen.getAllByPlaceholderText('https://example.com/callback')[0])
      await user.paste(text)

      return screen
        .getAllByPlaceholderText('https://example.com/callback')
        .map((input) => (input as HTMLInputElement).value)
    }

    const renderWithSeparator = (separator?: RegExp) =>
      render(<ValueForm defaultValues={{ urls: [{ value: '' }] }} pasteSeparator={separator} />)

    it('does not split when no separator is given, leaving the input to flatten the paste', async () => {
      const user = userEvent.setup()
      renderWithSeparator()

      expect(await pasteInto(user, 'https://a.example.com\nhttps://b.example.com')).toEqual([
        'https://a.example.comhttps://b.example.com',
      ])
    })

    it('splits on line breaks', async () => {
      const user = userEvent.setup()
      renderWithSeparator(/[\s,]+/)

      expect(await pasteInto(user, 'https://a.example.com\nhttps://b.example.com')).toEqual([
        'https://a.example.com',
        'https://b.example.com',
      ])
    })

    it('splits on carriage return line breaks', async () => {
      const user = userEvent.setup()
      renderWithSeparator(/[\s,]+/)

      expect(await pasteInto(user, 'https://a.example.com\r\nhttps://b.example.com')).toEqual([
        'https://a.example.com',
        'https://b.example.com',
      ])
    })

    it('splits on commas', async () => {
      const user = userEvent.setup()
      renderWithSeparator(/[\s,]+/)

      expect(await pasteInto(user, 'https://a.example.com,https://b.example.com')).toEqual([
        'https://a.example.com',
        'https://b.example.com',
      ])
    })

    it('splits on spaces', async () => {
      const user = userEvent.setup()
      renderWithSeparator(/[\s,]+/)

      expect(await pasteInto(user, 'https://a.example.com https://b.example.com')).toEqual([
        'https://a.example.com',
        'https://b.example.com',
      ])
    })

    it('splits on tabs', async () => {
      const user = userEvent.setup()
      renderWithSeparator(/[\s,]+/)

      expect(await pasteInto(user, 'https://a.example.com\thttps://b.example.com')).toEqual([
        'https://a.example.com',
        'https://b.example.com',
      ])
    })

    it('splits on a mix of separators', async () => {
      const user = userEvent.setup()
      renderWithSeparator(/[\s,]+/)

      expect(
        await pasteInto(
          user,
          'https://a.example.com, https://b.example.com\nhttps://c.example.com\t https://d.example.com'
        )
      ).toEqual([
        'https://a.example.com',
        'https://b.example.com',
        'https://c.example.com',
        'https://d.example.com',
      ])
    })

    it('collapses repeated separators instead of creating empty rows', async () => {
      const user = userEvent.setup()
      renderWithSeparator(/[\s,]+/)

      expect(
        await pasteInto(user, 'https://a.example.com,,,\n\n  ,\thttps://b.example.com')
      ).toEqual(['https://a.example.com', 'https://b.example.com'])
    })

    it('ignores leading and trailing separators', async () => {
      const user = userEvent.setup()
      renderWithSeparator(/[\s,]+/)

      expect(
        await pasteInto(user, '\n  https://a.example.com,\nhttps://b.example.com,  \n')
      ).toEqual(['https://a.example.com', 'https://b.example.com'])
    })

    it('trims each value when the separator does not cover whitespace', async () => {
      const user = userEvent.setup()
      renderWithSeparator(/,/)

      expect(await pasteInto(user, ' https://a.example.com , https://b.example.com ')).toEqual([
        'https://a.example.com',
        'https://b.example.com',
      ])
    })

    it('keeps duplicate values as separate rows', async () => {
      const user = userEvent.setup()
      renderWithSeparator(/[\s,]+/)

      expect(await pasteInto(user, 'https://a.example.com\nhttps://a.example.com')).toEqual([
        'https://a.example.com',
        'https://a.example.com',
      ])
    })
  })

  it('shows RHF field errors through FormMessage', async () => {
    const user = userEvent.setup()

    render(<ValueForm defaultValues={{ urls: [{ value: '' }] }} />)

    await user.click(screen.getByRole('button', { name: 'Submit' }))

    expect(await screen.findByText('URL is required')).toBeInTheDocument()
  })
})
