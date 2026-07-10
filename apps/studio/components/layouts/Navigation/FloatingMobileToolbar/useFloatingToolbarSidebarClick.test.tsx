import { act, renderHook } from '@testing-library/react'
import type { MouseEvent } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useFloatingToolbarSidebarClick } from './useFloatingToolbarSidebarClick'

const mocks = vi.hoisted(() => ({
  activeSidebarId: undefined as string | undefined,
  setSheetContent: vi.fn(),
}))

vi.mock('../NavigationBar/MobileSheetContext', () => ({
  useMobileSheet: () => ({ setContent: mocks.setSheetContent }),
}))

vi.mock('@/state/sidebar-manager-state', () => ({
  useSidebarManagerSnapshot: () => ({
    activeSidebar: mocks.activeSidebarId ? { id: mocks.activeSidebarId } : undefined,
  }),
}))

function createClickEvent(sidebarId: string) {
  const wrapper = document.createElement('span')
  const button = document.createElement('button')
  wrapper.dataset.sidebarId = sidebarId
  wrapper.appendChild(button)

  return {
    target: button,
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
  } as unknown as MouseEvent
}

describe('useFloatingToolbarSidebarClick', () => {
  beforeEach(() => {
    mocks.activeSidebarId = undefined
    vi.clearAllMocks()
  })

  it('updates the sheet and allows a different sidebar button to handle its own toggle', () => {
    mocks.activeSidebarId = 'help-panel'
    const { result } = renderHook(() => useFloatingToolbarSidebarClick())
    const event = createClickEvent('advisor-panel')

    act(() => result.current(event))

    expect(mocks.setSheetContent).toHaveBeenCalledWith('advisor-panel')
    expect(event.preventDefault).not.toHaveBeenCalled()
    expect(event.stopPropagation).not.toHaveBeenCalled()
  })

  it('leaves the active sidebar click to toggle itself closed', () => {
    mocks.activeSidebarId = 'help-panel'
    const { result } = renderHook(() => useFloatingToolbarSidebarClick())

    act(() => result.current(createClickEvent('help-panel')))

    expect(mocks.setSheetContent).not.toHaveBeenCalled()
  })
})
