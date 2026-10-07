import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { BranchStatValue } from './ActivityStats'

describe('BranchStatValue', () => {
  it('shows branches as unavailable for HA projects without cached branch data', () => {
    render(
      <BranchStatValue
        currentBranch={undefined}
        isDefaultProject
        isError={false}
        isHighAvailability
        isLoading
        latestNonDefaultBranch={undefined}
      />
    )

    expect(screen.getByText('Unavailable')).toBeInTheDocument()
    expect(screen.queryByText('No branches')).not.toBeInTheDocument()
  })
})
