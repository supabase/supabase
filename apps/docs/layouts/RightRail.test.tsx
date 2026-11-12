// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { useBreakpoint } from 'common/hooks/useBreakpoint'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { RightRailOnDesktop, RightRailProvider } from './RightRail'

vi.mock('common/hooks/useBreakpoint', () => ({ useBreakpoint: vi.fn() }))

// the radix scroll area needs ResizeObserver, and jsdom has none
vi.hoisted(() => {
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
})

const renderInRail = (isBelowDesktop: boolean) => {
  vi.mocked(useBreakpoint).mockReturnValue(isBelowDesktop)
  const rail = document.body.appendChild(document.createElement('aside'))
  render(
    <RightRailProvider value={rail}>
      <RightRailOnDesktop>
        <p>reference navigation</p>
      </RightRailOnDesktop>
    </RightRailProvider>
  )
  return rail
}

describe('RightRailOnDesktop', () => {
  afterEach(() => {
    cleanup()
    document.body.innerHTML = ''
  })

  it('moves the content into the rail on desktop', () => {
    const rail = renderInRail(false)

    expect(rail.contains(screen.getByText('reference navigation'))).toBe(true)
  })

  it('keeps the content in place for the mobile drawer below desktop', () => {
    const rail = renderInRail(true)

    expect(rail.contains(screen.getByText('reference navigation'))).toBe(false)
  })
})
