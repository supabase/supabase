import { act, render, screen, waitFor } from '@testing-library/react'
import { FrameworkProvider } from 'common'
import { useEffect, useState } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { MobileSheetNav } from './MobileSheetNav'

const mockRouter = { asPath: '/initial' }
const mockWindowSize = vi.hoisted(() => ({ width: 400 }))

vi.mock('react-use', () => ({
  useWindowSize: () => mockWindowSize,
}))

function renderWithFramework(ui: React.ReactElement) {
  const utils = render(
    <FrameworkProvider value={{ asPath: mockRouter.asPath }}>{ui}</FrameworkProvider>
  )
  return {
    ...utils,
    rerender: (nextUi: React.ReactElement) =>
      utils.rerender(
        <FrameworkProvider value={{ asPath: mockRouter.asPath }}>{nextUi}</FrameworkProvider>
      ),
  }
}

function MobileSheetNavWithState({
  shouldCloseOnRouteChange = true,
  shouldCloseOnQueryChange = true,
  shouldCloseOnViewportResize = true,
}: {
  shouldCloseOnRouteChange?: boolean
  shouldCloseOnQueryChange?: boolean
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
        shouldCloseOnQueryChange={shouldCloseOnQueryChange}
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
    mockRouter.asPath = '/initial'
    mockWindowSize.width = 400
  })

  describe('shouldCloseOnRouteChange', () => {
    it('calls onOpenChange(false) when route changes and shouldCloseOnRouteChange is true (default)', () => {
      const onOpenChange = vi.fn()
      const { rerender } = renderWithFramework(
        <MobileSheetNav {...defaultProps} onOpenChange={onOpenChange} />
      )

      onOpenChange.mockClear()
      mockRouter.asPath = '/other-page'
      act(() => {
        rerender(<MobileSheetNav {...defaultProps} onOpenChange={onOpenChange} />)
      })

      expect(onOpenChange).toHaveBeenCalledWith(false)
    })

    it('effectively closes the sheet on route change when shouldCloseOnRouteChange is true', async () => {
      const { rerender } = renderWithFramework(<MobileSheetNavWithState />)

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
      const { rerender } = renderWithFramework(
        <MobileSheetNavWithState shouldCloseOnRouteChange={false} />
      )

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
      const { rerender } = renderWithFramework(
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

  describe('query changes', () => {
    it('closes the sheet for query navigation by default', () => {
      const onOpenChange = vi.fn()
      const { rerender } = renderWithFramework(
        <MobileSheetNav {...defaultProps} onOpenChange={onOpenChange} />
      )
      onOpenChange.mockClear()
      mockRouter.asPath = '/initial?type=wrappers'
      rerender(<MobileSheetNav {...defaultProps} onOpenChange={onOpenChange} />)
      expect(onOpenChange).toHaveBeenCalledWith(false)
    })

    it('keeps filters open when opted out, and closes on path navigation', async () => {
      mockRouter.asPath = '/project/default/issues'
      const { rerender } = renderWithFramework(
        <MobileSheetNavWithState shouldCloseOnQueryChange={false} />
      )
      expect(await screen.findByText('Nav content')).toBeInTheDocument()

      mockRouter.asPath = '/project/default/issues?q=function'
      rerender(<MobileSheetNavWithState shouldCloseOnQueryChange={false} />)
      expect(screen.getByText('Nav content')).toBeInTheDocument()

      mockRouter.asPath = '/project/default/issues'
      rerender(<MobileSheetNavWithState shouldCloseOnQueryChange={false} />)
      expect(screen.getByText('Nav content')).toBeInTheDocument()

      mockRouter.asPath = '/project/default/issues/function_search_path_mutable'
      rerender(<MobileSheetNavWithState shouldCloseOnQueryChange={false} />)
      await waitFor(() => expect(screen.queryByText('Nav content')).not.toBeInTheDocument())
    })
  })

  describe('shouldCloseOnViewportResize', () => {
    it('calls onOpenChange(false) when width changes and shouldCloseOnViewportResize is true (default)', () => {
      const onOpenChange = vi.fn()
      const { rerender } = renderWithFramework(
        <MobileSheetNav {...defaultProps} onOpenChange={onOpenChange} />
      )

      onOpenChange.mockClear()
      mockWindowSize.width = 800
      act(() => {
        rerender(<MobileSheetNav {...defaultProps} onOpenChange={onOpenChange} />)
      })

      expect(onOpenChange).toHaveBeenCalledWith(false)
    })

    it('effectively closes the sheet on viewport resize when shouldCloseOnViewportResize is true', async () => {
      const { rerender } = renderWithFramework(<MobileSheetNavWithState />)

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
      const { rerender } = renderWithFramework(
        <MobileSheetNavWithState shouldCloseOnViewportResize={false} />
      )

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
      const { rerender } = renderWithFramework(
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
