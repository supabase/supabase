import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'

import { NotebookProposalRenderer } from './NotebookProposalRenderer'
import type { components } from '@/data/api'
import { customRender as render } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

const NOTEBOOK_ID = 'd3aadd77-7c3c-4de7-aa5c-5aa8ac270b44'

const mockNotebookRow = (overrides: Partial<Record<string, unknown>> = {}) => ({
  id: NOTEBOOK_ID,
  type: 'notebook',
  name: 'Signup funnel',
  description: '',
  favorite: false,
  folder_id: null,
  inserted_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
  visibility: 'project',
  owner_id: 1,
  project_id: 1,
  content: {
    schema_version: 1,
    cells: [
      { _tag: 'markdown_cell', _id: 'cell-1', text: 'hello' },
      { _tag: 'markdown_cell', _id: 'cell-2', text: 'world' },
    ],
  },
  ...overrides,
})

const mockContentItem = (row: ReturnType<typeof mockNotebookRow>) =>
  addAPIMock({
    method: 'get',
    path: '/platform/projects/:ref/content/item/:id',
    response: () =>
      HttpResponse.json<components['schemas']['GetUserContentByIdResponse']>(
        row as unknown as components['schemas']['GetUserContentByIdResponse']
      ),
  })

describe('NotebookProposalRenderer', () => {
  it('renders the create-mode preview and approves on confirm', async () => {
    const user = userEvent.setup()
    const onApprove = vi.fn()

    render(
      <NotebookProposalRenderer
        mode="create"
        state="approval-requested"
        confirmState="approval-requested"
        input={{
          name: 'New notebook',
          content: {
            schema_version: 1,
            cells: [{ _tag: 'markdown_cell', text: 'hello' }],
          },
        }}
        output={undefined}
        onApprove={onApprove}
        onDeny={vi.fn()}
      />
    )

    expect(screen.getByRole('toolbar', { name: 'Notebook toolbar' })).toBeInTheDocument()
    expect(screen.getByText('1 cell')).toBeInTheDocument()
    expect(screen.getByText('Assistant wants to create this notebook')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Create' }))
    expect(onApprove).toHaveBeenCalledTimes(1)
  })

  it('renders the update-mode diff once the notebook is fetched and approves on confirm', async () => {
    const user = userEvent.setup()
    const onApprove = vi.fn()
    mockContentItem(mockNotebookRow())

    render(
      <NotebookProposalRenderer
        mode="update"
        state="approval-requested"
        confirmState="approval-requested"
        input={{
          id: NOTEBOOK_ID,
          expected_updated_at: '2024-01-01T00:00:00.000Z',
          operations: [{ _tag: 'delete_cell', cell_id: 'cell-1' }],
        }}
        output={undefined}
        onApprove={onApprove}
        onDeny={vi.fn()}
      />
    )

    expect(await screen.findByText('−1')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Apply changes' }))
    expect(onApprove).toHaveBeenCalledTimes(1)
  })

  it('falls back to a raw-input admonition without dropping the confirm footer on a parse failure', async () => {
    const user = userEvent.setup()
    const onApprove = vi.fn()
    const onDeny = vi.fn()

    render(
      <NotebookProposalRenderer
        mode="create"
        state="approval-requested"
        confirmState="approval-requested"
        input={{ nonsense: true }}
        output={undefined}
        onApprove={onApprove}
        onDeny={onDeny}
      />
    )

    expect(screen.getByText("Couldn't render a preview for this notebook")).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Create' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Skip' }))
    expect(onDeny).toHaveBeenCalledTimes(1)
    expect(onApprove).not.toHaveBeenCalled()
  })

  it('withholds Apply changes and auto-denies with the failure reason when the update cannot be applied as written', async () => {
    const onApprove = vi.fn()
    const onDeny = vi.fn()
    const denyWithReason = vi.fn()
    mockContentItem(mockNotebookRow())

    render(
      <NotebookProposalRenderer
        mode="update"
        state="approval-requested"
        confirmState="approval-requested"
        input={{
          id: NOTEBOOK_ID,
          expected_updated_at: '2024-01-01T00:00:00.000Z',
          operations: [{ _tag: 'delete_cell', cell_id: 'missing' }],
        }}
        output={undefined}
        onApprove={onApprove}
        onDeny={onDeny}
        denyWithReason={denyWithReason}
      />
    )

    expect(await screen.findByText("This update can't be applied as written")).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Apply changes' })).not.toBeInTheDocument()
    expect(denyWithReason).toHaveBeenCalledWith(
      'No cell with id "missing" exists in this notebook.'
    )
    expect(onDeny).not.toHaveBeenCalled()
    expect(onApprove).not.toHaveBeenCalled()
  })

  it('falls back to sending the failure reason through Skip if auto-deny did not resolve the approval', async () => {
    const user = userEvent.setup()
    const denyWithReason = vi.fn()
    mockContentItem(mockNotebookRow())

    render(
      <NotebookProposalRenderer
        mode="update"
        state="approval-requested"
        confirmState="approval-requested"
        input={{
          id: NOTEBOOK_ID,
          expected_updated_at: '2024-01-01T00:00:00.000Z',
          operations: [{ _tag: 'delete_cell', cell_id: 'missing' }],
        }}
        output={undefined}
        denyWithReason={denyWithReason}
      />
    )

    const skipButton = await screen.findByRole('button', { name: 'Skip' })
    denyWithReason.mockClear()
    await user.click(skipButton)

    expect(denyWithReason).toHaveBeenCalledWith(
      'No cell with id "missing" exists in this notebook.'
    )
  })

  it('does not auto-deny an unapplyable update once it has already been responded to', async () => {
    const denyWithReason = vi.fn()
    mockContentItem(mockNotebookRow())

    render(
      <NotebookProposalRenderer
        mode="update"
        state="approval-responded"
        confirmState={undefined}
        input={{
          id: NOTEBOOK_ID,
          expected_updated_at: '2024-01-01T00:00:00.000Z',
          operations: [{ _tag: 'delete_cell', cell_id: 'missing' }],
        }}
        output={undefined}
        denyWithReason={denyWithReason}
      />
    )

    await screen.findByText("This update can't be applied as written")
    expect(denyWithReason).not.toHaveBeenCalled()
  })

  it('keeps the create preview and marks it successful once output is available', () => {
    render(
      <NotebookProposalRenderer
        mode="create"
        state="output-available"
        confirmState="success"
        input={{
          name: 'Signup funnel',
          content: {
            schema_version: 1,
            cells: [{ _tag: 'markdown_cell', text: 'hello' }],
          },
        }}
        output={{ id: NOTEBOOK_ID, name: 'Signup funnel' }}
      />
    )

    expect(screen.getByRole('toolbar', { name: 'Notebook toolbar' })).toBeInTheDocument()
    expect(screen.getByText('Signup funnel')).toBeInTheDocument()
    expect(screen.getByText('Notebook created')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Create' })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Open notebook' })).toHaveAttribute(
      'href',
      `/project/default/explorer/notebook/${NOTEBOOK_ID}`
    )
  })

  it('shows the notebook action after an automatic create succeeds', () => {
    render(
      <NotebookProposalRenderer
        mode="create"
        state="output-available"
        input={{
          name: 'Signup funnel',
          content: {
            schema_version: 1,
            cells: [{ _tag: 'markdown_cell', text: 'hello' }],
          },
        }}
        output={{ id: NOTEBOOK_ID, name: 'Signup funnel' }}
      />
    )

    expect(screen.getByRole('link', { name: 'Open notebook' })).toHaveAttribute(
      'href',
      `/project/default/explorer/notebook/${NOTEBOOK_ID}`
    )
  })

  it('shows the notebook action after an automatic update succeeds', () => {
    render(
      <NotebookProposalRenderer
        mode="update"
        state="output-available"
        input={{
          id: NOTEBOOK_ID,
          expected_updated_at: '2024-01-01T00:00:00.000Z',
          operations: [{ _tag: 'delete_cell', cell_id: 'cell-1' }],
        }}
        output={{ id: NOTEBOOK_ID, name: 'Signup funnel' }}
      />
    )

    expect(screen.getByRole('link', { name: 'Open notebook' })).toHaveAttribute(
      'href',
      `/project/default/explorer/notebook/${NOTEBOOK_ID}`
    )
  })

  it('does not show the "can\'t be applied" warning for a completed update whose target cell no longer exists', async () => {
    mockContentItem(
      mockNotebookRow({
        content: {
          schema_version: 1,
          cells: [{ _tag: 'markdown_cell', _id: 'cell-2', text: 'world' }],
        },
      })
    )

    render(
      <NotebookProposalRenderer
        mode="update"
        state="output-available"
        input={{
          id: NOTEBOOK_ID,
          expected_updated_at: '2024-01-01T00:00:00.000Z',
          operations: [{ _tag: 'delete_cell', cell_id: 'cell-1' }],
        }}
        output={{ id: NOTEBOOK_ID, name: 'Signup funnel' }}
      />
    )

    await waitFor(() => expect(screen.queryByText('Loading notebook...')).not.toBeInTheDocument())
    expect(screen.queryByText("This update can't be applied as written")).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Open notebook' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Open notebook' })).toHaveAttribute(
      'href',
      `/project/default/explorer/notebook/${NOTEBOOK_ID}`
    )
  })

  it('shows the notebook action inside the Confirm footer for a manually approved completed update', async () => {
    mockContentItem(
      mockNotebookRow({
        content: {
          schema_version: 1,
          cells: [{ _tag: 'markdown_cell', _id: 'cell-2', text: 'world' }],
        },
      })
    )

    render(
      <NotebookProposalRenderer
        mode="update"
        state="output-available"
        confirmState="success"
        input={{
          id: NOTEBOOK_ID,
          expected_updated_at: '2024-01-01T00:00:00.000Z',
          operations: [{ _tag: 'delete_cell', cell_id: 'cell-1' }],
        }}
        output={{ id: NOTEBOOK_ID, name: 'Signup funnel' }}
      />
    )

    const openNotebookLink = await screen.findByRole('link', { name: 'Open notebook' })
    expect(openNotebookLink).toHaveAttribute(
      'href',
      `/project/default/explorer/notebook/${NOTEBOOK_ID}`
    )
    expect(screen.queryByText("This update can't be applied as written")).not.toBeInTheDocument()
  })

  it('derives the diff against live content for a denied update', async () => {
    mockContentItem(mockNotebookRow())

    render(
      <NotebookProposalRenderer
        mode="update"
        state="output-denied"
        confirmState="denied"
        input={{
          id: NOTEBOOK_ID,
          expected_updated_at: '2024-01-01T00:00:00.000Z',
          operations: [{ _tag: 'delete_cell', cell_id: 'cell-1' }],
        }}
        output={undefined}
      />
    )

    expect(await screen.findByText('−1')).toBeInTheDocument()
  })

  it('derives the diff against live content for an errored update', async () => {
    mockContentItem(mockNotebookRow())

    render(
      <NotebookProposalRenderer
        mode="update"
        state="output-error"
        confirmState="error"
        input={{
          id: NOTEBOOK_ID,
          expected_updated_at: '2024-01-01T00:00:00.000Z',
          operations: [{ _tag: 'delete_cell', cell_id: 'cell-1' }],
        }}
        output={undefined}
      />
    )

    expect(await screen.findByText('−1')).toBeInTheDocument()
  })

  it('keeps the create preview and marks it failed when the tool errors', () => {
    render(
      <NotebookProposalRenderer
        mode="create"
        state="output-error"
        confirmState="error"
        input={{
          name: 'New notebook',
          content: {
            schema_version: 1,
            cells: [{ _tag: 'markdown_cell', text: 'hello' }],
          },
        }}
        output={undefined}
      />
    )

    expect(screen.getByRole('toolbar', { name: 'Notebook toolbar' })).toBeInTheDocument()
    expect(screen.getByText('New notebook')).toBeInTheDocument()
    expect(screen.getByText('Failed to create notebook')).toBeInTheDocument()
  })

  it('keeps the preview in the message after skip', () => {
    render(
      <NotebookProposalRenderer
        mode="create"
        state="output-denied"
        input={{
          name: 'New notebook',
          content: {
            schema_version: 1,
            cells: [{ _tag: 'markdown_cell', text: 'hello' }],
          },
        }}
        output={undefined}
      />
    )

    expect(screen.getByRole('toolbar', { name: 'Notebook toolbar' })).toBeInTheDocument()
    expect(screen.getByText('New notebook')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Create' })).not.toBeInTheDocument()
    expect(screen.queryByText('Skipped notebook creation')).not.toBeInTheDocument()
  })
})
