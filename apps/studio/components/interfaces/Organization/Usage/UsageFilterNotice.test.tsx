import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { UsageFilterNotice } from './UsageFilterNotice'
import { customRender } from '@/tests/lib/custom-render'

describe('UsageFilterNotice', () => {
  it.each([
    { branchName: 'dev-test', hasBranches: true, text: 'dev-test branch only.' },
    {
      branchName: undefined,
      hasBranches: true,
      text: 'Main branch only. Other branches are tracked separately.',
    },
    { branchName: undefined, hasBranches: false, text: 'This project only.' },
  ])('shows "$text" for the selected scope', ({ branchName, hasBranches, text }) => {
    customRender(
      <UsageFilterNotice
        branchName={branchName}
        hasBranches={hasBranches}
        onViewOrganizationUsage={vi.fn()}
      />
    )

    expect(screen.getByText(text)).toBeInTheDocument()
  })

  it('discloses organization totals on keyboard focus even without live branches', async () => {
    const user = userEvent.setup()
    customRender(
      <UsageFilterNotice hasBranches={false} onViewOrganizationUsage={vi.fn()} />
    )

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
    await user.tab()
    await user.tab()

    expect(screen.getByRole('button', { name: 'About usage totals' })).toHaveFocus()
    expect(await screen.findByRole('tooltip')).toHaveTextContent(
      'Billing and quotas use totals from all projects and branches, including deleted branches that are no longer selectable.'
    )
  })

  it('requests organization totals when the action is clicked', async () => {
    const user = userEvent.setup()
    const onViewOrganizationUsage = vi.fn()
    customRender(
      <UsageFilterNotice
        branchName="dev-test"
        hasBranches
        onViewOrganizationUsage={onViewOrganizationUsage}
      />
    )

    await user.click(screen.getByRole('button', { name: 'View organization total' }))

    expect(onViewOrganizationUsage).toHaveBeenCalledOnce()
  })
})
