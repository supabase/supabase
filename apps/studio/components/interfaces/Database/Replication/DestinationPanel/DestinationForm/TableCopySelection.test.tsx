import { screen } from '@testing-library/react'
import type { components } from 'api-types'
import { HttpResponse } from 'msw'
import { useForm } from 'react-hook-form'
import { Form } from 'ui'
import { describe, expect, it } from 'vitest'

import type { DestinationPanelSchemaType } from './DestinationForm.schema'
import { TableCopySelection } from './TableCopySelection'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock, type APIErrorBody } from '@/tests/lib/msw'

type ReplicationSourcesResponse = components['schemas']['ReplicationSourcesResponse']
type ReplicationPublicationsResponse = components['schemas']['ReplicationPublicationsResponse']

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

const mockPublications: ReplicationPublicationsResponse = {
  publications: [
    {
      name: 'analytics',
      tables: [
        { id: 101, schema: 'public', name: 'orders' },
        { id: 202, schema: 'billing', name: 'invoices' },
      ],
    },
  ],
}

const mockSourcesEndpoint = () => {
  addAPIMock({
    method: 'get',
    path: '/platform/replication/:ref/sources',
    response: () => HttpResponse.json<ReplicationSourcesResponse>(mockSources),
  })
}

const mockPublicationsSuccess = () => {
  addAPIMock({
    method: 'get',
    path: '/platform/replication/:ref/sources/:source_id/publications',
    response: () => HttpResponse.json<ReplicationPublicationsResponse>(mockPublications),
  })
}

const mockPublicationsError = () => {
  addAPIMock({
    method: 'get',
    path: '/platform/replication/:ref/sources/:source_id/publications',
    response: () => HttpResponse.json<APIErrorBody>({ message: 'Boom' }, { status: 500 }),
  })
}

const mockPublicationsPending = () => {
  addAPIMock({
    method: 'get',
    path: '/platform/replication/:ref/sources/:source_id/publications',
    response: () => new Promise<never>(() => {}),
  })
}

const TableCopySelectionHarness = ({
  editMode,
  mode = 'include_all_tables',
  selectedTableIds = [],
}: {
  editMode: boolean
  mode?: DestinationPanelSchemaType['tableSyncCopyMode']
  selectedTableIds?: string[]
}) => {
  const form = useForm<DestinationPanelSchemaType>({
    defaultValues: {
      name: 'Analytics',
      publicationName: 'analytics',
      tableSyncCopyMode: mode,
      tableSyncCopyTableIds: selectedTableIds,
    },
  })

  return (
    <Form {...form}>
      <TableCopySelection form={form} editMode={editMode} />
    </Form>
  )
}

describe('TableCopySelection', () => {
  it('explains that editing the policy does not recopy synchronized tables', async () => {
    mockSourcesEndpoint()
    mockPublicationsSuccess()

    customRender(<TableCopySelectionHarness editMode />)

    expect(
      await screen.findByText(/will not be re-copied until they require one again/)
    ).toBeInTheDocument()
  })

  it('does not show the edit-mode explanation while creating a pipeline', async () => {
    mockSourcesEndpoint()
    mockPublicationsSuccess()

    customRender(<TableCopySelectionHarness editMode={false} />)

    await screen.findByText('Copy all tables')
    expect(
      screen.queryByText(/will not be re-copied until they require one again/)
    ).not.toBeInTheDocument()
  })

  it('summarizes selective copy choices against the publication table count', async () => {
    mockSourcesEndpoint()
    mockPublicationsSuccess()

    customRender(
      <TableCopySelectionHarness
        editMode={false}
        mode="include_tables"
        selectedTableIds={['101']}
      />
    )

    expect(
      await screen.findByText('1 of 2 publication tables will have their existing rows copied.')
    ).toBeInTheDocument()
  })

  it('blocks selection and explains when publication tables cannot be loaded', async () => {
    mockSourcesEndpoint()
    mockPublicationsError()

    customRender(
      <TableCopySelectionHarness editMode mode="include_tables" selectedTableIds={['101']} />
    )

    expect(await screen.findByText(/Publication tables could not be loaded/)).toBeInTheDocument()
    expect(screen.queryByText(/previously selected table/)).not.toBeInTheDocument()
  })

  it('disables selective table choices while publication tables are loading', async () => {
    mockSourcesEndpoint()
    mockPublicationsPending()

    customRender(
      <TableCopySelectionHarness editMode mode="include_tables" selectedTableIds={['101', '999']} />
    )

    const loadingLabel = await screen.findByText('Loading publication tables...')
    expect(loadingLabel).toBeInTheDocument()
    expect(loadingLabel.closest('button')).toBeDisabled()
    expect(screen.queryByText(/previously selected table/)).not.toBeInTheDocument()
  })
})
