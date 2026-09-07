import { zodResolver } from '@hookform/resolvers/zod'
import { fireEvent, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useForm } from 'react-hook-form'
import { Button, Form } from 'ui'
import { describe, expect, it } from 'vitest'

import { AdvancedSettings } from './AdvancedSettings'
import {
  DestinationPanelFormSchema,
  type DestinationPanelSchemaType,
} from './DestinationForm.schema'
import { customRender } from '@/tests/lib/custom-render'

const numericFields = [
  { label: 'Batch wait time', initialValue: 10_000 },
  { label: 'Table sync workers', initialValue: 4 },
  { label: 'Initial sync connections per table', initialValue: 4 },
  { label: 'Connection pool size', initialValue: 4 },
  { label: 'Maximum staleness', initialValue: 10 },
]

const TestForm = () => {
  const form = useForm<DestinationPanelSchemaType>({
    resolver: zodResolver(DestinationPanelFormSchema),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: {
      name: 'Warehouse',
      publicationName: 'publication',
      tableSyncCopyMode: 'include_all_tables',
      tableSyncCopyTableIds: [],
      maxFillMs: 10_000,
      maxTableSyncWorkers: 4,
      maxCopyConnectionsPerTable: 4,
      connectionPoolSize: 4,
      maxStalenessMins: 10,
    },
  })
  const { errors } = form.formState

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(() => undefined)}>
        <AdvancedSettings type="BigQuery" form={form} />
        <Button type="submit">Save</Button>
        <output data-testid="table-sync-workers-validity">
          {errors.maxTableSyncWorkers === undefined ? 'valid' : 'invalid'}
        </output>
      </form>
    </Form>
  )
}

describe('AdvancedSettings', () => {
  it.each(numericFields)(
    'allows $label to be cleared and replaced',
    async ({ label, initialValue }) => {
      const user = userEvent.setup()
      customRender(<TestForm />)

      await user.click(screen.getByRole('button', { name: /Advanced settings/ }))

      const input = screen.getByRole('spinbutton', { name: label })
      expect(input).toHaveValue(initialValue)

      await user.clear(input)
      expect(input).toHaveValue(null)

      await user.type(input, '5')
      expect(input).toHaveValue(5)
    }
  )

  it('validates an empty required number on submit, then revalidates on change', async () => {
    const user = userEvent.setup()
    customRender(<TestForm />)

    await user.click(screen.getByRole('button', { name: /Advanced settings/ }))
    const input = screen.getByRole('spinbutton', { name: 'Table sync workers' })

    await user.clear(input)
    expect(screen.getByTestId('table-sync-workers-validity')).toHaveTextContent('valid')

    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(await screen.findByText('invalid', { selector: 'output' })).toBeInTheDocument()

    await user.type(input, '5')
    expect(await screen.findByText('valid', { selector: 'output' })).toBeInTheDocument()
  })
})
