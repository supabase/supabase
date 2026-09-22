import { render, screen } from '@testing-library/react'
import { createRef } from 'react'
import { describe, expect, it } from 'vitest'

import {
  ExplorerQuery,
  ExplorerQueryEditor,
  ExplorerQueryFooter,
  ExplorerQueryResults,
  ExplorerQueryViewport,
} from '../ExplorerQuery'
import { ExplorerToolbar, ExplorerToolbarTitle } from '../ExplorerToolbar'

describe('ExplorerQuery', () => {
  it('composes the toolbar, editor, results, and footer without owning their behavior', () => {
    render(
      <ExplorerQuery aria-label="Weekly signups query">
        <ExplorerToolbar aria-label="Explorer query toolbar">
          <ExplorerToolbarTitle>Weekly signups</ExplorerToolbarTitle>
        </ExplorerToolbar>
        <ExplorerQueryEditor>SQL editor</ExplorerQueryEditor>
        <ExplorerQueryResults>Results table</ExplorerQueryResults>
        <ExplorerQueryFooter>2 rows</ExplorerQueryFooter>
      </ExplorerQuery>
    )

    const cell = screen.getByLabelText('Weekly signups query')
    expect(cell).toHaveAttribute('data-slot', 'explorer-query')
    expect(cell).toHaveAttribute('data-variant', 'embedded')
    expect(cell).toHaveClass('rounded-md', 'border')
    expect(screen.getByRole('toolbar', { name: 'Explorer query toolbar' })).toBeInTheDocument()
    expect(cell.querySelector('[data-slot="explorer-query-editor"]')).toHaveTextContent(
      'SQL editor'
    )
    expect(cell.querySelector('[data-slot="explorer-query-results"]')).toHaveTextContent(
      'Results table'
    )
    expect(cell.querySelector('[data-slot="explorer-query-footer"]')).toHaveTextContent('2 rows')
  })

  it('provides an explicit full-height viewport variant and forwards native props', () => {
    const viewportRef = createRef<HTMLDivElement>()

    render(
      <ExplorerQueryViewport
        ref={viewportRef}
        aria-label="Explorer query tab"
        className="custom-viewport"
        data-density="compact"
      >
        <ExplorerQueryEditor>SQL editor</ExplorerQueryEditor>
        <ExplorerQueryResults>Run the query to see results</ExplorerQueryResults>
      </ExplorerQueryViewport>
    )

    const viewport = screen.getByLabelText('Explorer query tab')
    expect(viewport).toHaveAttribute('data-variant', 'viewport')
    expect(viewport).toHaveAttribute('data-density', 'compact')
    expect(viewport).toHaveClass('h-full', 'min-h-0', 'custom-viewport')
    expect(viewport).not.toHaveClass('rounded-md')
    expect(viewportRef.current).toBe(viewport)
  })

  it('fills the remaining height from the results region itself, in either root and at any depth', () => {
    render(
      <>
        <ExplorerQuery aria-label="Embedded query">
          <ExplorerQueryResults>Results table</ExplorerQueryResults>
        </ExplorerQuery>
        <ExplorerQueryViewport aria-label="Viewport query">
          <div data-testid="wrapper">
            <ExplorerQueryResults>Results table</ExplorerQueryResults>
          </div>
        </ExplorerQueryViewport>
      </>
    )

    // The fill behavior belongs to the region, so it survives both roots and a
    // wrapper between them — it is not granted by a parent selector.
    const [embedded, wrapped] = Array.from(
      document.querySelectorAll('[data-slot="explorer-query-results"]')
    )

    // min-h-0 over a floor: results must shrink rather than push the footer out
    // of a height-constrained frame.
    for (const results of [embedded, wrapped]) {
      expect(results).toHaveClass('flex-1', 'min-h-0', 'overflow-hidden')
    }
    expect(wrapped.parentElement).toHaveAttribute('data-testid', 'wrapper')
  })
})
