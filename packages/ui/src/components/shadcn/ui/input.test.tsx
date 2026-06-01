import { zodResolver } from '@hookform/resolvers/zod'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useForm } from 'react-hook-form'
import { describe, expect, test, vi } from 'vitest'
import * as z from 'zod'

import { Form, FormControl, FormField } from './form'
import { Input } from './input'

describe('Input', () => {
  test('Allows users to enter text', async () => {
    let value = ''
    const handleChange = vi.fn((event) => (value = event.target.value))

    render(<Input aria-label="label" type="text" onChange={handleChange} />)
    await userEvent.type(screen.getByLabelText('label'), 'test')
    await waitFor(() => {
      expect(value).toEqual('test')
    })
  })
  test('Allows users to enter partial numbers', async () => {
    let value = ''
    const handleChange = vi.fn((event) => (value = event.target.value))

    render(<Input aria-label="label" type="number" onChange={handleChange} />)
    await userEvent.type(screen.getByLabelText('label'), '0.123', { delay: 150 })
    await waitFor(() => {
      expect(value).toEqual('0.123')
    })
  })

  test('Allows users to enter partial numbers in react-hook-form context', async () => {
    const handleSubmit = vi.fn()

    const formSchema = z.object({
      test: z.coerce.number(),
    })

    const TestForm = () => {
      const form = useForm({
        defaultValues: { test: '' },
        resolver: zodResolver(formSchema),
      })

      return (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <FormField
              control={form.control}
              name="test"
              render={({ field }) => (
                <FormControl>
                  <Input
                    {...field}
                    aria-label="label"
                    type="number"
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
              )}
            />
            <button>Save</button>
          </form>
        </Form>
      )
    }

    render(<TestForm />)
    await userEvent.type(screen.getByLabelText('label'), '0.123', { delay: 150 })
    await userEvent.click(screen.getByText('Save'))
    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith(
        {
          test: 0.123,
        },
        expect.any(Object)
      )
    })
  })
  test('Allows users to edit number value in react-hook-form context', async () => {
    const handleSubmit = vi.fn()

    const formSchema = z.object({
      test: z.coerce.number().int(),
    })

    const TestForm = () => {
      const form = useForm({
        defaultValues: { test: 123 },
        resolver: zodResolver(formSchema),
      })

      return (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <FormField
              control={form.control}
              name="test"
              render={({ field }) => (
                <FormControl>
                  <Input
                    {...field}
                    aria-label="label"
                    type="number"
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
              )}
            />
            <button>Save</button>
          </form>
        </Form>
      )
    }

    render(<TestForm />)
    await userEvent.type(screen.getByLabelText('label'), '[Backspace][Backspace][Backspace]')
    expect(screen.getByLabelText<HTMLInputElement>('label').value).toEqual('')
    await userEvent.type(screen.getByLabelText('label'), '123', { delay: 150 })
    await userEvent.click(screen.getByText('Save'))
    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith(
        {
          test: 123,
        },
        expect.any(Object)
      )
    })
  })
  test('Update correctly when the form value is updated', async () => {
    const handleSubmit = vi.fn()

    const formSchema = z.object({
      test: z.coerce.number(),
    })

    const TestForm = () => {
      const form = useForm({
        defaultValues: { test: '' },
        resolver: zodResolver(formSchema),
      })

      return (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <FormField
              control={form.control}
              name="test"
              render={({ field }) => (
                <FormControl>
                  <Input
                    {...field}
                    aria-label="label"
                    type="number"
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
              )}
            />
            <button>Save</button>
            <button onClick={() => form.setValue('test', '456')}>Update</button>
          </form>
        </Form>
      )
    }

    render(<TestForm />)
    await userEvent.type(screen.getByLabelText('label'), '0.123', { delay: 150 })
    await userEvent.click(screen.getByText('Update'))
    await waitFor(() => {
      expect(screen.getByLabelText<HTMLInputElement>('label').value).toEqual('456')
    })
  })
  test('Does not update the value when the form value is updated if users are modifying it', async () => {
    const handleSubmit = vi.fn()
    let change: () => void = () => {}

    const formSchema = z.object({
      test: z.coerce.number(),
    })

    const TestForm = () => {
      const form = useForm({
        defaultValues: { test: '' },
        resolver: zodResolver(formSchema),
      })

      change = () => form.setValue('test', '456')

      return (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <FormField
              control={form.control}
              name="test"
              render={({ field }) => (
                <FormControl>
                  <Input
                    {...field}
                    aria-label="label"
                    type="number"
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
              )}
            />
            <button>Save</button>
          </form>
        </Form>
      )
    }

    render(<TestForm />)
    // Typing retain the focus on the input
    await userEvent.type(screen.getByLabelText('label'), '0.123', { delay: 150 })
    // Simulate a form change from outside
    change()
    await waitFor(() => {
      expect(screen.getByLabelText<HTMLInputElement>('label').value).toEqual('0.123')
    })
  })
})
