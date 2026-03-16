import { describe, expect, it } from 'vitest'

import {
  clampPosition,
  getToolbarStyle,
  getNextPosition,
  isMenuContent,
  shouldShowMenuButton,
} from './FloatingMobileToolbar.utils'

describe('isMenuContent', () => {
  it('returns false for null', () => {
    expect(isMenuContent(null)).toBe(false)
  })

  it('returns false for sidebar id string', () => {
    expect(isMenuContent('help-panel')).toBe(false)
  })

  it('returns true for non-string content', () => {
    expect(isMenuContent({})).toBe(true)
    expect(isMenuContent(0)).toBe(true)
  })
})

describe('shouldShowMenuButton', () => {
  it('returns true for project, org, account paths', () => {
    expect(shouldShowMenuButton('/project/ref')).toBe(true)
    expect(shouldShowMenuButton('/org/slug')).toBe(true)
    expect(shouldShowMenuButton('/account/me')).toBe(true)
  })

  it('returns false for other paths', () => {
    expect(shouldShowMenuButton('/organizations')).toBe(false)
    expect(shouldShowMenuButton('/')).toBe(false)
  })
})

describe('clampPosition', () => {
  const viewport = { width: 400, height: 800 }
  const navSize = { width: 100, height: 48 }

  it('clamps to viewport bounds', () => {
    const next = clampPosition({ x: 0, y: 0 }, { dx: 500, dy: 900 }, viewport, navSize)
    expect(next.x).toBe(300)
    expect(next.y).toBe(752)
  })

  it('does not go negative', () => {
    const next = clampPosition({ x: 10, y: 10 }, { dx: -20, dy: -20 }, viewport, navSize)
    expect(next.x).toBe(0)
    expect(next.y).toBe(0)
  })
})

describe('getNextPosition', () => {
  const viewport = { width: 400, height: 800 }
  const navSize = { width: 100, height: 48 }
  const dragStart = { x: 50, y: 100, startX: 60, startY: 110 }

  it('returns null when under threshold', () => {
    expect(getNextPosition(dragStart, 62, 111, viewport, navSize, 8)).toBeNull()
  })

  it('returns clamped position when over threshold', () => {
    const next = getNextPosition(dragStart, 80, 130, viewport, navSize, 5)
    expect(next).toEqual({ x: 70, y: 120 })
  })
})

describe('getToolbarStyle', () => {
  const viewport = { width: 390, height: 844 }
  const navSize = { width: 200, height: 48 }

  it('returns style with transform and zIndex', () => {
    const style = getToolbarStyle({
      position: null,
      navSize,
      isSheetOpen: false,
      viewport,
      isDragging: false,
    })
    expect(style.zIndex).toBe(41)
    expect(style.transform).toBeDefined()
    expect(style.left).toBe('50%')
  })

  it('uses higher zIndex when sheet open', () => {
    const style = getToolbarStyle({
      position: null,
      navSize,
      isSheetOpen: true,
      viewport,
      isDragging: false,
    })
    expect(style.zIndex).toBe(101)
  })
})
