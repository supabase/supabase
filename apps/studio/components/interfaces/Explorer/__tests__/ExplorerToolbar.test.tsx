import { screen, within } from '@testing-library/react'
import { createRef } from 'react'
import { describe, expect, it } from 'vitest'

import {
  ExplorerToolbar,
  ExplorerToolbarAction,
  ExplorerToolbarActions,
  ExplorerToolbarIcon,
  ExplorerToolbarTitle,
} from '../ExplorerToolbar'
import { customRender as render } from '@/tests/lib/custom-render'

describe('ExplorerToolbar', () => {
  it('composes the icon, title, icon and labeled actions, and forwards refs and native props', () => {
    const actionRef = createRef<HTMLButtonElement>()

    render(
      <ExplorerToolbar aria-label="Explorer query toolbar" data-density="compact">
        <ExplorerToolbarIcon>Q</ExplorerToolbarIcon>
        <ExplorerToolbarTitle>Weekly signups</ExplorerToolbarTitle>
        <ExplorerToolbarActions>
          <span data-testid="source-menu">Database</span>
          <ExplorerToolbarAction aria-label="Run cell" icon={<span>R</span>} />
          <ExplorerToolbarAction ref={actionRef} data-command="analyze">
            Analyze
          </ExplorerToolbarAction>
        </ExplorerToolbarActions>
      </ExplorerToolbar>
    )

    const toolbar = screen.getByRole('toolbar', { name: 'Explorer query toolbar' })
    expect(toolbar).toHaveAttribute('data-density', 'compact')
    expect(toolbar).toHaveTextContent('Q')
    expect(toolbar).toHaveTextContent('Weekly signups')
    expect(within(toolbar).getByTestId('source-menu')).toBeInTheDocument()
    expect(within(toolbar).getByRole('button', { name: 'Run cell' })).toBeInTheDocument()

    const action = within(toolbar).getByRole('button', { name: 'Analyze' })
    expect(action).toHaveAttribute('data-command', 'analyze')
    expect(actionRef.current).toBe(action)
  })
})
