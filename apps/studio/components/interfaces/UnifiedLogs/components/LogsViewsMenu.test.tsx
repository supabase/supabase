import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { mockAnimationsApi } from 'jsdom-testing-mocks'
import { describe, expect, it, vi } from 'vitest'

import type { LogsView } from '../UnifiedLogs.views'
import { LogsViewsMenu } from './LogsViewsMenu'
import { customRender } from '@/tests/lib/custom-render'

// LogsViewsMenu renders a Radix dropdown + confirmation dialog, both of which use Web Animations.
mockAnimationsApi()

const makeView = (overrides: Partial<LogsView> = {}): LogsView => ({
  id: 'view-1',
  type: 'logs_view',
  version: 1,
  name: 'Errors only',
  logSource: 'edge_logs',
  filters: {
    logicalOperator: 'AND',
    conditions: [{ propertyName: 'level', operator: '=', value: 'error' }],
  },
  viewOptions: {},
  ...overrides,
})

const baseProps = {
  views: [],
  isLoading: false,
  isError: false,
  activeViewId: null,
  onApply: vi.fn(),
  onRename: vi.fn(),
  onDelete: vi.fn(),
  onClearActiveView: vi.fn(),
}

const openMenu = async () => {
  await userEvent.click(screen.getByRole('button', { name: 'Saved views' }))
}

describe('LogsViewsMenu', () => {
  it('shows an empty state when there are no views', async () => {
    customRender(<LogsViewsMenu {...baseProps} />)

    await openMenu()

    expect(await screen.findByText("You haven't saved any views yet")).toBeInTheDocument()
  })

  it('shows a loading state', async () => {
    customRender(<LogsViewsMenu {...baseProps} isLoading />)

    await openMenu()

    expect(screen.getByRole('menuitem', { hidden: true })).toHaveAttribute('aria-disabled', 'true')
  })

  it('shows an error state', async () => {
    customRender(<LogsViewsMenu {...baseProps} isError />)

    await openMenu()

    expect(await screen.findByText('Failed to load views. Retry')).toBeInTheDocument()
  })

  it('lists views by name', async () => {
    const view = makeView()
    customRender(<LogsViewsMenu {...baseProps} views={[view]} />)

    await openMenu()

    expect(await screen.findByText('Errors only')).toBeInTheDocument()
  })

  it('highlights the active view in the list', async () => {
    const view = makeView()
    customRender(<LogsViewsMenu {...baseProps} views={[view]} activeViewId={view.id} />)

    await openMenu()

    const row = (await screen.findByText('Errors only')).closest('[role="menuitem"]')
    expect(row).toHaveClass('bg-foreground-lighter/10')
  })

  it('does not show a modified indicator or an Update action on the row anymore', async () => {
    const view = makeView()
    customRender(<LogsViewsMenu {...baseProps} views={[view]} activeViewId={view.id} />)

    await openMenu()

    expect(screen.queryByText('(modified)')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Update' })).not.toBeInTheDocument()
  })

  it('shows the trigger in a primary state when a view is active', async () => {
    customRender(<LogsViewsMenu {...baseProps} views={[makeView()]} activeViewId="view-1" />)

    expect(screen.getByRole('button', { name: 'Saved views' })).toHaveClass('bg-primary-solid')
  })

  it('does not show the trigger as active when no view is active', async () => {
    customRender(<LogsViewsMenu {...baseProps} views={[makeView()]} />)

    expect(screen.getByRole('button', { name: 'Saved views' })).not.toHaveClass('bg-primary-solid')
  })

  it('applies a view when its row is clicked', async () => {
    const view = makeView()
    const onApply = vi.fn()
    customRender(<LogsViewsMenu {...baseProps} views={[view]} onApply={onApply} />)

    await openMenu()
    await userEvent.click(await screen.findByText('Errors only'))

    expect(onApply).toHaveBeenCalledWith(view)
  })

  it('renames a view inline', async () => {
    const view = makeView()
    const onRename = vi.fn()
    customRender(<LogsViewsMenu {...baseProps} views={[view]} onRename={onRename} />)

    await openMenu()
    await userEvent.click(screen.getByRole('button', { name: 'Rename Errors only' }))

    const input = await screen.findByDisplayValue('Errors only')
    // Types real keystrokes (rather than fireEvent.change) so a regression where
    // character keydowns leak to Radix's menu-level typeahead and steal focus away
    // from the input would fail this test.
    await userEvent.type(input, ' - renamed')
    expect(input).toHaveFocus()
    fireEvent.keyDown(input, { key: 'Enter' })

    await waitFor(() =>
      expect(screen.queryByDisplayValue('Errors only - renamed')).not.toBeInTheDocument()
    )
    expect(onRename).toHaveBeenCalledWith('view-1', 'Errors only - renamed')
  })

  it('deletes a view after confirmation', async () => {
    const view = makeView()
    const onDelete = vi.fn()
    customRender(<LogsViewsMenu {...baseProps} views={[view]} onDelete={onDelete} />)

    await openMenu()
    await userEvent.click(screen.getByRole('button', { name: 'Delete Errors only' }))
    await userEvent.click(await screen.findByRole('button', { name: 'Delete view' }))

    await waitFor(() =>
      expect(screen.queryByRole('button', { name: 'Delete view' })).not.toBeInTheDocument()
    )
    expect(onDelete).toHaveBeenCalledWith('view-1')
  })

  it('only shows "Clear all views" when a view is active', async () => {
    customRender(<LogsViewsMenu {...baseProps} activeViewId={null} />)
    await openMenu()
    expect(screen.queryByText('Clear all views')).not.toBeInTheDocument()
  })

  it('calls onClearActiveView when "Clear all views" is clicked', async () => {
    const onClearActiveView = vi.fn()
    const view = makeView()
    customRender(
      <LogsViewsMenu
        {...baseProps}
        views={[view]}
        activeViewId={view.id}
        onClearActiveView={onClearActiveView}
      />
    )

    await openMenu()
    await userEvent.click(await screen.findByText('Clear all views'))

    expect(onClearActiveView).toHaveBeenCalledOnce()
  })
})
