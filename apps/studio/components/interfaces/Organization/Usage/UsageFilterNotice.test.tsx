import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { UsageFilterNotice } from './UsageFilterNotice'
import { customRender } from '@/tests/lib/custom-render'

describe('UsageFilterNotice', () => {
  it('tells the reader that branch usage is excluded from the project view', () => {
    customRender(<UsageFilterNotice projectName="Marvo app" hasBranches />)

    expect(screen.getByText('Usage filtered by project')).toBeInTheDocument()
    expect(
      screen.getByText(/Each branch records its own usage, so this view excludes/)
    ).toBeInTheDocument()
  })

  it('omits the branch note for a project without branches', () => {
    customRender(<UsageFilterNotice projectName="Marvo app" hasBranches={false} />)

    expect(screen.queryByText(/Each branch records its own usage/)).not.toBeInTheDocument()
  })

  it('names the branch and drops the select-a-branch prompt once a branch is filtered', () => {
    customRender(
      <UsageFilterNotice projectName="Marvo app" branchName="marvo-app-dev" hasBranches />
    )

    expect(screen.getByText('Usage filtered by branch')).toBeInTheDocument()
    expect(screen.getByText('marvo-app-dev')).toBeInTheDocument()
    expect(
      screen.getByText(/This branch's usage counts toward the organization total/)
    ).toBeInTheDocument()
    expect(screen.queryByText(/Select a branch above/)).not.toBeInTheDocument()
  })
})
