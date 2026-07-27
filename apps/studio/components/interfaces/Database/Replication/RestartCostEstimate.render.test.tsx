import { screen } from '@testing-library/react'
import type { components } from 'api-types'
import { HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'

import { RestartCostEstimate } from './RestartCostEstimate'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

type CostEstimateResponse = components['schemas']['CostEstimateResponse']

describe('RestartCostEstimate', () => {
  it('does not request an estimate when every target skips initial sync', () => {
    const costEstimateRequest = vi.fn(() =>
      HttpResponse.json<CostEstimateResponse>({
        currency: 'usd',
        pipeline: { hourly_cost: 0.05, monthly_cost: 36.5 },
        streaming: { rate_per_gb: 3 },
        table_copy: { rate_per_gb: 0.6, total_bytes: 0, total_cost: 0, tables: [] },
      })
    )
    addAPIMock({
      method: 'get',
      path: '/platform/replication/:ref/sources/:source_id/publications/:publication_name/cost-estimate',
      response: costEstimateRequest,
    })

    customRender(
      <RestartCostEstimate
        open
        projectRef="project-ref"
        sourceId={42}
        publicationName="analytics"
        tables={[]}
      />
    )

    expect(screen.getByText('No additional initial sync charge')).toBeInTheDocument()
    expect(screen.getByText('$0.00')).toBeInTheDocument()
    expect(costEstimateRequest).not.toHaveBeenCalled()
  })
})
