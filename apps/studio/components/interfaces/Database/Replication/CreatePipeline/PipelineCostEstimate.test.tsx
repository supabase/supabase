import { screen } from '@testing-library/react'
import { describe, expect, test } from 'vitest'

import { PipelineCostEstimate } from './PipelineCostEstimate'
import type { ReplicationCostEstimateData } from '@/data/replication/cost-estimate-query'
import { customRender } from '@/tests/lib/custom-render'

const estimate = {
  currency: 'usd',
  pipeline: { hourly_cost: 0.05, monthly_cost: 36.5 },
  streaming: { rate_per_gb: 3 },
  table_copy: {
    rate_per_gb: 0.6,
    total_bytes: 10_000_000_000,
    total_cost: 10,
    tables: [
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
    ],
  },
} satisfies ReplicationCostEstimateData

const publicationTables = [
  { id: 101, schema: 'public', name: 'orders' },
  { id: 202, schema: 'billing', name: 'invoices' },
]

describe('PipelineCostEstimate', () => {
  test('shows the selected initial sync tables and ongoing rates inline', () => {
    customRender(
      <PipelineCostEstimate
        estimate={estimate}
        isLoading={false}
        isError={false}
        publicationTables={publicationTables}
        tableSyncCopy={{ type: 'include_tables', table_ids: [101] }}
      />
    )

    expect(screen.getByRole('heading', { name: 'Estimated costs' })).toBeInTheDocument()
    expect(screen.getByText('public.orders')).toBeInTheDocument()
    expect(screen.queryByText('billing.invoices')).not.toBeInTheDocument()
    expect(screen.getByText('$0.05/hour')).toBeInTheDocument()
    expect(screen.getByText('$3.00/GB')).toBeInTheDocument()
  })

  test('keeps pipeline creation available when the estimate is unavailable', () => {
    customRender(
      <PipelineCostEstimate isLoading={false} isError publicationTables={publicationTables} />
    )

    expect(
      screen.getByText('A cost estimate is unavailable. You can still start the pipeline.')
    ).toBeInTheDocument()
  })
})
