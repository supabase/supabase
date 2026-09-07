import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useForm } from 'react-hook-form'
import { Form } from 'ui'
import { describe, expect, it } from 'vitest'

import { AdvancedSettings } from './AdvancedSettings'
import type { DestinationPanelSchemaType } from './DestinationForm.schema'
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
    defaultValues: {
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
})
