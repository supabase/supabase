import { fireEvent, screen } from '@testing-library/react'
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
  views: [] as LogsView[],
  isLoading: false,
  isError: false,
  activeViewId: null,
  hasActiveFilters: false,
  onApply: vi.fn(),
  onRename: vi.fn(),
  onDelete: vi.fn(),
  onSaveCurrentView: vi.fn(),
}

const openMenu = async () => {
  await userEvent.click(screen.getByRole('button', { name: 'Saved views' }))
}

describe('LogsViewsMenu', () => {
  it('shows an empty state when there are no views', async () => {
    customRender(<LogsViewsMenu {...baseProps} />)

    await openMenu()

    expect(await screen.findByText('No saved views yet')).toBeInTheDocument()
  })

  it('shows a loading state', async () => {
    customRender(<LogsViewsMenu {...baseProps} isLoading />)

    await openMenu()

    expect(screen.getByRole('menuitem', { hidden: true })).toHaveAttribute('aria-disabled', 'true')
  })

  it('shows an error state', async () => {
    customRender(<LogsViewsMenu {...baseProps} isError />)

    await openMenu()

    expect(await screen.findByText('Failed to load views')).toBeInTheDocument()
  })

  it('lists views with their active filter count', async () => {
    const view = makeView()
    customRender(<LogsViewsMenu {...baseProps} views={[view]} />)

    await openMenu()

    expect(await screen.findByText('Errors only')).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument()
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
    fireEvent.change(input, { target: { value: 'Warnings and errors' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(onRename).toHaveBeenCalledWith('view-1', 'Warnings and errors')
  })

  it('deletes a view after confirmation', async () => {
    const view = makeView()
    const onDelete = vi.fn()
    customRender(<LogsViewsMenu {...baseProps} views={[view]} onDelete={onDelete} />)

    await openMenu()
    await userEvent.click(screen.getByRole('button', { name: 'Delete Errors only' }))
    await userEvent.click(await screen.findByRole('button', { name: 'Delete view' }))

    expect(onDelete).toHaveBeenCalledWith('view-1')
  })

  it('only shows "Save current filters as view" when there are active filters', async () => {
    customRender(<LogsViewsMenu {...baseProps} hasActiveFilters={false} />)
    await openMenu()
    expect(screen.queryByText('Save current filters as view')).not.toBeInTheDocument()
  })

  it('calls onSaveCurrentView when the save item is clicked', async () => {
    const onSaveCurrentView = vi.fn()
    customRender(
      <LogsViewsMenu {...baseProps} hasActiveFilters onSaveCurrentView={onSaveCurrentView} />
    )

    await openMenu()
    await userEvent.click(await screen.findByText('Save current filters as view'))

    expect(onSaveCurrentView).toHaveBeenCalledOnce()
  })
})
