import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Confirm } from './Confirm'

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
})
