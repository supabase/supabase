import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { QueryResultRenderer } from './QueryResultRenderer'
import { customRender } from '@/tests/lib/custom-render'

describe('QueryResultRenderer while a query runs', () => {
  it('replaces the empty result with a running state, so a re-run is not mistaken for the old outcome', () => {
    customRender(<QueryResultRenderer isExecuting view="table" result={{ rows: [] }} />)

    expect(screen.getByRole('status')).toHaveTextContent('Running query…')
    expect(screen.queryByText('Success. No rows returned')).not.toBeInTheDocument()
  })

  // Notebook cells size to their results; unmounting the rows on every re-run would make
  // each cell collapse and grow back during "Run notebook".
  it('keeps previous rows on screen under the running state', () => {
    customRender(
      <QueryResultRenderer isExecuting view="table" result={{ rows: [{ previous_column: 1 }] }} />
    )

    expect(screen.getByRole('status')).toHaveTextContent('Running query…')
    expect(screen.getByText('previous_column')).toBeInTheDocument()
  })
})
