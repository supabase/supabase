import { zodResolver } from '@hookform/resolvers/zod'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useForm } from 'react-hook-form'
import { Form } from 'ui'
import { describe, expect, it } from 'vitest'

import { AdvancedSettings } from '@/components/interfaces/Database/Replication/DestinationPanel/DestinationForm/AdvancedSettings'
import {
  DestinationPanelFormSchema,
  type DestinationPanelSchemaType,
} from '@/components/interfaces/Database/Replication/DestinationPanel/DestinationForm/DestinationForm.schema'
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
    mode: 'onChange',
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
  return (
    <Form {...form}>
      <AdvancedSettings type="BigQuery" form={form} />
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

  it('uses the existing error while an empty required number is being edited', async () => {
    const user = userEvent.setup()
    customRender(<TestForm />)

    await user.click(screen.getByRole('button', { name: /Advanced settings/ }))
    const input = screen.getByRole('spinbutton', { name: 'Table sync workers' })

    await user.clear(input)
    expect(
      await screen.findByText('Max table sync workers must be greater than 0.')
    ).toBeInTheDocument()

    await user.type(input, '5')
    await waitFor(() => {
      expect(
        screen.queryByText('Max table sync workers must be greater than 0.')
      ).not.toBeInTheDocument()
    })
  })
})
