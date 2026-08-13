import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { mockAnimationsApi } from 'jsdom-testing-mocks'
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from 'ui'
import { describe, expect, it, vi } from 'vitest'

import { LogsTimeRangeSubMenu } from './LogsTimeRangeSubMenu'
import { customRender } from '@/tests/lib/custom-render'

mockAnimationsApi()

vi.mock('@/hooks/misc/useCheckEntitlements', () => ({
  useCheckEntitlements: () => ({ getEntitlementNumericValue: () => 1 }),
}))

const renderSubMenu = ({
  onRangeChange = vi.fn(),
  onOpenCustomRange = vi.fn(),
  onShowUpgrade = vi.fn(),
} = {}) => {
  customRender(
    <DropdownMenu defaultOpen>
      <DropdownMenuTrigger>Open</DropdownMenuTrigger>
      <DropdownMenuContent>
        <LogsTimeRangeSubMenu
          range={{ _tag: 'relative_time_range', amount: 1, unit: 'hour' }}
          onRangeChange={onRangeChange}
          onOpenCustomRange={onOpenCustomRange}
          onShowUpgrade={onShowUpgrade}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  )

  return { onRangeChange, onOpenCustomRange, onShowUpgrade }
}

describe('LogsTimeRangeSubMenu', () => {
  it('opens the upgrade prompt instead of applying a range beyond retention', async () => {
    const { onRangeChange, onShowUpgrade } = renderSubMenu()

    await userEvent.hover(await screen.findByText('Time range'))
    await userEvent.click(await screen.findByText('Last 7 days'))

    expect(onShowUpgrade).toHaveBeenCalledOnce()
    expect(onRangeChange).not.toHaveBeenCalled()
  })

  it('exposes the custom-range action', async () => {
    const { onOpenCustomRange } = renderSubMenu()

    await userEvent.hover(await screen.findByText('Time range'))
    await userEvent.click(await screen.findByText('Custom range…'))

    expect(onOpenCustomRange).toHaveBeenCalledOnce()
  })
})
