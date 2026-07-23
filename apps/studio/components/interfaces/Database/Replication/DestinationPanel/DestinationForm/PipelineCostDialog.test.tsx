import { screen } from '@testing-library/react'
import type { components } from 'api-types'
import { HttpResponse } from 'msw'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { PipelineCostDialog } from './PipelineCostDialog'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

type CostEstimateResponse = components['schemas']['CostEstimateResponse']
type ReplicationSourcesResponse = components['schemas']['ReplicationSourcesResponse']

const tables = [
  {
    schema: 'public',
    name: 'orders',
    estimated_bytes: 600_000_000,
    estimated_cost: 0.6,
    is_row_filtered: false,
  },
  {
    schema: 'billing',
    name: 'invoices',
    estimated_bytes: 9_400_000_000,
    estimated_cost: 9.4,
    is_row_filtered: false,
  },
]

let costEstimateTables = tables

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

const publicationTables = [
  { id: 101, schema: 'public', name: 'orders' },
  { id: 202, schema: 'billing', name: 'invoices' },
]

const renderDialog = (
  tableSyncCopy: { type: 'include_tables'; table_ids: number[] } | { type: 'skip_all_tables' }
) => {
  addAPIMock({
    method: 'get',
    path: '/platform/replication/:ref/sources',
    response: () => HttpResponse.json<ReplicationSourcesResponse>(mockSources),
  })
  addAPIMock({
    method: 'get',
    path: '/platform/replication/:ref/sources/:source_id/publications/:publication_name/cost-estimate',
    response: () =>
      HttpResponse.json<CostEstimateResponse>({
        currency: 'usd',
        pipeline: { hourly_cost: 0.05, monthly_cost: 36.5 },
        streaming: { rate_per_gb: 3 },
        table_copy: {
          rate_per_gb: 0.6,
          total_bytes: 10_000_000_000,
          total_cost: 10,
          tables: costEstimateTables,
        },
      }),
  })

  return customRender(
    <PipelineCostDialog
      open
      isConfirming={false}
      publicationName="analytics"
      publicationTables={publicationTables}
      tableSyncCopy={tableSyncCopy}
      onOpenChange={vi.fn()}
      onConfirm={vi.fn()}
    />
  )
}

describe('PipelineCostDialog', () => {
  beforeEach(() => {
    costEstimateTables = tables
  })

  it('shows only the initial-copy tables selected by the policy', async () => {
    renderDialog({ type: 'include_tables', table_ids: [101] })

    expect(await screen.findByText('public.orders')).toBeInTheDocument()
    expect(screen.queryByText('billing.invoices')).not.toBeInTheDocument()
    expect(screen.getAllByText('$0.60')).toHaveLength(3)
    expect(screen.queryByText('$10.00')).not.toBeInTheDocument()
  })

  it('shows a zero initial-copy charge while retaining ongoing rates', async () => {
    renderDialog({ type: 'skip_all_tables' })

    expect(await screen.findByText(/No tables will be initially copied/)).toBeInTheDocument()
    expect(screen.getByText('$0.00')).toBeInTheDocument()
    expect(screen.getByText('$0.05/hour')).toBeInTheDocument()
    expect(screen.getByText('$3.00/GB')).toBeInTheDocument()
    expect(screen.queryByText('public.orders')).not.toBeInTheDocument()
  })

  it('does not show a partial total when a selected table estimate is missing', async () => {
    costEstimateTables = [tables[0]]

    renderDialog({ type: 'include_tables', table_ids: [101, 202] })

    expect(
      await screen.findByText(/estimate is unavailable for one or more selected tables/)
    ).toBeInTheDocument()
    expect(screen.getByText('Unavailable')).toBeInTheDocument()
    expect(screen.queryByText('$0.60')).not.toBeInTheDocument()
  })
})
