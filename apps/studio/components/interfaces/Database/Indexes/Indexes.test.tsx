import { screen } from '@testing-library/react'
import { mockAnimationsApi } from 'jsdom-testing-mocks'
import { HttpResponse } from 'msw'
import { beforeEach, describe, expect, test } from 'vitest'

import { Indexes } from './Indexes'
import { ProjectContextProvider } from '@/components/layouts/ProjectLayout/ProjectContext'
import type { DatabaseIndex } from '@/data/database-indexes/indexes-query'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'
import { routerMock } from '@/tests/lib/route-mock'

mockAnimationsApi()

const createIndex = (table: string, name: string): DatabaseIndex => ({
  schema: 'public',
  table,
  name,
  columns: 'id',
  definition: `CREATE INDEX "${name}" ON public."${table}" USING btree (id)`,
})

const renderIndexes = (search: string) =>
  customRender(
    <ProjectContextProvider projectRef="default">
      <Indexes />
    </ProjectContextProvider>,
    { nuqs: { searchParams: { search } } }
  )

describe('Indexes search', () => {
  beforeEach(() => {
    routerMock.setCurrentUrl('/project/default/database/indexes')
    // useSelectedProjectQuery
    addAPIMock({
      method: 'get',
      path: '/platform/projects/:ref',
      // @ts-expect-error partial project is enough for the connection string lookup
      response: {
        cloud_provider: 'localhost',
        id: 1,
        inserted_at: '2021-08-02T06:40:40.646Z',
        name: 'Default Project',
        organization_id: 1,
        ref: 'default',
        region: 'local',
        status: 'ACTIVE_HEALTHY',
      },
    })
    // The indexes, schemas and entity types queries all execute SQL through pg-meta
    addAPIMock({
      method: 'post',
      path: '/platform/pg-meta/:ref/query',
      response: ({ request }) => {
        const key = new URL(request.url).searchParams.get('key') ?? ''
        if (key.startsWith('entity-types')) {
          return HttpResponse.json([{ data: { entities: [], count: 0 } }])
        }
        if (!key.startsWith('indexes')) return HttpResponse.json([{ id: 1, name: 'public' }])
        return HttpResponse.json<DatabaseIndex[]>([
          createIndex('Customers', 'Customers_Email_idx'),
          createIndex('Customers', 'by_email'),
          createIndex('orders', 'orders_status_idx'),
        ])
      },
    })
  })

  test('matches index and table names regardless of letter case', async () => {
    renderIndexes('customers')

    expect(await screen.findByText('Customers_Email_idx')).toBeInTheDocument()
    // Matched through its table name only
    expect(screen.getByText('by_email')).toBeInTheDocument()
    expect(screen.queryByText('orders_status_idx')).not.toBeInTheDocument()
  })

  test('matches a lowercase name when the search is typed in uppercase', async () => {
    renderIndexes('ORDERS_STATUS')

    expect(await screen.findByText('orders_status_idx')).toBeInTheDocument()
    expect(screen.queryByText('Customers_Email_idx')).not.toBeInTheDocument()
  })

  test('shows the empty state when nothing matches', async () => {
    renderIndexes('invoices')

    expect(await screen.findByText('No results found')).toBeInTheDocument()
  })
})
