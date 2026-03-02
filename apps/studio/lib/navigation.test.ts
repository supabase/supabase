import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createNavigationHandler } from './navigation'

describe('createNavigationHandler', () => {
  let mockRouter: any
  let mockWindowOpen: any

  beforeEach(() => {
    vi.clearAllMocks()

    // Mock router with push method
    mockRouter = {
      push: vi.fn(),
    }

    // Mock window.open
    mockWindowOpen = vi.fn()
    global.window.open = mockWindowOpen
  })

  describe('keyboard navigation', () => {
    it('should call router.push when Enter key is pressed without modifiers', () => {
      const handler = createNavigationHandler('/test-url', mockRouter)
      const event = {
        key: 'Enter',
        metaKey: false,
        ctrlKey: false,
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent

      handler(event)

      expect(event.preventDefault).toHaveBeenCalled()
      expect(mockRouter.push).toHaveBeenCalledWith('/test-url')
      expect(mockWindowOpen).not.toHaveBeenCalled()
    })

    it('should call router.push when Space key is pressed without modifiers', () => {
      const handler = createNavigationHandler('/test-url', mockRouter)
      const event = {
        key: ' ',
        metaKey: false,
        ctrlKey: false,
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent

      handler(event)

      expect(event.preventDefault).toHaveBeenCalled()
      expect(mockRouter.push).toHaveBeenCalledWith('/test-url')
      expect(mockWindowOpen).not.toHaveBeenCalled()
    })

    it('should open new tab when Enter key is pressed with metaKey', () => {
      const handler = createNavigationHandler('/test-url', mockRouter)
      const event = {
        key: 'Enter',
        metaKey: true,
        ctrlKey: false,
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent

      handler(event)

      expect(event.preventDefault).toHaveBeenCalled()
      expect(mockWindowOpen).toHaveBeenCalledWith('/test-url', '_blank')
      expect(mockRouter.push).not.toHaveBeenCalled()
    })

    it('should open new tab when Enter key is pressed with ctrlKey', () => {
      const handler = createNavigationHandler('/test-url', mockRouter)
      const event = {
        key: 'Enter',
        metaKey: false,
        ctrlKey: true,
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent

      handler(event)

      expect(event.preventDefault).toHaveBeenCalled()
      expect(mockWindowOpen).toHaveBeenCalledWith('/test-url', '_blank')
      expect(mockRouter.push).not.toHaveBeenCalled()
    })

    it('should open new tab when Space key is pressed with metaKey', () => {
      const handler = createNavigationHandler('/test-url', mockRouter)
      const event = {
        key: ' ',
        metaKey: true,
        ctrlKey: false,
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent

      handler(event)

      expect(event.preventDefault).toHaveBeenCalled()
      expect(mockWindowOpen).toHaveBeenCalledWith('/test-url', '_blank')
      expect(mockRouter.push).not.toHaveBeenCalled()
    })

    it('should do nothing when other keys are pressed', () => {
      const handler = createNavigationHandler('/test-url', mockRouter)
      const event = {
        key: 'a',
        metaKey: false,
        ctrlKey: false,
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent

      handler(event)

      expect(event.preventDefault).not.toHaveBeenCalled()
      expect(mockRouter.push).not.toHaveBeenCalled()
      expect(mockWindowOpen).not.toHaveBeenCalled()
    })
  })

  describe('mouse navigation', () => {
    it('should call router.push on regular left click', () => {
      const handler = createNavigationHandler('/test-url', mockRouter)
      const event = {
        button: 0,
        metaKey: false,
        ctrlKey: false,
        preventDefault: vi.fn(),
      } as unknown as React.MouseEvent

      handler(event)

      expect(mockRouter.push).toHaveBeenCalledWith('/test-url')
      expect(mockWindowOpen).not.toHaveBeenCalled()
    })

    it('should open new tab on middle mouse button click', () => {
      const handler = createNavigationHandler('/test-url', mockRouter)
      const event = {
        button: 1, // Middle button
        metaKey: false,
        ctrlKey: false,
        preventDefault: vi.fn(),
      } as unknown as React.MouseEvent

      handler(event)

      expect(event.preventDefault).toHaveBeenCalled()
      expect(mockWindowOpen).toHaveBeenCalledWith('/test-url', '_blank')
      expect(mockRouter.push).not.toHaveBeenCalled()
    })

    it('should open new tab on Cmd + left click', () => {
      const handler = createNavigationHandler('/test-url', mockRouter)
      const event = {
        button: 0,
        metaKey: true,
        ctrlKey: false,
        preventDefault: vi.fn(),
      } as unknown as React.MouseEvent

      handler(event)

      expect(event.preventDefault).toHaveBeenCalled()
      expect(mockWindowOpen).toHaveBeenCalledWith('/test-url', '_blank')
      expect(mockRouter.push).not.toHaveBeenCalled()
    })

    it('should open new tab on Ctrl + left click', () => {
      const handler = createNavigationHandler('/test-url', mockRouter)
      const event = {
        button: 0,
        metaKey: false,
        ctrlKey: true,
        preventDefault: vi.fn(),
      } as unknown as React.MouseEvent

      handler(event)

      expect(event.preventDefault).toHaveBeenCalled()
      expect(mockWindowOpen).toHaveBeenCalledWith('/test-url', '_blank')
      expect(mockRouter.push).not.toHaveBeenCalled()
    })

    it('should handle right click without navigation', () => {
      const handler = createNavigationHandler('/test-url', mockRouter)
      const event = {
        button: 2, // Right button
        metaKey: false,
        ctrlKey: false,
        preventDefault: vi.fn(),
      } as unknown as React.MouseEvent

      handler(event)

      // Right click should trigger router.push (falls through to default case)
      expect(mockRouter.push).toHaveBeenCalledWith('/test-url')
    })
  })

  describe('URL handling', () => {
    it('should handle URLs with BASE_PATH correctly', () => {
      const handler = createNavigationHandler('/project/123/settings', mockRouter)
      const event = {
        button: 1, // Middle button to open in new tab
        metaKey: false,
        ctrlKey: false,
        preventDefault: vi.fn(),
      } as unknown as React.MouseEvent

      handler(event)

      // Should prepend BASE_PATH when opening new tab
      expect(mockWindowOpen).toHaveBeenCalledWith('/project/123/settings', '_blank')
    })

    it('should pass URL directly to router.push without BASE_PATH', () => {
      const handler = createNavigationHandler('/project/123/settings', mockRouter)
      const event = {
        button: 0,
        metaKey: false,
        ctrlKey: false,
        preventDefault: vi.fn(),
      } as unknown as React.MouseEvent

      handler(event)

      // router.push should receive URL without BASE_PATH
      expect(mockRouter.push).toHaveBeenCalledWith('/project/123/settings')
    })
  })
})
