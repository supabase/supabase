import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { QueryResultRenderer } from './QueryResultRenderer'

describe('QueryResultRenderer', () => {
  it('prompts the user to run the query before any result exists', () => {
    render(<QueryResultRenderer />)

    expect(screen.getByText('Run the query to see results')).toBeInTheDocument()
  })

  // A re-run should not leave the previous rows on screen looking current.
  it('shows the loading state instead of the previous result while a run is in flight', () => {
    render(<QueryResultRenderer isExecuting view="table" result={{ rows: [] }} />)

    expect(screen.getByRole('status')).toHaveTextContent('Running query…')
    expect(screen.queryByText('Success. No rows returned')).not.toBeInTheDocument()
  })

  it('confirms success when the query returns no rows', () => {
    render(<QueryResultRenderer view="table" result={{ rows: [] }} />)

    expect(screen.getByText('Success. No rows returned')).toBeInTheDocument()
  })
})
