import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { ReadReplicaEligibilityWarnings } from '@/components/interfaces/Settings/Infrastructure/ReadReplicas/ReadReplicaForm/ReadReplicaEligibilityWarnings'
import { READ_REPLICAS_MAX_COUNT } from '@/data/read-replicas/replicas-query'
import { customRender } from '@/tests/lib/custom-render'

vi.mock('@/data/projects/project-detail-query', () => ({
  useProjectDetailQuery: () => ({ data: undefined, isSuccess: false }),
}))
vi.mock('@/data/database/enable-physical-backups-mutation', () => ({
  useEnablePhysicalBackupsMutation: () => ({ mutate: vi.fn(), isPending: false }),
}))
vi.mock('@/hooks/misc/useSelectedOrganization', () => ({
  useSelectedOrganizationQuery: () => ({ data: { slug: 'test-org', plan: { id: 'pro' } } }),
}))
vi.mock('@/hooks/misc/useSelectedProject', () => ({
  useSelectedProjectQuery: () => ({ data: { dbVersion: 'supabase-postgres-15.1.0' } }),
}))

const eligibility = (delta: Record<string, unknown>) => ({
  can: false,
  hasOverdueInvoices: false,
  isAWSProvider: true,
  isAwsK8s: false,
  isPgVersionBelow15: false,
  isBelowSmallCompute: false,
  isWalgNotEnabled: false,
  isProWithSpendCapEnabled: false,
  isReachedMaxReplicas: false,
  maxNumberOfReplicas: READ_REPLICAS_MAX_COUNT,
  ...delta,
})

describe('ReadReplicaEligibilityWarnings – below small compute', () => {
  it('recommends Small compute when project is on pico, nano, or micro compute', async () => {
    const user = userEvent.setup()
    const onRecommendCompute = vi.fn()
    const warningEligibility = eligibility({ isBelowSmallCompute: true })

    customRender(
      <ReadReplicaEligibilityWarnings
        eligibility={warningEligibility}
        onRecommendCompute={onRecommendCompute}
      />
    )

    expect(screen.getByText('Small compute required')).toBeInTheDocument()
    expect(
      screen.getByText(/Read replicas require at least Small compute to keep up/)
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Learn more' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Change compute' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Change compute' }))
    expect(onRecommendCompute).toHaveBeenCalledWith('ci_small')
  })
})

describe('ReadReplicaEligibilityWarnings – max replicas reached', () => {
  it('shows upsell to upgrade compute when below the default cap (e.g. ci_small/medium/large → 4 replicas)', () => {
    const warningEligibility = eligibility({ isReachedMaxReplicas: true, maxNumberOfReplicas: 4 })

    customRender(
      <ReadReplicaEligibilityWarnings
        eligibility={warningEligibility}
        onRecommendCompute={vi.fn()}
      />
    )

    expect(
      screen.getByText('You can only deploy up to 4 read replicas at once')
    ).toBeInTheDocument()
    expect(screen.getByText(/you may deploy up to/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /change to xl compute/i })).toBeInTheDocument()
  })

  it('does NOT show the compute upsell when already at the default cap (XL+)', () => {
    const warningEligibility = eligibility({
      isReachedMaxReplicas: true,
      maxNumberOfReplicas: READ_REPLICAS_MAX_COUNT,
    })

    customRender(
      <ReadReplicaEligibilityWarnings
        eligibility={warningEligibility}
        onRecommendCompute={vi.fn()}
      />
    )

    expect(
      screen.getByText(`You can only deploy up to ${READ_REPLICAS_MAX_COUNT} read replicas at once`)
    ).toBeInTheDocument()
    expect(screen.queryByText(/you may deploy up to/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/XL compute or higher/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /change to xl compute/i })).not.toBeInTheDocument()
  })
})
