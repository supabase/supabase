import { screen } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'

import { ReadReplicaPricingDialog } from '@/components/interfaces/Settings/Infrastructure/ReadReplicas/ReadReplicaForm/ReadReplicaPricingDialog'
import { customRender } from '@/tests/lib/custom-render'

vi.mock('@/hooks/misc/useSelectedProject', () => ({
  useSelectedProjectQuery: () => ({ data: { cloud_provider: 'AWS' } }),
}))

const replicaCost = {
  isLoading: false,
  totalCost: '$85.94',
  compute: { label: 'Small', cost: '$15.00', priceDescription: '$15/month' },
  disk: { type: 'gp3', label: '125 GB (gp3)', cost: '$15.63' },
  iops: { label: '3,000 IOPS', cost: '$30.00' },
  throughput: { label: '125 MB/s', cost: '$25.31' },
} as const

describe('ReadReplicaPricingDialog', () => {
  test('does not show a partial estimate while pricing data loads', () => {
    customRender(<ReadReplicaPricingDialog replicaCost={{ ...replicaCost, isLoading: true }} />)

    expect(screen.getByText('Estimated additional cost')).toBeInTheDocument()
    expect(screen.queryByText(/Estimated additional cost of/)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'View breakdown' })).toBeDisabled()
  })

  test('shows the estimate once all pricing data is available', () => {
    customRender(<ReadReplicaPricingDialog replicaCost={replicaCost} />)

    expect(screen.getByText('Estimated additional cost of $85.94/month')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'View breakdown' })).toBeEnabled()
  })
})
