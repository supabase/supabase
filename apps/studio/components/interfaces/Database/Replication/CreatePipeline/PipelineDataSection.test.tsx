import { fireEvent, screen, waitFor } from '@testing-library/react'
import type { components } from 'api-types'
import { mockAnimationsApi } from 'jsdom-testing-mocks'
import { HttpResponse } from 'msw'
import { useForm } from 'react-hook-form'
import { Form } from 'ui'
import { describe, expect, it, vi } from 'vitest'

import type { DestinationPanelSchemaType } from '../DestinationPanel/DestinationForm/DestinationForm.schema'
import type { DestinationType } from '../DestinationPanel/DestinationPanel.types'
import { PipelineDataSection } from './PipelineDataSection'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

mockAnimationsApi()
type ReplicationSourcesResponse = components['schemas']['SourcesResponse_Output']
type PublicationDetailsResponse = components['schemas']['PublicationDetailsResponse_Output']
type PublicationNamesResponse = components['schemas']['ReadPublicationsResponse_Output']

const mockSources: ReplicationSourcesResponse = {
  sources: [
    {
      id: 1,
      name: 'default',
      tenant_id: 'tenant',
      config: { host: 'db.internal', name: 'main-db', port: 5432, username: 'etl_user' },
    },
  ],
}

const mockPublicationDetails = (publishViaPartitionRoot: boolean): PublicationDetailsResponse => ({
  name: 'analytics',
  config: {
    type: 'tables',
    tables: [],
    operations: ['insert', 'update', 'delete', 'truncate'],
    publish_via_partition_root: publishViaPartitionRoot,
  },
  tables: [],
})

const mockPublicationRequests = (publishViaPartitionRoot: boolean) => {
  addAPIMock({
    method: 'get',
    path: '/platform/replication/:ref/sources',
    response: () => HttpResponse.json<ReplicationSourcesResponse>(mockSources),
  })
  addAPIMock({
    method: 'get',
    path: '/platform/replication/v2/:ref/sources/:source_id/publications',
    response: () =>
      HttpResponse.json<PublicationNamesResponse>({
        publications: [{ name: 'analytics' }],
      }),
  })
  addAPIMock({
    method: 'get',
    path: '/platform/replication/v2/:ref/sources/:source_id/publications/:publication_name',
    response: () =>
      HttpResponse.json<PublicationDetailsResponse>(
        mockPublicationDetails(publishViaPartitionRoot)
      ),
  })
}

const TestSection = ({ type }: { type: DestinationType }) => {
  const form = useForm<DestinationPanelSchemaType>({
    defaultValues: {
      publicationName: 'analytics',
      tableSyncCopyMode: 'include_all_tables',
      tableSyncCopyTableIds: [],
      maxFillMs: 500,
      maxTableSyncWorkers: 4,
      maxCopyConnectionsPerTable: 1,
      invalidatedSlotBehavior: 'error',
      tableOptions: [],
    },
  })
  return (
    <Form {...form}>
      <PipelineDataSection type={type} form={form} onSelectNewPublication={vi.fn()} />
    </Form>
  )
}

describe('PipelineDataSection', () => {
  it.each<DestinationType>(['BigQuery', 'DuckLake', 'Snowflake', 'ClickHouse', 'Analytics Bucket'])(
    'groups %s publication, initial sync and replication settings without connection fields',
    async (type) => {
      mockPublicationRequests(false)
      customRender(<TestSection type={type} />)
      expect(screen.getByRole('region', { name: 'Data' })).toBeInTheDocument()
      expect(screen.getByText('Initial sync')).toBeInTheDocument()
      await waitFor(() =>
        expect(screen.getByRole('status')).toHaveTextContent(
          'Each partition is replicated separately.'
        )
      )
      fireEvent.click(screen.getByRole('button', { name: /Advanced settings/ }))
      expect(screen.getByLabelText('Batch wait time')).toHaveValue(500)
      expect(screen.getByLabelText('Table sync workers')).toHaveValue(4)
      expect(screen.queryByText('Table layout') !== null).toBe(type === 'BigQuery')
      for (const label of [
        'Pipeline name',
        'Pipeline region',
        'Connection pool size',
        'Maximum staleness',
        'Pool size',
        'Role',
      ]) {
        expect(screen.queryByText(label)).not.toBeInTheDocument()
      }
      fireEvent.change(screen.getByLabelText('Batch wait time'), { target: { value: '750' } })
      fireEvent.click(screen.getByRole('button', { name: /Advanced settings/ }))
      fireEvent.click(screen.getByRole('button', { name: /Advanced settings/ }))
      expect(screen.getByLabelText('Batch wait time')).toHaveValue(750)
    }
  )
})
