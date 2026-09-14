import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, test, vi } from 'vitest'

import { AddReadReplicaDialog } from '@/components/interfaces/Settings/Infrastructure/ReadReplicas/AddReadReplicaDialog'
import { customRender } from '@/tests/lib/custom-render'

const { mockReadReplicaForm } = vi.hoisted(() => ({ mockReadReplicaForm: vi.fn() }))

vi.mock('@/components/interfaces/Settings/Infrastructure/ReadReplicas/ReadReplicaForm', () => ({
  ReadReplicaForm: ({
    onClose,
    onRecommendCompute,
  }: {
    onClose: () => void
    onRecommendCompute: (size: 'ci_small') => void
  }) => {
    mockReadReplicaForm()

    return (
      <>
        <button type="button" tabIndex={0} onClick={() => onRecommendCompute('ci_small')}>
          Change compute
        </button>
        <button type="button" tabIndex={0}>
          Change region
        </button>
        <button type="button" tabIndex={0} onClick={onClose}>
          Cancel
        </button>
      </>
    )
  },
}))

const renderDialog = (onRecommendCompute = vi.fn()) => {
  const TestDialog = () => {
    const [open, setOpen] = useState(true)

    return (
      <AddReadReplicaDialog
        open={open}
        onOpenChange={setOpen}
        onRecommendCompute={onRecommendCompute}
      />
    )
  }

  return customRender(<TestDialog />)
}

describe('AddReadReplicaDialog', () => {
  test('does not load form data while closed', () => {
    customRender(
      <AddReadReplicaDialog open={false} onOpenChange={vi.fn()} onRecommendCompute={vi.fn()} />
    )

    expect(mockReadReplicaForm).not.toHaveBeenCalled()
  })

  test('closes an unchanged dialog without confirmation', async () => {
    const user = userEvent.setup()
    renderDialog()

    expect(screen.getByRole('dialog', { name: 'Add read replica' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Close' }))

    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: 'Add read replica' })).not.toBeInTheDocument()
    })
    expect(screen.queryByText('Unsaved changes')).not.toBeInTheDocument()
  })

  test('closes after a transient region selection without confirmation', async () => {
    const user = userEvent.setup()
    renderDialog()

    await user.click(screen.getByRole('button', { name: 'Change region' }))
    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: 'Add read replica' })).not.toBeInTheDocument()
    })
    expect(screen.queryByText('Unsaved changes')).not.toBeInTheDocument()
  })

  test('hands the recommendation off after closing the dialog', async () => {
    const user = userEvent.setup()
    const onRecommendCompute = vi.fn()

    renderDialog(onRecommendCompute)

    await user.click(screen.getByRole('button', { name: 'Change compute' }))

    await waitFor(() => expect(onRecommendCompute).toHaveBeenCalledWith('ci_small'))
  })
})
