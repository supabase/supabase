import { screen, waitFor } from '@testing-library/react'
import type { components } from 'api-types'
import { HttpResponse } from 'msw'
import { useForm } from 'react-hook-form'
import { Form } from 'ui'
import { describe, expect, it, vi } from 'vitest'

import type { DestinationPanelSchemaType } from './DestinationForm.schema'
import { PublicationSelection } from './PublicationSelection'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock, type APIErrorBody } from '@/tests/lib/msw'

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
  it('includes parent-table partition handling in the publication description', async () => {
    mockPublicationRequests(true)
    customRender(<PublicationSelectionHarness />)

    expect(screen.getByRole('status')).toHaveTextContent('Loading partition handling...')

    await waitFor(() =>
      expect(
        screen.getByText(
          'Tables in the selected publication will be replicated to this destination. Partitioned tables use the parent table identity.'
        )
      ).toBeInTheDocument()
    )
    expect(screen.queryByRole('textbox', { name: 'Postgres partition handling' })).toBeNull()
    expect(screen.getByRole('status')).toHaveTextContent(
      'Partitioned tables use the parent table identity.'
    )
  })

  it('includes separate-partition handling in the publication description', async () => {
    mockPublicationRequests(false)
    customRender(<PublicationSelectionHarness />)

    await waitFor(() =>
      expect(
        screen.getByText(
          'Tables in the selected publication will be replicated to this destination. Each partition is replicated separately.'
        )
      ).toBeInTheDocument()
    )
    expect(screen.getByRole('status')).toHaveTextContent('Each partition is replicated separately.')
  })

  it('shows unavailable when no source matches the project', async () => {
    addAPIMock({
      method: 'get',
      path: '/platform/replication/:ref/sources',
      response: () =>
        HttpResponse.json<ReplicationSourcesResponse>({
          sources: [{ ...mockSources.sources[0], name: 'another-project' }],
        }),
    })
    customRender(<PublicationSelectionHarness />)

    expect(
      await screen.findByText(
        'Tables in the selected publication will be replicated to this destination. Partition handling could not be loaded.'
      )
    ).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Partition handling could not be loaded.')
  })

  it('shows unavailable when the sources query fails', async () => {
    addAPIMock({
      method: 'get',
      path: '/platform/replication/:ref/sources',
      response: () =>
        HttpResponse.json<APIErrorBody>(
          { message: 'replication API URL is not configured' },
          { status: 503 }
        ),
    })
    customRender(<PublicationSelectionHarness />)

    expect(
      await screen.findByText(
        'Tables in the selected publication will be replicated to this destination. Partition handling could not be loaded.'
      )
    ).toBeInTheDocument()
  })
})
