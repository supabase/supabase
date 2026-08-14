import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { mockAnimationsApi } from 'jsdom-testing-mocks'
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from 'ui'
import { describe, expect, it, vi, type Mock } from 'vitest'

import { LogsTimeRangeSubMenu } from './LogsTimeRangeSubMenu'
import type { LogTimeRange } from '@/data/query-sources/query-source-registry'
import { customRender } from '@/tests/lib/custom-render'

mockAnimationsApi()

vi.mock('@/hooks/misc/useCheckEntitlements', () => ({
  useCheckEntitlements: () => ({ getEntitlementNumericValue: () => 1 }),
}))

const renderSubMenu = ({
  onRangeChange = vi.fn<(range: LogTimeRange) => void>(),
  onOpenCustomRange = vi.fn<() => void>(),
  onShowUpgrade = vi.fn<() => void>(),
  range = { type: 'relative', amount: 1, unit: 'hour' } as LogTimeRange,
}: {
  onRangeChange?: Mock<(range: LogTimeRange) => void>
  onOpenCustomRange?: Mock<() => void>
  onShowUpgrade?: Mock<() => void>
  range?: LogTimeRange
} = {}) => {
  customRender(
    <DropdownMenu defaultOpen>
      <DropdownMenuTrigger>Open</DropdownMenuTrigger>
      <DropdownMenuContent>
        <LogsTimeRangeSubMenu
          range={range}
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

  it('marks the structurally matching preset as selected', async () => {
    renderSubMenu({ range: { type: 'relative', amount: 3, unit: 'hour' } })

    await userEvent.hover(await screen.findByText('Time range'))

    await waitFor(() => expect(screen.getAllByText('Last 3 hours')).toHaveLength(2))
    expect(document.querySelector('.lucide-check')).toBeInTheDocument()
  })
})
