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
  onRename: vi.fn(),
  onDelete: vi.fn(),
  onCancelSave: vi.fn(),
  onSubmitSave: vi.fn(),
}

describe('LogsViewsPanel', () => {
  it('lists each view with its filter count', async () => {
    customRender(<LogsViewsPanel {...baseProps} />)

    expect(await screen.findByText('Errors only')).toBeInTheDocument()
    expect(screen.getByText('1 filter')).toBeInTheDocument()
    expect(screen.getByText('Auth failures')).toBeInTheDocument()
    expect(screen.getByText('2 filters')).toBeInTheDocument()
  })

  it('applies a view when its row is clicked', async () => {
    const onApply = vi.fn()
    customRender(<LogsViewsPanel {...baseProps} onApply={onApply} />)

    await userEvent.click(await screen.findByText('Errors only'))

    expect(onApply).toHaveBeenCalledWith(errorsView)
  })

  it('marks the active view as modified', async () => {
    customRender(<LogsViewsPanel {...baseProps} activeViewId="view-1" isActiveViewModified />)

    expect(await screen.findByText('· Modified')).toBeInTheDocument()
  })

  it('filters the list by search', async () => {
    customRender(<LogsViewsPanel {...baseProps} />)

    await userEvent.type(await screen.findByPlaceholderText('Search views'), 'auth')

    expect(screen.getByText('Auth failures')).toBeInTheDocument()
    expect(screen.queryByText('Errors only')).toBeNull()
  })

  it('shows an empty state when there are no views', async () => {
    customRender(<LogsViewsPanel {...baseProps} views={[]} />)

    expect(await screen.findByText('No saved views')).toBeInTheDocument()
    expect(screen.queryByPlaceholderText('Search views')).toBeNull()
  })

  it('offers a retry when loading failed', async () => {
    const onRetry = vi.fn()
    customRender(<LogsViewsPanel {...baseProps} views={[]} isError onRetry={onRetry} />)

    await userEvent.click(await screen.findByRole('button', { name: 'Retry' }))

    expect(onRetry).toHaveBeenCalledOnce()
  })

  it('submits a trimmed name from the save row', async () => {
    const onSubmitSave = vi.fn().mockResolvedValue(undefined)
    customRender(<LogsViewsPanel {...baseProps} isSaving onSubmitSave={onSubmitSave} />)

    // `fireEvent` rather than `userEvent`: jsdom only runs the submit default
    // action for the former, so a submit button click is otherwise swallowed.
    fireEvent.change(await screen.findByPlaceholderText('Enter a name for this view'), {
      target: { value: '  Slow requests  ' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => expect(onSubmitSave).toHaveBeenCalledWith('Slow requests'))
  })

  it('blocks saving a duplicate name', async () => {
    const onSubmitSave = vi.fn()
    customRender(<LogsViewsPanel {...baseProps} isSaving onSubmitSave={onSubmitSave} />)

    await userEvent.type(
      await screen.findByPlaceholderText('Enter a name for this view'),
      'errors only'
    )

    expect(await screen.findByText("That name's already taken. Try another.")).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
    expect(onSubmitSave).not.toHaveBeenCalled()
  })

  it('keeps the typed name when saving fails', async () => {
    const onSubmitSave = vi.fn().mockRejectedValue(new Error('Write failed'))
    customRender(<LogsViewsPanel {...baseProps} isSaving onSubmitSave={onSubmitSave} />)

    const input = await screen.findByPlaceholderText('Enter a name for this view')
    fireEvent.change(input, { target: { value: 'Retry me' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => expect(onSubmitSave).toHaveBeenCalledWith('Retry me'))
    expect(input).toHaveValue('Retry me')
    await waitFor(() => expect(screen.getByRole('button', { name: 'Save' })).not.toBeDisabled())
  })

  it('cancels the save row', async () => {
    const onCancelSave = vi.fn()
    customRender(<LogsViewsPanel {...baseProps} isSaving onCancelSave={onCancelSave} />)

    await userEvent.click(await screen.findByRole('button', { name: 'Cancel' }))

    expect(onCancelSave).toHaveBeenCalledOnce()
  })
})
