import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { mockAnimationsApi } from 'jsdom-testing-mocks'
import { describe, expect, it, vi } from 'vitest'

import { LOGS_VIEW_VERSION, type LogsView } from '../UnifiedLogs.views'
import { LogsViewsPanel } from './LogsViewsPanel'
import { customRender } from '@/tests/lib/custom-render'

mockAnimationsApi()

const buildView = (id: string, name: string, columns: string[]): LogsView => ({
  id,
  name,
  type: 'logs_view',
  version: LOGS_VIEW_VERSION,
  logSource: 'edge_logs',
  filters: {
    logicalOperator: 'AND',
    conditions: columns.map((column) => ({
      propertyName: column,
      operator: '=',
      value: 'error',
    })),
  },
  viewOptions: {},
})

const errorsView = buildView('view-1', 'Errors only', ['level'])
const authView = buildView('view-2', 'Auth failures', ['level', 'source'])

const baseProps = {
  views: [errorsView, authView],
  isLoading: false,
  isError: false,
  activeViewId: null,
  onApply: vi.fn(),
  onReviewChanges: vi.fn(),
  onDuplicate: vi.fn(),
  onRename: vi.fn(),
  onDelete: vi.fn(),
  onCancelSave: vi.fn(),
  onSubmitSave: vi.fn(),
}

describe('LogsViewsPanel', () => {
  it('lists each view', async () => {
    customRender(<LogsViewsPanel {...baseProps} />)

    expect(await screen.findByText('Errors only')).toBeInTheDocument()
    expect(screen.getByText('Auth failures')).toBeInTheDocument()
  })

  it('offers rename and delete behind the row menu', async () => {
    customRender(<LogsViewsPanel {...baseProps} />)

    expect(screen.queryByRole('menuitem', { name: 'Rename' })).toBeNull()

    await userEvent.click(
      await screen.findByRole('button', { name: 'View options for Errors only' })
    )

    expect(await screen.findByRole('menuitem', { name: 'Rename' })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Delete' })).toBeInTheDocument()
  })

  it('disables the menu actions without write access', async () => {
    customRender(<LogsViewsPanel {...baseProps} canUpdate={false} canDelete={false} />)

    await userEvent.click(
      await screen.findByRole('button', { name: 'View options for Errors only' })
    )

    expect(await screen.findByRole('menuitem', { name: 'Rename' })).toHaveAttribute(
      'aria-disabled',
      'true'
    )
    expect(screen.getByRole('menuitem', { name: 'Delete' })).toHaveAttribute(
      'aria-disabled',
      'true'
    )
  })

  it('applies a view when its row is clicked', async () => {
    const onApply = vi.fn()
    customRender(<LogsViewsPanel {...baseProps} onApply={onApply} />)

    await userEvent.click(await screen.findByText('Errors only'))

    expect(onApply).toHaveBeenCalledWith(errorsView)
  })

  it('marks the active view as modified', async () => {
    customRender(<LogsViewsPanel {...baseProps} activeViewId="view-1" isActiveViewModified />)

    expect(await screen.findByText('Modified')).toBeInTheDocument()
  })

  it('reviews changes instead of re-applying when the active view is modified', async () => {
    const onApply = vi.fn()
    const onReviewChanges = vi.fn()
    customRender(
      <LogsViewsPanel
        {...baseProps}
        activeViewId="view-1"
        isActiveViewModified
        onApply={onApply}
        onReviewChanges={onReviewChanges}
      />
    )

    await userEvent.click(await screen.findByText('Errors only'))

    expect(onReviewChanges).toHaveBeenCalledOnce()
    expect(onApply).not.toHaveBeenCalled()
  })

  it('re-applies the active view when it is unmodified', async () => {
    const onApply = vi.fn()
    const onReviewChanges = vi.fn()
    customRender(
      <LogsViewsPanel
        {...baseProps}
        activeViewId="view-1"
        onApply={onApply}
        onReviewChanges={onReviewChanges}
      />
    )

    await userEvent.click(await screen.findByText('Errors only'))

    expect(onApply).toHaveBeenCalledWith(errorsView)
    expect(onReviewChanges).not.toHaveBeenCalled()
  })

  it('applies a different view normally while another is modified', async () => {
    const onApply = vi.fn()
    const onReviewChanges = vi.fn()
    customRender(
      <LogsViewsPanel
        {...baseProps}
        activeViewId="view-1"
        isActiveViewModified
        onApply={onApply}
        onReviewChanges={onReviewChanges}
      />
    )

    await userEvent.click(await screen.findByText('Auth failures'))

    expect(onApply).toHaveBeenCalledWith(authView)
    expect(onReviewChanges).not.toHaveBeenCalled()
  })

  it('filters the list by search', async () => {
    customRender(<LogsViewsPanel {...baseProps} />)

    await userEvent.type(await screen.findByPlaceholderText('Search views'), 'auth')

    expect(screen.getByText('Auth failures')).toBeInTheDocument()
    expect(screen.queryByText('Errors only')).toBeNull()
  })

  it('still lists presets when the user has saved nothing', async () => {
    customRender(<LogsViewsPanel {...baseProps} views={[]} />)

    expect(await screen.findByRole('heading', { name: 'Preset views' })).toBeInTheDocument()
    expect(screen.getByText('Errors')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Saved views' })).toBeInTheDocument()
    expect(
      screen.getByText('Filter your logs, then save the combination to come back to it later.')
    ).toBeInTheDocument()
  })

  it('lists the presets above the saved views', async () => {
    customRender(<LogsViewsPanel {...baseProps} />)

    expect(await screen.findByRole('heading', { name: 'Preset views' })).toBeInTheDocument()
    for (const name of ['Errors', 'Failed requests', 'Database health']) {
      expect(screen.getByText(name)).toBeInTheDocument()
    }
  })

  it('offers only Duplicate on a preset row', async () => {
    customRender(<LogsViewsPanel {...baseProps} />)

    await userEvent.click(await screen.findByRole('button', { name: 'View options for Errors' }))

    expect(await screen.findByRole('menuitem', { name: 'Duplicate' })).toBeInTheDocument()
    expect(screen.queryByRole('menuitem', { name: 'Rename' })).toBeNull()
    expect(screen.queryByRole('menuitem', { name: 'Delete' })).toBeNull()
  })

  it('duplicates a preset into a saved view', async () => {
    const onDuplicate = vi.fn().mockResolvedValue(undefined)
    customRender(<LogsViewsPanel {...baseProps} onDuplicate={onDuplicate} />)

    await userEvent.click(await screen.findByRole('button', { name: 'View options for Errors' }))
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Duplicate' }))

    expect(await screen.findByRole('dialog', { name: 'Duplicate view' })).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Enter a name for this view')).toHaveValue('Errors copy')

    fireEvent.click(screen.getByRole('button', { name: 'Save view' }))

    await waitFor(() =>
      expect(onDuplicate).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'preset:errors' }),
        'Errors copy'
      )
    )
  })

  it('applies a preset like any other view', async () => {
    const onApply = vi.fn()
    customRender(<LogsViewsPanel {...baseProps} onApply={onApply} />)

    await userEvent.click(await screen.findByText('Database health'))

    expect(onApply).toHaveBeenCalledWith(expect.objectContaining({ id: 'preset:database-health' }))
  })

  it('searches across presets and saved views', async () => {
    customRender(<LogsViewsPanel {...baseProps} />)

    await userEvent.type(await screen.findByPlaceholderText('Search views'), 'err')

    expect(screen.getByText('Errors')).toBeInTheDocument()
    expect(screen.getByText('Errors only')).toBeInTheDocument()
    expect(screen.queryByText('Database health')).toBeNull()
    expect(screen.queryByText('Auth failures')).toBeNull()
  })

  it('offers a retry when loading failed', async () => {
    const onRetry = vi.fn()
    customRender(<LogsViewsPanel {...baseProps} views={[]} isError onRetry={onRetry} />)

    await userEvent.click(await screen.findByRole('button', { name: 'Retry' }))

    expect(onRetry).toHaveBeenCalledOnce()
  })

  it('announces loading, errors, and the result count via a status region', async () => {
    const { rerender } = customRender(<LogsViewsPanel {...baseProps} isLoading />)

    expect(screen.getByRole('status')).toHaveTextContent('Loading views...')

    rerender(<LogsViewsPanel {...baseProps} isError />)
    expect(screen.getByRole('status')).toHaveTextContent('Failed to load views.')

    rerender(<LogsViewsPanel {...baseProps} />)
    expect(screen.getByRole('status')).toHaveTextContent('5 views found')

    await userEvent.type(await screen.findByPlaceholderText('Search views'), 'nonexistent')
    expect(screen.getByRole('status')).toHaveTextContent('No views found')
  })

  it('opens the save dialog only while saving', async () => {
    const { rerender } = customRender(<LogsViewsPanel {...baseProps} />)

    expect(screen.queryByRole('dialog', { name: 'Save view' })).toBeNull()

    rerender(<LogsViewsPanel {...baseProps} isSaving />)

    expect(await screen.findByRole('dialog', { name: 'Save view' })).toBeInTheDocument()
  })

  it('submits a trimmed name from the save dialog', async () => {
    const onSubmitSave = vi.fn().mockResolvedValue(undefined)
    customRender(<LogsViewsPanel {...baseProps} isSaving onSubmitSave={onSubmitSave} />)

    fireEvent.change(await screen.findByPlaceholderText('Enter a name for this view'), {
      target: { value: '  Slow requests  ' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Save view' }))

    await waitFor(() => expect(onSubmitSave).toHaveBeenCalledWith('Slow requests'))
  })

  it('blocks saving a duplicate name', async () => {
    const onSubmitSave = vi.fn()
    customRender(<LogsViewsPanel {...baseProps} isSaving onSubmitSave={onSubmitSave} />)

    fireEvent.change(await screen.findByPlaceholderText('Enter a name for this view'), {
      target: { value: 'errors only' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Save view' }))

    expect(await screen.findByText("That name's already taken. Try another.")).toBeInTheDocument()
    expect(onSubmitSave).not.toHaveBeenCalled()
  })

  it('keeps the typed name when saving fails', async () => {
    const onSubmitSave = vi.fn().mockRejectedValue(new Error('Write failed'))
    customRender(<LogsViewsPanel {...baseProps} isSaving onSubmitSave={onSubmitSave} />)

    const input = await screen.findByPlaceholderText('Enter a name for this view')
    fireEvent.change(input, { target: { value: 'Retry me' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save view' }))

    await waitFor(() => expect(onSubmitSave).toHaveBeenCalledWith('Retry me'))
    expect(input).toHaveValue('Retry me')
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Save view' })).not.toBeDisabled()
    )
  })

  it('cancels the save dialog', async () => {
    const onCancelSave = vi.fn()
    customRender(<LogsViewsPanel {...baseProps} isSaving onCancelSave={onCancelSave} />)

    await userEvent.click(await screen.findByRole('button', { name: 'Cancel' }))

    expect(onCancelSave).toHaveBeenCalledOnce()
  })

  it('opens the rename dialog pre-filled from the row menu', async () => {
    customRender(<LogsViewsPanel {...baseProps} />)

    await userEvent.click(
      await screen.findByRole('button', { name: 'View options for Errors only' })
    )
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Rename' }))

    expect(await screen.findByRole('dialog', { name: 'Rename view' })).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Enter a name for this view')).toHaveValue('Errors only')
  })
})
