import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { QueryResultRenderer } from './QueryResultRenderer'
import { customRender } from '@/tests/lib/custom-render'

describe('QueryResultRenderer while a query runs', () => {
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
