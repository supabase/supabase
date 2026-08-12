import { screen, within } from '@testing-library/react'
import { createRef } from 'react'
import { describe, expect, it } from 'vitest'

import { customRender as render } from '@/tests/lib/custom-render'
import {
  ExplorerToolbar,
  ExplorerToolbarAction,
  ExplorerToolbarActions,
  ExplorerToolbarIcon,
  ExplorerToolbarTitle,
} from './index'

describe('ExplorerToolbar', () => {
  it('composes the resource icon, title, direct actions, and custom controls', () => {
    render(
      <ExplorerToolbar aria-label="Explorer query toolbar">
        <ExplorerToolbarIcon>Q</ExplorerToolbarIcon>
        <ExplorerToolbarTitle>Weekly signups</ExplorerToolbarTitle>
        <ExplorerToolbarActions>
          <span data-testid="source-menu">Database</span>
          <ExplorerToolbarAction aria-label="Run cell" icon={<span>R</span>} />
        </ExplorerToolbarActions>
      </ExplorerToolbar>
    )

    const toolbar = screen.getByRole('toolbar', { name: 'Explorer query toolbar' })
    expect(toolbar).toHaveAttribute('data-slot', 'explorer-toolbar')
    expect(toolbar.querySelector('[data-slot="explorer-toolbar-icon"]')).toHaveTextContent('Q')
    expect(toolbar.querySelector('[data-slot="explorer-toolbar-title"]')).toHaveTextContent(
      'Weekly signups'
    )
    expect(within(toolbar).getByTestId('source-menu')).toBeInTheDocument()

    const runAction = within(toolbar).getByRole('button', { name: 'Run cell' })
    expect(runAction).toHaveAttribute('data-slot', 'explorer-toolbar-action')
    expect(runAction).toHaveAttribute('data-size', 'tiny')
    expect(runAction).toHaveClass('w-7', 'px-0')
  })

  it('supports labeled actions and forwards refs and native props', () => {
    const actionRef = createRef<HTMLButtonElement>()

    render(
      <ExplorerToolbar
        aria-label="Notebook toolbar"
        className="custom-toolbar"
        data-density="compact"
      >
        <ExplorerToolbarTitle>Authentication health</ExplorerToolbarTitle>
        <ExplorerToolbarActions>
          <ExplorerToolbarAction ref={actionRef} data-command="analyze">
            Analyze
          </ExplorerToolbarAction>
        </ExplorerToolbarActions>
      </ExplorerToolbar>
    )

    const toolbar = screen.getByRole('toolbar', { name: 'Notebook toolbar' })
    const action = within(toolbar).getByRole('button', { name: 'Analyze' })

    expect(toolbar).toHaveClass('custom-toolbar')
    expect(toolbar).toHaveAttribute('data-density', 'compact')
    expect(toolbar.querySelector('[data-slot="explorer-toolbar-actions"]')).toHaveClass('gap-px')
    expect(action).toHaveAttribute('data-command', 'analyze')
    expect(action).not.toHaveClass('w-7')
    expect(actionRef.current).toBe(action)
  })

  it('defaults its height but lets a consumer drive it', () => {
    const { rerender } = render(<ExplorerToolbar aria-label="Default height" />)

    // The header height variable stays consumer-owned, but it carries a fallback
    // so apps that leave it unset keep the default row instead of an invalid
    // declaration the browser drops.
    expect(screen.getByRole('toolbar')).toHaveClass('h-10')
    expect(screen.getByRole('toolbar').className).toContain('var(--header-height,2.5rem)')

    rerender(<ExplorerToolbar aria-label="Taller height" className="h-12" />)

    const toolbar = screen.getByRole('toolbar')
    expect(toolbar).toHaveClass('h-12')
    expect(toolbar).not.toHaveClass('h-10')
  })
})
