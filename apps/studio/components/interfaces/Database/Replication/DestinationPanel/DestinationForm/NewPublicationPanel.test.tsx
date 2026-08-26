import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import type { components } from 'api-types'
import { HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'

import { NewPublicationPanel } from './NewPublicationPanel'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

type ReplicationSourcesResponse = components['schemas']['SourcesResponse_Output']
type ReadTablesResponse = components['schemas']['ReadTablesResponse_Output']
type PublicationDetailsResponse = components['schemas']['PublicationDetailsResponse_Output']

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

const mockTables: ReadTablesResponse = {
  tables: [
    {
      id: 17487,
      schema: 'CamelSchema',
      name: 'MixedCaseTable',
      kind: 'table',
      partition_parent_id: null,
    },
  ],
}

const mockPublication: PublicationDetailsResponse = {
  name: 'MixedCasePublication',
  config: {
    type: 'tables',
    tables: [{ id: 17487, columns: null, row_filter: null }],
    operations: ['insert', 'update', 'delete', 'truncate'],
    publish_via_partition_root: true,
  },
  tables: [
    {
      id: 17487,
      schema: 'CamelSchema',
      name: 'MixedCaseTable',
      kind: 'table',
      partition_parent_id: null,
    },
  ],
}

const mockQueries = () => {
  addAPIMock({
    method: 'get',
    path: '/platform/replication/:ref/sources',
    response: mockSources,
  })
  addAPIMock({
    method: 'get',
    path: '/platform/replication/v2/:ref/sources/:source_id/tables',
    response: mockTables,
  })
}

describe('NewPublicationPanel', () => {
  it('shows table names but submits table ids and hides empty-state guidance after selection', async () => {
    mockQueries()
    let requestBody: unknown
    addAPIMock({
      method: 'put',
      path: '/platform/replication/v2/:ref/sources/:source_id/publications/:publication_name',
      response: async ({ request }) => {
        requestBody = await request.json()
        return HttpResponse.json<PublicationDetailsResponse>(mockPublication)
      },
    })

    customRender(<NewPublicationPanel visible onClose={vi.fn()} />)

    expect(
      await screen.findByText('Select at least one table to include in the publication.')
    ).toBeInTheDocument()

    const trigger = screen.getAllByRole('combobox').find((element) => element.tagName === 'BUTTON')!
    fireEvent.click(trigger)
    fireEvent.click(await screen.findByText('CamelSchema.MixedCaseTable'))

    expect(within(trigger).getByText('CamelSchema.MixedCaseTable')).toBeInTheDocument()
    expect(trigger).not.toHaveTextContent('17487')
    expect(
      screen.queryByText('Select at least one table to include in the publication.')
    ).not.toBeInTheDocument()

    fireEvent.change(screen.getByPlaceholderText('Name'), {
      target: { value: 'MixedCasePublication' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Create publication' }))

    await waitFor(() =>
      expect(requestBody).toMatchObject({
        tables: [{ id: 17487 }],
      })
    )
  })
})
