import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { PipelineCreateStepDescription } from './PipelineCreateStepDescription'

describe('PipelineCreateStepDescription', () => {
  it('uses plain text on the connection step', () => {
    render(<PipelineCreateStepDescription step="connection" destinationType="BigQuery" />)

    expect(screen.queryByRole('link')).not.toBeInTheDocument()
    expect(
      screen.getByText('Name this pipeline and enter credentials for BigQuery.')
    ).toBeInTheDocument()
  })

  it('uses plain text on the data step', () => {
    render(<PipelineCreateStepDescription step="data" />)

    expect(screen.queryByRole('link')).not.toBeInTheDocument()
    expect(
      screen.getByText('Select a publication and which existing rows to copy during initial sync.')
    ).toBeInTheDocument()
  })

  it('does not add a docs link on the destination or review steps', () => {
    const { rerender } = render(<PipelineCreateStepDescription step="destination" />)

    expect(screen.queryByRole('link')).not.toBeInTheDocument()
    expect(screen.getByText('Where should this database be replicated?')).toBeInTheDocument()

    rerender(<PipelineCreateStepDescription step="review" />)
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })
})
