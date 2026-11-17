import { act, fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { mockAnimationsApi } from 'jsdom-testing-mocks'
import { describe, expect, it, vi } from 'vitest'

import type { LogsView } from '../UnifiedLogs.views'
import { LogsViewsBar } from './LogsViewsBar'
import { customRender } from '@/tests/lib/custom-render'

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

// The chip menu and the delete confirmation both use Web Animations.
mockAnimationsApi()

const baseProps = {
  views: [],
  isLoading: false,
  isError: false,
  activeViewId: null,
  onApply: vi.fn(),
  onClearActiveView: vi.fn(),
  onRename: vi.fn(),
  onDelete: vi.fn(),
}

const openChipMenu = async (name: string) => {
  await userEvent.click(screen.getByRole('button', { name: `Actions for ${name}` }))
}

const SAVE_LABEL = 'Save current filters as a view'

describe('LogsViewsBar', () => {
  it('applies a view when its name is clicked', async () => {
    const view = makeView()
    const onApply = vi.fn()
    customRender(<LogsViewsBar {...baseProps} views={[view]} onApply={onApply} />)

    await userEvent.click(screen.getByRole('button', { name: 'Errors only' }))

    expect(onApply).toHaveBeenCalledWith(view)
  })

  it('clears the active view from the Clear button', async () => {
    const onClearActiveView = vi.fn()
    const view = makeView()
    customRender(
      <LogsViewsBar
        {...baseProps}
        views={[view]}
        activeViewId={view.id}
        onClearActiveView={onClearActiveView}
      />
    )

    await userEvent.click(screen.getByRole('button', { name: 'Clear view' }))

    expect(onClearActiveView).toHaveBeenCalledOnce()
  })

  it('marks only the active chip with aria-current', () => {
    const view = makeView()
    customRender(<LogsViewsBar {...baseProps} views={[view]} activeViewId={view.id} />)

    expect(screen.getByRole('button', { name: 'Errors only' })).toHaveAttribute(
      'aria-current',
      'true'
    )
  })

  it('marks no chip as current when no view is active', () => {
    customRender(<LogsViewsBar {...baseProps} views={[makeView()]} activeViewId={null} />)

    expect(screen.getByRole('button', { name: 'Errors only' })).not.toHaveAttribute('aria-current')
  })

  it('renders an actions button on every view chip, active or not', () => {
    const view = makeView()
    customRender(
      <LogsViewsBar
        {...baseProps}
        views={[view, makeView({ id: 'view-2', name: 'Slow requests' })]}
        activeViewId={view.id}
      />
    )

    expect(screen.getByRole('button', { name: 'Actions for Errors only' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Actions for Slow requests' })).toBeInTheDocument()
  })

  it('only shows Clear view when a view is active', () => {
    const view = makeView()
    const { unmount } = customRender(<LogsViewsBar {...baseProps} views={[view]} />)

    expect(screen.queryByRole('button', { name: 'Clear view' })).toBeNull()
    unmount()

    customRender(<LogsViewsBar {...baseProps} views={[view]} activeViewId={view.id} />)

    expect(screen.getByRole('button', { name: 'Clear view' })).toBeInTheDocument()
  })

  it('renames a view from the chip menu dialog', async () => {
    const onRename = vi.fn()
    customRender(<LogsViewsBar {...baseProps} views={[makeView()]} onRename={onRename} />)

    await openChipMenu('Errors only')
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Rename' }))

    const input = await screen.findByDisplayValue('Errors only')
    await userEvent.type(input, ' - renamed')
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Rename view' })))

    await waitFor(() => expect(onRename).toHaveBeenCalledWith('view-1', 'Errors only - renamed'))
  })

  it('does not rename when the dialog is cancelled', async () => {
    const onRename = vi.fn()
    customRender(<LogsViewsBar {...baseProps} views={[makeView()]} onRename={onRename} />)

    await openChipMenu('Errors only')
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Rename' }))

    const input = await screen.findByDisplayValue('Errors only')
    await userEvent.type(input, ' - discarded')
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    await waitFor(() => expect(screen.queryByDisplayValue(/discarded/)).toBeNull())
    expect(onRename).not.toHaveBeenCalled()
  })

  it('disables the rename submit when the name is cleared', async () => {
    const onRename = vi.fn()
    customRender(<LogsViewsBar {...baseProps} views={[makeView()]} onRename={onRename} />)

    await openChipMenu('Errors only')
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Rename' }))

    const input = await screen.findByDisplayValue('Errors only')
    await userEvent.clear(input)

    await waitFor(() => expect(screen.getByRole('button', { name: 'Rename view' })).toBeDisabled())
    expect(onRename).not.toHaveBeenCalled()
  })

  it('deletes a view after confirmation and keeps other views untouched', async () => {
    const onDelete = vi.fn()
    const onApply = vi.fn()
    const onClearActiveView = vi.fn()
    const active = makeView({ id: 'view-1', name: 'Errors only' })
    const other = makeView({ id: 'view-2', name: 'Slow requests' })
    customRender(
      <LogsViewsBar
        {...baseProps}
        views={[active, other]}
        activeViewId={active.id}
        onDelete={onDelete}
        onApply={onApply}
        onClearActiveView={onClearActiveView}
      />
    )

    await openChipMenu('Slow requests')
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Delete' }))

    expect(
      await screen.findByText(
        'Are you sure you want to delete "Slow requests"? This will remove it for everyone in the project.'
      )
    ).toBeInTheDocument()

    await userEvent.click(await screen.findByRole('button', { name: 'Delete view' }))

    await waitFor(() => expect(onDelete).toHaveBeenCalledWith('view-2'))
    expect(onApply).not.toHaveBeenCalled()
    expect(onClearActiveView).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Errors only' })).toHaveAttribute(
      'aria-current',
      'true'
    )
  })

  it('deletes the active view without applying or clearing filters itself', async () => {
    const onDelete = vi.fn()
    const onClearActiveView = vi.fn()
    const view = makeView()
    customRender(
      <LogsViewsBar
        {...baseProps}
        views={[view]}
        activeViewId={view.id}
        onDelete={onDelete}
        onClearActiveView={onClearActiveView}
      />
    )

    await openChipMenu('Errors only')
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Delete' }))
    await userEvent.click(await screen.findByRole('button', { name: 'Delete view' }))

    await waitFor(() => expect(onDelete).toHaveBeenCalledWith('view-1'))
    expect(onClearActiveView).not.toHaveBeenCalled()
  })

  it('shows only Rename when the user cannot delete', async () => {
    customRender(<LogsViewsBar {...baseProps} views={[makeView()]} canDelete={false} />)

    await openChipMenu('Errors only')

    expect(await screen.findByRole('menuitem', { name: 'Rename' })).toBeInTheDocument()
    expect(screen.queryByRole('menuitem', { name: 'Delete' })).toBeNull()
  })

  it('shows only Delete when the user cannot update', async () => {
    customRender(<LogsViewsBar {...baseProps} views={[makeView()]} canUpdate={false} />)

    await openChipMenu('Errors only')

    expect(await screen.findByRole('menuitem', { name: 'Delete' })).toBeInTheDocument()
    expect(screen.queryByRole('menuitem', { name: 'Rename' })).toBeNull()
  })

  it('hides the actions button entirely when the user can neither update nor delete', () => {
    customRender(
      <LogsViewsBar {...baseProps} views={[makeView()]} canUpdate={false} canDelete={false} />
    )

    expect(screen.queryByRole('button', { name: 'Actions for Errors only' })).toBeNull()
    expect(screen.getByRole('button', { name: 'Errors only' })).toBeInTheDocument()
  })

  it('saves the current filters from the + button', async () => {
    const onSaveCurrentView = vi.fn()
    customRender(
      <LogsViewsBar
        {...baseProps}
        views={[makeView()]}
        activeFilterCount={1}
        onSaveCurrentView={onSaveCurrentView}
      />
    )

    const saveButton = screen.getByRole('button', { name: SAVE_LABEL })
    expect(saveButton).not.toHaveAttribute('aria-disabled', 'true')

    await userEvent.click(saveButton)

    expect(onSaveCurrentView).toHaveBeenCalledOnce()
  })

  it('keeps the + button available once views exist', () => {
    customRender(
      <LogsViewsBar
        {...baseProps}
        views={[makeView()]}
        activeFilterCount={2}
        onSaveCurrentView={vi.fn()}
      />
    )

    expect(screen.getByRole('button', { name: SAVE_LABEL })).toBeInTheDocument()
  })

  it('disables the + button with no filters configured', async () => {
    const onSaveCurrentView = vi.fn()
    customRender(
      <LogsViewsBar {...baseProps} activeFilterCount={0} onSaveCurrentView={onSaveCurrentView} />
    )

    const saveButton = screen.getByRole('button', { name: SAVE_LABEL })
    expect(saveButton).toHaveAttribute('aria-disabled', 'true')

    await userEvent.click(saveButton)

    expect(onSaveCurrentView).not.toHaveBeenCalled()
  })

  it('disables the + button without permission to create views', async () => {
    const onSaveCurrentView = vi.fn()
    customRender(
      <LogsViewsBar
        {...baseProps}
        activeFilterCount={3}
        canCreate={false}
        onSaveCurrentView={onSaveCurrentView}
      />
    )

    const saveButton = screen.getByRole('button', { name: SAVE_LABEL })
    expect(saveButton).toHaveAttribute('aria-disabled', 'true')

    await userEvent.click(saveButton)

    expect(onSaveCurrentView).not.toHaveBeenCalled()
  })

  it('shows an empty state without the trailing actions when there are no views', () => {
    customRender(<LogsViewsBar {...baseProps} onSaveCurrentView={vi.fn()} />)

    expect(screen.getByText('No saved views yet. Set some filters, then press')).toBeInTheDocument()
    expect(screen.getByText('to save them.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: SAVE_LABEL })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Clear view' })).toBeNull()
  })

  it('shows a loading state instead of the empty state', () => {
    customRender(<LogsViewsBar {...baseProps} isLoading />)

    expect(screen.queryByText(/No saved views yet/)).toBeNull()
  })

  it('keeps a status region mounted and announces each outcome', () => {
    const { rerender } = customRender(<LogsViewsBar {...baseProps} isLoading />)

    expect(screen.getByRole('status')).toHaveTextContent('Loading saved views')

    rerender(<LogsViewsBar {...baseProps} isError />)
    expect(screen.getByRole('status')).toHaveTextContent('Failed to load saved views')

    rerender(<LogsViewsBar {...baseProps} />)
    expect(screen.getByRole('status')).toHaveTextContent('No saved views')

    rerender(<LogsViewsBar {...baseProps} views={[makeView()]} />)
    expect(screen.getByRole('status')).toHaveTextContent('1 saved view')

    rerender(
      <LogsViewsBar
        {...baseProps}
        views={[makeView(), makeView({ id: 'view-2', name: 'Slow requests' })]}
      />
    )
    expect(screen.getByRole('status')).toHaveTextContent('2 saved views')
  })

  it('shows an error state and retries', async () => {
    const onRetry = vi.fn()
    customRender(<LogsViewsBar {...baseProps} isError onRetry={onRetry} />)

    expect(screen.getByText('Failed to load views')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Retry' }))

    expect(onRetry).toHaveBeenCalledOnce()
  })
})
