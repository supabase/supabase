import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Confirm } from './Confirm'
import { customRender as render } from '@/tests/lib/custom-render'

describe('Confirm', () => {
  it('keeps its content visible and replaces actions with a success status', () => {
    render(
      <Confirm state="success" message="Run query" successMessage="Query executed">
        <div>Query preview</div>
      </Confirm>
    )

    expect(screen.getByText('Query preview')).toBeInTheDocument()
    expect(screen.getByText('Query executed')).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('keeps its content visible and replaces actions with an error status', () => {
    render(
      <Confirm state="error" message="Run query" errorMessage="Failed to execute SQL">
        <div>Query preview</div>
      </Confirm>
    )

    expect(screen.getByText('Query preview')).toBeInTheDocument()
    expect(screen.getByText('Failed to execute SQL')).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

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
