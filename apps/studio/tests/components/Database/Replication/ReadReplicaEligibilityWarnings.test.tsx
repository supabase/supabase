import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { ReadReplicaEligibilityWarnings } from '@/components/interfaces/Database/Replication/DestinationPanel/ReadReplicaForm/ReadReplicaEligibilityWarnings'
import { useCheckEligibilityDeployReplica } from '@/components/interfaces/Database/Replication/DestinationPanel/ReadReplicaForm/useCheckEligibilityDeployReplica'
import { READ_REPLICAS_MAX_COUNT } from '@/data/read-replicas/replicas-query'
import { customRender } from '@/tests/lib/custom-render'

vi.mock(
  '@/components/interfaces/Database/Replication/DestinationPanel/ReadReplicaForm/useCheckEligibilityDeployReplica'
)
vi.mock('@/data/projects/project-detail-query', () => ({
  useProjectDetailQuery: () => ({ data: undefined, isSuccess: false }),
}))
vi.mock('@/data/database/enable-physical-backups-mutation', () => ({
  useEnablePhysicalBackupsMutation: () => ({ mutate: vi.fn(), isPending: false }),
}))
vi.mock('@/hooks/misc/useSelectedOrganization', () => ({
  useSelectedOrganizationQuery: () => ({ data: { slug: 'test-org' } }),
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
  it('shows upgrade CTA when project is on pico, nano, or micro compute', () => {
    vi.mocked(useCheckEligibilityDeployReplica).mockReturnValue(
      eligibility({ isBelowSmallCompute: true })
    )

    customRender(<ReadReplicaEligibilityWarnings />)

    expect(
      screen.getByText('Project required to at least be on a Small compute')
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        "This is to ensure that read replicas can keep up with the primary databases' activities."
      )
    ).toBeInTheDocument()
  })
})

describe('ReadReplicaEligibilityWarnings – max replicas reached', () => {
  it('shows upsell to upgrade compute when below the default cap (e.g. ci_small/medium/large → 4 replicas)', () => {
    vi.mocked(useCheckEligibilityDeployReplica).mockReturnValue(
      eligibility({ isReachedMaxReplicas: true, maxNumberOfReplicas: 4 })
    )

    customRender(<ReadReplicaEligibilityWarnings />)

    expect(
      screen.getByText('You can only deploy up to 4 read replicas at once')
    ).toBeInTheDocument()
    expect(screen.getByText(/you may deploy up to/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /change compute size/i })).toBeInTheDocument()
  })

  it('does NOT show the compute upsell when already at the default cap (XL+)', () => {
    vi.mocked(useCheckEligibilityDeployReplica).mockReturnValue(
      eligibility({ isReachedMaxReplicas: true, maxNumberOfReplicas: READ_REPLICAS_MAX_COUNT })
    )

    customRender(<ReadReplicaEligibilityWarnings />)

    expect(
      screen.getByText(`You can only deploy up to ${READ_REPLICAS_MAX_COUNT} read replicas at once`)
    ).toBeInTheDocument()
    expect(screen.queryByText(/you may deploy up to/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/XL compute or higher/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /change compute size/i })).not.toBeInTheDocument()
  })
})
