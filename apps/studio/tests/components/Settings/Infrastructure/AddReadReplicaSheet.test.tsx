import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, test, vi } from 'vitest'

import { AddReadReplicaSheet } from '@/components/interfaces/Settings/Infrastructure/ReadReplicas/AddReadReplicaSheet'
import { customRender } from '@/tests/lib/custom-render'

vi.mock('@/components/interfaces/Settings/Infrastructure/ReadReplicas/ReadReplicaForm', () => ({
  ReadReplicaForm: ({ onRecommendCompute }: { onRecommendCompute: (size: 'ci_small') => void }) => (
      <button type="button" tabIndex={0} onClick={() => onRecommendCompute('ci_small')}>
      Change to Small compute
    </button>
  ),
}))

describe('AddReadReplicaSheet', () => {
  test('hands the recommendation off after closing the sheet', async () => {
    const user = userEvent.setup()
    const onRecommendCompute = vi.fn()

    customRender(<AddReadReplicaSheet onRecommendCompute={onRecommendCompute} />, {
      nuqs: { searchParams: { addReplica: 'true' } },
    })

    await user.click(screen.getByRole('button', { name: 'Change to Small compute' }))

    await waitFor(() => expect(onRecommendCompute).toHaveBeenCalledWith('ci_small'))
  })
})
