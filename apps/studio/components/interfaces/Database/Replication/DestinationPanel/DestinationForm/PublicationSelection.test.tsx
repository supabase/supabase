import { screen } from '@testing-library/react'
import type { components } from 'api-types'
import { HttpResponse } from 'msw'
import { useForm } from 'react-hook-form'
import { Form } from 'ui'
import { describe, expect, it, vi } from 'vitest'

import type { DestinationPanelSchemaType } from './DestinationForm.schema'
import { PublicationSelection } from './PublicationSelection'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

type ReplicationSourcesResponse = components['schemas']['SourcesResponse_Output']
type PublicationDetailsResponse = components['schemas']['PublicationDetailsResponse_Output']
type PublicationNamesResponse = components['schemas']['PublicationNamesResponse_Output']

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
        publications: [{ name: 'analytics', tables: [] }],
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

const PublicationSelectionHarness = () => {
  const form = useForm<DestinationPanelSchemaType>({
    defaultValues: { publicationName: 'analytics' },
  })

  return (
    <Form {...form}>
      <PublicationSelection form={form} onSelectNewPublication={vi.fn()} />
    </Form>
  )
}

describe('PublicationSelection', () => {
  it('shows when partition changes use the parent table', async () => {
    mockPublicationRequests(true)

    customRender(<PublicationSelectionHarness />)

    expect(await screen.findByText('Publish changes as the parent table.')).toBeInTheDocument()
  })

  it('shows when partition changes use individual partitions', async () => {
    mockPublicationRequests(false)

    customRender(<PublicationSelectionHarness />)

    expect(await screen.findByText('Publish changes as individual partitions.')).toBeInTheDocument()
  })
})
