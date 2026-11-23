import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Confirm } from './Confirm'
import { customRender as render } from '@/tests/lib/custom-render'

describe('Confirm', () => {
  it.each([
    { state: 'success' as const, outcome: 'Query executed' },
    { state: 'error' as const, outcome: 'Failed to execute SQL' },
  ])(
    'keeps its content visible and replaces actions with the $state status',
    ({ state, outcome }) => {
      render(
        <Confirm
          state={state}
          message="Run query"
          successMessage="Query executed"
          errorMessage="Failed to execute SQL"
        >
          <div>Query preview</div>
        </Confirm>
      )

      expect(screen.getByText('Query preview')).toBeInTheDocument()
      expect(screen.getByText(outcome)).toBeInTheDocument()
      expect(screen.queryByRole('button')).not.toBeInTheDocument()
    }
  )

  it('keeps the confirm and cancel buttons visible but disabled while loading after approval', () => {
    render(
      <Confirm
        state="approval-responded"
        message="Run query"
        confirmLabel="Confirm"
        confirmLabelLoading="Running..."
      >
        <div>Query preview</div>
      </Confirm>
    )

    const cancelButton = screen.getByRole('button', { name: 'Skip' })
    const confirmButton = screen.getByRole('button', { name: 'Running...' })

    expect(cancelButton).toBeDisabled()
    expect(confirmButton).toBeDisabled()
  })

  it('announces outcome updates in the existing status region', () => {
    const { rerender } = render(
      <Confirm state="approval-requested" message="Run query" successMessage="Query executed">
        <div>Query preview</div>
      </Confirm>
    )
    const status = screen.getByRole('status')

    expect(status).toHaveTextContent('Run query')

    rerender(
      <Confirm state="success" message="Run query" successMessage="Query executed">
        <div>Query preview</div>
      </Confirm>
    )

    expect(screen.getByRole('status')).toBe(status)
    expect(status).toHaveTextContent('Query executed')
  })
})
