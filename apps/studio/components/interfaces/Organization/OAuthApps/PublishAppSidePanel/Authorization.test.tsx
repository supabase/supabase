import { zodResolver } from '@hookform/resolvers/zod'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { SubmitHandler, useForm } from 'react-hook-form'
import { Form } from 'ui'
import { describe, expect, test, vi } from 'vitest'
import z from 'zod'

import { OneTimeWithConfirmToggle } from './Authorization'
import { customRender } from '@/tests/lib/custom-render'

describe('OneTimeWithConfirmToggle', () => {
  const schema = z
    .object({
      thing_to_enable: z.coerce.boolean(),
      thing_to_enable_confirmed: z.coerce.boolean().optional(),
    })
    .superRefine((values, context) => {
      if (values.thing_to_enable && !values.thing_to_enable_confirmed) {
        context.addIssue({
          code: 'custom',
          path: ['thing_to_enable_confirmed'],
          message: 'Please confirm you want to enable the thing',
        })
      }
    })
  type Schema = z.infer<typeof schema>

  const TestForm = ({
    defaultValues,
    onSubmit,
  }: {
    defaultValues: Schema
    onSubmit: SubmitHandler<Schema>
  }) => {
    const form = useForm<Schema>({
      defaultValues,
      resolver: zodResolver(schema),
    })

    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <OneTimeWithConfirmToggle
            control={form.control}
            name="thing_to_enable"
            confirmedName="thing_to_enable_confirmed"
            label="Thing to enable"
            description=""
            warningBody="Careful"
          />
          <button tabIndex={0} type="submit">
            Save
          </button>
        </form>
      </Form>
    )
  }

  test('It requires the confirmation field to be checked when enabled from initially disabled', async () => {
    const onSubmit = vi.fn()
    customRender(
      <TestForm
        defaultValues={{
          thing_to_enable: false,
          thing_to_enable_confirmed: false,
        }}
        onSubmit={onSubmit}
      />
    )

    // Confirmation is hidden initially
    expect(
      screen.queryByLabelText(
        'I understand this is permanent. I can test it on a duplicate app first'
      )
    ).toBeNull()
    fireEvent.click(await screen.findByLabelText('Thing to enable'))
    // Confirmation is now visible
    const confirmCheckbox = await screen.findByLabelText(
      'I understand this is permanent. I can test it on a duplicate app first'
    )
    fireEvent.click(await screen.findByText('Save'))
    await screen.findByText('Please confirm you want to enable the thing')
    expect(onSubmit).not.toHaveBeenCalled()
    fireEvent.click(confirmCheckbox)
    fireEvent.click(await screen.findByText('Save'))
    await waitFor(() => expect(onSubmit).toHaveBeenCalled())
  })

  test('It does not requires the confirmation field to be checked when the field is not enabled', async () => {
    const onSubmit = vi.fn()
    customRender(
      <TestForm
        defaultValues={{
          thing_to_enable: false,
          thing_to_enable_confirmed: false,
        }}
        onSubmit={onSubmit}
      />
    )

    // Confirmation is hidden initially
    expect(
      screen.queryByLabelText(
        'I understand this is permanent. I can test it on a duplicate app first'
      )
    ).toBeNull()
    fireEvent.click(await screen.findByText('Save'))
    await waitFor(() => expect(onSubmit).toHaveBeenCalled())
  })

  test('It does not allow to modify the field nor requires the confirmation field to be checked when the field is initially enabled', async () => {
    const onSubmit = vi.fn()
    customRender(
      <TestForm
        defaultValues={{
          thing_to_enable: true,
          thing_to_enable_confirmed: true,
        }}
        onSubmit={onSubmit}
      />
    )

    // Confirmation is hidden initially
    expect(
      screen.queryByLabelText(
        'I understand this is permanent. I can test it on a duplicate app first'
      )
    ).toBeNull()
    expect(screen.queryByLabelText('Thing to enable')).toBeDisabled()

    fireEvent.click(await screen.findByText('Save'))
    await waitFor(() => expect(onSubmit).toHaveBeenCalled())
  })
})
