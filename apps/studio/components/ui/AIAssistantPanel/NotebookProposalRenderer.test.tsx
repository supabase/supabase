import { cleanup, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse } from 'msw'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { NotebookProposalRenderer } from './NotebookProposalRenderer'
import type { components } from '@/data/api'
import type { SnippetStatus } from '@/data/content/snippet-status'
import { notebooksState } from '@/state/notebooks/notebooks-state'
import { customRender as render } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

const NOTEBOOK_ID = 'd3aadd77-7c3c-4de7-aa5c-5aa8ac270b44'

const mockNotebookRow = (overrides: Partial<Record<string, unknown>> = {}) => ({
  id: NOTEBOOK_ID,
  type: 'notebook' as const,
  name: 'Signup funnel',
  description: '',
  favorite: false,
  folder_id: null,
  inserted_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
  visibility: 'project' as const,
  owner_id: 1,
  project_id: 1,
  content: {
    schema_version: 1 as const,
    cells: [
      { _tag: 'markdown_cell' as const, _id: 'cell-1', text: 'hello' },
      { _tag: 'markdown_cell' as const, _id: 'cell-2', text: 'world' },
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

const setLocalNotebook = (status: SnippetStatus) => {
  notebooksState.notebooks[NOTEBOOK_ID] = {
    projectRef: 'default',
    notebook: mockNotebookRow(),
    status,
  }
}

afterEach(() => {
  cleanup()
  notebooksState.notebooks = {}
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

  it('warns about unsaved local changes without disabling update approval', async () => {
    const user = userEvent.setup()
    const onApprove = vi.fn()
    setLocalNotebook('unsaved')
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

    expect(
      await screen.findByText(
        "This notebook has unsaved local changes that aren't reflected in this preview. Approving will overwrite them on save."
      )
    ).toBeInTheDocument()

    const approveButton = screen.getByRole('button', { name: 'Apply changes' })
    expect(approveButton).toBeEnabled()
    await user.click(approveButton)
    expect(onApprove).toHaveBeenCalledTimes(1)
  })

  it.each([
    ['saved', true],
    ['absent', false],
  ])(
    'does not warn about unsaved changes when local notebook state is %s',
    async (_, hasLocalNotebook) => {
      if (hasLocalNotebook) setLocalNotebook('saved')
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
          onApprove={vi.fn()}
          onDeny={vi.fn()}
        />
      )

      expect(await screen.findByText('−1')).toBeInTheDocument()
      expect(screen.queryByText('Unsaved local changes')).not.toBeInTheDocument()
    }
  )

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

  it('renders a stable update summary after success instead of diffing against live content', () => {
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

    expect(screen.getByText('Notebook updated: Signup funnel')).toBeInTheDocument()
    expect(screen.queryByText("This update can't be applied as written")).not.toBeInTheDocument()
    expect(screen.queryByRole('toolbar', { name: 'Notebook toolbar' })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Open notebook' })).toHaveAttribute(
      'href',
      `/project/default/explorer/notebook/${NOTEBOOK_ID}`
    )
  })

  it('shows the notebook action after a manually approved completed update', async () => {
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

  it('renders the stable summary instead of a snapshot-derived delete diff after completion', () => {
    render(
      <NotebookProposalRenderer
        mode="update"
        state="output-available"
        input={{
          id: NOTEBOOK_ID,
          expected_updated_at: '2024-01-01T00:00:00.000Z',
          operations: [{ _tag: 'delete_cell', cell_id: 'cell-1' }],
        }}
        output={{
          id: NOTEBOOK_ID,
          name: 'Signup funnel',
          previous_content: {
            schema_version: 1,
            cells: [
              { _tag: 'markdown_cell', _id: 'cell-1', text: 'hello' },
              { _tag: 'markdown_cell', _id: 'cell-2', text: 'world' },
            ],
          },
        }}
      />
    )

    expect(screen.getByText('Notebook updated: Signup funnel')).toBeInTheDocument()
    expect(screen.queryByText('−1')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Open notebook' })).toHaveAttribute(
      'href',
      `/project/default/explorer/notebook/${NOTEBOOK_ID}`
    )
  })

  it('renders the stable summary instead of a snapshot-derived insert diff after completion', () => {
    render(
      <NotebookProposalRenderer
        mode="update"
        state="output-available"
        input={{
          id: NOTEBOOK_ID,
          expected_updated_at: '2024-01-01T00:00:00.000Z',
          operations: [
            {
              _tag: 'insert_cell',
              after_cell_id: 'cell-1',
              cell: { _tag: 'markdown_cell', text: 'new section' },
            },
          ],
        }}
        output={{
          id: NOTEBOOK_ID,
          name: 'Signup funnel',
          previous_content: {
            schema_version: 1,
            cells: [{ _tag: 'markdown_cell', _id: 'cell-1', text: 'hello' }],
          },
        }}
      />
    )

    expect(screen.getByText('Notebook updated: Signup funnel')).toBeInTheDocument()
    expect(screen.queryByText('+1')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Added Markdown cell' })).not.toBeInTheDocument()
  })

  it('falls back to the compact completed body when previous_content is absent', () => {
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

    expect(screen.getByText('Notebook updated: Signup funnel')).toBeInTheDocument()
    expect(screen.queryByText("This update can't be applied as written")).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Open notebook' })).toBeInTheDocument()
  })

  it('falls back to the compact completed body when the snapshot no longer matches the operations', () => {
    render(
      <NotebookProposalRenderer
        mode="update"
        state="output-available"
        input={{
          id: NOTEBOOK_ID,
          expected_updated_at: '2024-01-01T00:00:00.000Z',
          operations: [{ _tag: 'delete_cell', cell_id: 'missing' }],
        }}
        output={{
          id: NOTEBOOK_ID,
          name: 'Signup funnel',
          previous_content: {
            schema_version: 1,
            cells: [{ _tag: 'markdown_cell', _id: 'cell-1', text: 'hello' }],
          },
        }}
      />
    )

    expect(screen.getByText('Notebook updated: Signup funnel')).toBeInTheDocument()
    expect(screen.queryByText("This update can't be applied as written")).not.toBeInTheDocument()
    expect(screen.queryByText('Preview unavailable')).not.toBeInTheDocument()
  })

  it('falls back to the compact completed body when the output id does not match the requested notebook', () => {
    render(
      <NotebookProposalRenderer
        mode="update"
        state="output-available"
        input={{
          id: NOTEBOOK_ID,
          expected_updated_at: '2024-01-01T00:00:00.000Z',
          operations: [{ _tag: 'delete_cell', cell_id: 'cell-1' }],
        }}
        output={{
          id: 'some-other-notebook-id',
          name: 'Signup funnel',
          previous_content: {
            schema_version: 1,
            cells: [
              { _tag: 'markdown_cell', _id: 'cell-1', text: 'hello' },
              { _tag: 'markdown_cell', _id: 'cell-2', text: 'world' },
            ],
          },
        }}
      />
    )

    expect(screen.getByText('Notebook updated: Signup funnel')).toBeInTheDocument()
    expect(screen.queryByText('−1')).not.toBeInTheDocument()
  })

  it('renders a stable summary for a denied update without diffing against live content', () => {
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

    expect(screen.getByText('Skipped notebook update')).toBeInTheDocument()
    expect(screen.queryByText('−1')).not.toBeInTheDocument()
    expect(screen.queryByRole('toolbar', { name: 'Notebook toolbar' })).not.toBeInTheDocument()
  })

  it('renders a stable summary for an errored update without diffing against live content', () => {
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

    expect(screen.getByText('Failed to update notebook')).toBeInTheDocument()
    expect(screen.queryByText('−1')).not.toBeInTheDocument()
    expect(screen.queryByRole('toolbar', { name: 'Notebook toolbar' })).not.toBeInTheDocument()
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

  it('renders the delete-mode preview once the notebook is fetched and approves on confirm', async () => {
    const user = userEvent.setup()
    const onApprove = vi.fn()
    mockContentItem(mockNotebookRow())

    render(
      <NotebookProposalRenderer
        mode="delete"
        state="approval-requested"
        confirmState="approval-requested"
        input={{ id: NOTEBOOK_ID }}
        output={undefined}
        onApprove={onApprove}
        onDeny={vi.fn()}
      />
    )

    expect(await screen.findByText('Delete "Signup funnel"?')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Delete' }))
    expect(onApprove).toHaveBeenCalledTimes(1)
  })

  it('shows a delete-specific warning for unsaved local changes', async () => {
    setLocalNotebook('unsaved')
    mockContentItem(mockNotebookRow())

    render(
      <NotebookProposalRenderer
        mode="delete"
        state="approval-requested"
        confirmState="approval-requested"
        input={{ id: NOTEBOOK_ID }}
        output={undefined}
        onApprove={vi.fn()}
        onDeny={vi.fn()}
      />
    )

    expect(
      await screen.findByText(
        "This notebook has unsaved local changes that aren't reflected in this preview. Approving will permanently delete them."
      )
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Delete' })).toBeEnabled()
  })

  it('denies the delete proposal on skip', async () => {
    const user = userEvent.setup()
    const onDeny = vi.fn()
    mockContentItem(mockNotebookRow())

    render(
      <NotebookProposalRenderer
        mode="delete"
        state="approval-requested"
        confirmState="approval-requested"
        input={{ id: NOTEBOOK_ID }}
        output={undefined}
        onApprove={vi.fn()}
        onDeny={onDeny}
      />
    )

    await screen.findByText('Delete "Signup funnel"?')
    await user.click(screen.getByRole('button', { name: 'Skip' }))
    expect(onDeny).toHaveBeenCalledTimes(1)
  })

  it('falls back to a raw-input admonition for a delete proposal on a parse failure', async () => {
    render(
      <NotebookProposalRenderer
        mode="delete"
        state="approval-requested"
        confirmState="approval-requested"
        input={{ nonsense: true }}
        output={undefined}
        onApprove={vi.fn()}
        onDeny={vi.fn()}
      />
    )

    expect(screen.getByText("Couldn't render a preview for this notebook")).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument()
  })

  it('shows the deleted notebook name once the delete completes, without an Open notebook action', () => {
    render(
      <NotebookProposalRenderer
        mode="delete"
        state="output-available"
        confirmState="success"
        input={{ id: NOTEBOOK_ID }}
        output={{ id: NOTEBOOK_ID, name: 'Signup funnel' }}
      />
    )

    expect(screen.getByText('Notebook deleted: Signup funnel')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Open notebook' })).not.toBeInTheDocument()
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
