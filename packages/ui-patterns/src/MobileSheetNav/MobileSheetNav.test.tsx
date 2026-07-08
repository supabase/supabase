import { act, render, screen, waitFor } from '@testing-library/react'
import { useEffect, useState } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { MobileSheetNav } from './MobileSheetNav'

const mockRouter = vi.hoisted(() => ({ asPath: '/initial' }))
const mockWindowSize = vi.hoisted(() => ({ width: 400 }))

vi.mock('next/router', () => ({
  useRouter: () => mockRouter,
}))

vi.mock('react-use', () => ({
  useWindowSize: () => mockWindowSize,
}))

function MobileSheetNavWithState({
  shouldCloseOnRouteChange = true,
  shouldCloseOnViewportResize = true,
}: {
  shouldCloseOnRouteChange?: boolean
  shouldCloseOnViewportResize?: boolean
}) {
  const [open, setOpen] = useState(false)
  useEffect(() => {
    setOpen(true)
  }, [])
  return (
    <>
      <span data-testid="sheet-open">{String(open)}</span>
      <MobileSheetNav
        open={open}
        onOpenChange={setOpen}
        shouldCloseOnRouteChange={shouldCloseOnRouteChange}
        shouldCloseOnViewportResize={shouldCloseOnViewportResize}
      >
        <div>Nav content</div>
      </MobileSheetNav>
    </>
  )
}

describe('MobileSheetNav', () => {
  const defaultProps = {
    onOpenChange: vi.fn(),
    children: <div>Nav content</div>,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockRouter.asPath = '/initial'
    mockWindowSize.width = 400
  })

  describe('shouldCloseOnRouteChange', () => {
    it('calls onOpenChange(false) when route changes and shouldCloseOnRouteChange is true (default)', () => {
      const onOpenChange = vi.fn()
      const { rerender } = render(<MobileSheetNav {...defaultProps} onOpenChange={onOpenChange} />)

      onOpenChange.mockClear()
      mockRouter.asPath = '/other-page'
      act(() => {
        rerender(<MobileSheetNav {...defaultProps} onOpenChange={onOpenChange} />)
      })

      expect(onOpenChange).toHaveBeenCalledWith(false)
    })

    it('effectively closes the sheet on route change when shouldCloseOnRouteChange is true', async () => {
      const { rerender } = render(<MobileSheetNavWithState />)

      await waitFor(() => {
        expect(screen.getByTestId('sheet-open')).toHaveTextContent('true')
      })

      mockRouter.asPath = '/other-page'
      act(() => {
        rerender(<MobileSheetNavWithState />)
      })

      await waitFor(() => {
        expect(screen.getByTestId('sheet-open')).toHaveTextContent('false')
      })
    })

    it('effectively does NOT close the sheet on route change when shouldCloseOnRouteChange is false', async () => {
      const { rerender } = render(<MobileSheetNavWithState shouldCloseOnRouteChange={false} />)

      await waitFor(() => {
        expect(screen.getByTestId('sheet-open')).toHaveTextContent('true')
      })

      mockRouter.asPath = '/other-page'
      act(() => {
        rerender(<MobileSheetNavWithState shouldCloseOnRouteChange={false} />)
      })

      expect(screen.getByTestId('sheet-open')).toHaveTextContent('true')
    })

    it('does not call onOpenChange when route changes if shouldCloseOnRouteChange is false', () => {
      const onOpenChange = vi.fn()
      const { rerender } = render(
        <MobileSheetNav
          {...defaultProps}
          onOpenChange={onOpenChange}
          shouldCloseOnRouteChange={false}
        />
      )

      onOpenChange.mockClear()
      mockRouter.asPath = '/other-page'
      act(() => {
        rerender(
          <MobileSheetNav
            {...defaultProps}
            onOpenChange={onOpenChange}
            shouldCloseOnRouteChange={false}
          />
        )
      })

      expect(onOpenChange).not.toHaveBeenCalled()
    })
  })

  describe('shouldCloseOnViewportResize', () => {
    it('calls onOpenChange(false) when width changes and shouldCloseOnViewportResize is true (default)', () => {
      const onOpenChange = vi.fn()
      const { rerender } = render(<MobileSheetNav {...defaultProps} onOpenChange={onOpenChange} />)

      onOpenChange.mockClear()
      mockWindowSize.width = 800
      act(() => {
        rerender(<MobileSheetNav {...defaultProps} onOpenChange={onOpenChange} />)
      })

      expect(onOpenChange).toHaveBeenCalledWith(false)
    })

    it('effectively closes the sheet on viewport resize when shouldCloseOnViewportResize is true', async () => {
      const { rerender } = render(<MobileSheetNavWithState />)

      await waitFor(() => {
        expect(screen.getByTestId('sheet-open')).toHaveTextContent('true')
      })

      mockWindowSize.width = 800
      act(() => {
        rerender(<MobileSheetNavWithState />)
      })

      await waitFor(() => {
        expect(screen.getByTestId('sheet-open')).toHaveTextContent('false')
      })
    })

    it('effectively does NOT close the sheet on viewport resize when shouldCloseOnViewportResize is false', async () => {
      const { rerender } = render(<MobileSheetNavWithState shouldCloseOnViewportResize={false} />)

      await waitFor(() => {
        expect(screen.getByTestId('sheet-open')).toHaveTextContent('true')
      })

      mockWindowSize.width = 800
      act(() => {
        rerender(<MobileSheetNavWithState shouldCloseOnViewportResize={false} />)
      })

      expect(screen.getByTestId('sheet-open')).toHaveTextContent('true')
    })

    it('does not call onOpenChange when width changes if shouldCloseOnViewportResize is false', () => {
      const onOpenChange = vi.fn()
      const { rerender } = render(
        <MobileSheetNav
          {...defaultProps}
          onOpenChange={onOpenChange}
          shouldCloseOnViewportResize={false}
        />
      )

      onOpenChange.mockClear()
      mockWindowSize.width = 800
      act(() => {
        rerender(
          <MobileSheetNav
            {...defaultProps}
            onOpenChange={onOpenChange}
            shouldCloseOnViewportResize={false}
          />
        )
      })

      expect(onOpenChange).not.toHaveBeenCalled()
    })
  })
})
