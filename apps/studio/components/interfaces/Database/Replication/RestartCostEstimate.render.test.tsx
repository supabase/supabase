import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { RestartCostEstimate } from './RestartCostEstimate'

const mocks = vi.hoisted(() => ({
  costEstimateQuery: vi.fn(() => ({ data: undefined, isFetching: false })),
}))

vi.mock('@/data/replication/cost-estimate-query', () => ({
  useReplicationCostEstimateQuery: mocks.costEstimateQuery,
}))

describe('RestartCostEstimate', () => {
  it('does not request an estimate when every target skips initial sync', () => {
    render(
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
    expect(mocks.costEstimateQuery).toHaveBeenCalledWith(
      { projectRef: 'project-ref', sourceId: 42, publicationName: 'analytics' },
      { enabled: false }
    )
  })
})
