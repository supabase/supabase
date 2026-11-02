import { zodResolver } from '@hookform/resolvers/zod'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import type { components } from 'api-types'
import { HttpResponse } from 'msw'
import { useForm } from 'react-hook-form'
import { Form } from 'ui'
import { beforeEach, describe, expect, it } from 'vitest'

import { AdvancedSettings } from '@/components/interfaces/Database/Replication/DestinationPanel/DestinationForm/AdvancedSettings'
import {
  DestinationPanelFormSchema,
  type DestinationPanelSchemaType,
} from '@/components/interfaces/Database/Replication/DestinationPanel/DestinationForm/DestinationForm.schema'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

type ReplicationSourcesResponse = components['schemas']['SourcesResponse_Output']
type PublicationDetailsResponse = components['schemas']['PublicationDetailsResponse_Output']

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

// Waits for the table layout queries so none are left in flight when the test ends
const renderExpanded = async () => {
  customRender(<TestForm />)
  fireEvent.click(screen.getByRole('button', { name: /Advanced settings/ }))
  await screen.findByText('This publication has no tables.')
}

describe('AdvancedSettings', () => {
  beforeEach(() => {
    addAPIMock({
      method: 'get',
      path: '/platform/replication/:ref/sources',
      response: () =>
        HttpResponse.json<ReplicationSourcesResponse>({
          sources: [
            {
              id: 1,
              name: 'default',
              tenant_id: 'tenant',
              config: { host: 'db.internal', name: 'main-db', port: 5432, username: 'etl_user' },
            },
          ],
        }),
    })
    addAPIMock({
      method: 'get',
      path: '/platform/replication/v2/:ref/sources/:source_id/publications/:publication_name',
      response: () =>
        HttpResponse.json<PublicationDetailsResponse>({
          name: 'publication',
          config: {
            type: 'all_tables',
            operations: ['insert', 'update', 'delete', 'truncate'],
            publish_via_partition_root: false,
          },
          tables: [],
        }),
    })
  })

  // One render for all fields: each field is independent, and re-rendering per field only adds setup cost
  it('allows every numeric field to be cleared and replaced', async () => {
    await renderExpanded()

    for (const { label, initialValue } of numericFields) {
      const input = screen.getByLabelText(label)
      expect(input, label).toHaveValue(initialValue)

      fireEvent.change(input, { target: { value: '' } })
      expect(input, label).toHaveValue(null)

      fireEvent.change(input, { target: { value: '5' } })
      expect(input, label).toHaveValue(5)
    }
  })

  it('uses the existing error while an empty required number is being edited', async () => {
    await renderExpanded()
    const input = screen.getByLabelText('Table sync workers')

    fireEvent.change(input, { target: { value: '' } })
    expect(
      await screen.findByText('Max table sync workers must be greater than 0.')
    ).toBeInTheDocument()

    fireEvent.change(input, { target: { value: '5' } })
    await waitFor(() => {
      expect(
        screen.queryByText('Max table sync workers must be greater than 0.')
      ).not.toBeInTheDocument()
    })
  })
})
