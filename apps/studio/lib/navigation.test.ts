import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createNavigationHandler } from './navigation'

// Mock the BASE_PATH constant
vi.mock('./constants', () => ({
  BASE_PATH: '/base',
}))

describe('createNavigationHandler', () => {
  const mockRouter = {
    push: vi.fn(),
  }
  const mockWindowOpen = vi.fn()
  const url = '/project/123/functions/my-function'
  const BASE_PATH = '/base'

  beforeEach(() => {
    vi.stubGlobal('window', {
      open: mockWindowOpen,
    })
    mockRouter.push.mockClear()
    mockWindowOpen.mockClear()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  it('should navigate on regular left click', () => {
    const handler = createNavigationHandler(url, mockRouter as any)
    const event = {
      button: 0,
      metaKey: false,
      ctrlKey: false,
    } as React.MouseEvent

    handler(event)

    expect(mockRouter.push).toHaveBeenCalledWith(url)
    expect(mockWindowOpen).not.toHaveBeenCalled()
  })

  it('should open in new tab on Cmd + left click', () => {
    const handler = createNavigationHandler(url, mockRouter as any)
    const event = {
      button: 0,
      metaKey: true,
      ctrlKey: false,
      preventDefault: vi.fn(),
    } as unknown as React.MouseEvent

    handler(event)

    expect(event.preventDefault).toHaveBeenCalled()
    expect(mockWindowOpen).toHaveBeenCalledWith(`${BASE_PATH}${url}`, '_blank')
    expect(mockRouter.push).not.toHaveBeenCalled()
  })

  it('should open in new tab on Ctrl + left click', () => {
    const handler = createNavigationHandler(url, mockRouter as any)
    const event = {
      button: 0,
      metaKey: false,
      ctrlKey: true,
      preventDefault: vi.fn(),
    } as unknown as React.MouseEvent

    handler(event)

    expect(event.preventDefault).toHaveBeenCalled()
    expect(mockWindowOpen).toHaveBeenCalledWith(`${BASE_PATH}${url}`, '_blank')
    expect(mockRouter.push).not.toHaveBeenCalled()
  })

  it('should open in new tab on middle mouse button click', () => {
    const handler = createNavigationHandler(url, mockRouter as any)
    const event = {
      button: 1,
      preventDefault: vi.fn(),
    } as unknown as React.MouseEvent

    handler(event)

    expect(event.preventDefault).toHaveBeenCalled()
    expect(mockWindowOpen).toHaveBeenCalledWith(`${BASE_PATH}${url}`, '_blank')
    expect(mockRouter.push).not.toHaveBeenCalled()
  })

  it('should navigate on Enter key press', () => {
    const handler = createNavigationHandler(url, mockRouter as any)
    const event = {
      key: 'Enter',
      metaKey: false,
      ctrlKey: false,
      preventDefault: vi.fn(),
    } as unknown as React.KeyboardEvent

    handler(event)

    expect(event.preventDefault).toHaveBeenCalled()
    expect(mockRouter.push).toHaveBeenCalledWith(url)
    expect(mockWindowOpen).not.toHaveBeenCalled()
  })

  it('should navigate on Space key press', () => {
    const handler = createNavigationHandler(url, mockRouter as any)
    const event = {
      key: ' ',
      metaKey: false,
      ctrlKey: false,
      preventDefault: vi.fn(),
    } as unknown as React.KeyboardEvent

    handler(event)

    expect(event.preventDefault).toHaveBeenCalled()
    expect(mockRouter.push).toHaveBeenCalledWith(url)
    expect(mockWindowOpen).not.toHaveBeenCalled()
  })

  it('should open in new tab on Cmd + Enter', () => {
    const handler = createNavigationHandler(url, mockRouter as any)
    const event = {
      key: 'Enter',
      metaKey: true,
      ctrlKey: false,
      preventDefault: vi.fn(),
    } as unknown as React.KeyboardEvent

    handler(event)

    expect(event.preventDefault).toHaveBeenCalled()
    expect(mockWindowOpen).toHaveBeenCalledWith(`${BASE_PATH}${url}`, '_blank')
    expect(mockRouter.push).not.toHaveBeenCalled()
  })

  it('should open in new tab on Ctrl + Enter', () => {
    const handler = createNavigationHandler(url, mockRouter as any)
    const event = {
      key: 'Enter',
      metaKey: false,
      ctrlKey: true,
      preventDefault: vi.fn(),
    } as unknown as React.KeyboardEvent

    handler(event)

    expect(event.preventDefault).toHaveBeenCalled()
    expect(mockWindowOpen).toHaveBeenCalledWith(`${BASE_PATH}${url}`, '_blank')
    expect(mockRouter.push).not.toHaveBeenCalled()
  })

  it('should not handle other keyboard keys', () => {
    const handler = createNavigationHandler(url, mockRouter as any)
    const event = {
      key: 'Escape',
      preventDefault: vi.fn(),
    } as unknown as React.KeyboardEvent

    handler(event)

    expect(event.preventDefault).not.toHaveBeenCalled()
    expect(mockRouter.push).not.toHaveBeenCalled()
    expect(mockWindowOpen).not.toHaveBeenCalled()
  })
})
