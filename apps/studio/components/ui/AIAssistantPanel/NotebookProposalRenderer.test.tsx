import { screen } from '@testing-library/react'
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
      { _tag: 'markdown_cell', id: 'cell-1', text: 'hello' },
      { _tag: 'markdown_cell', id: 'cell-2', text: 'world' },
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

    expect(screen.getByText('1 cell')).toBeInTheDocument()
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

  it('warns and withholds the diff when the notebook changed since expected_updated_at', async () => {
    const onApprove = vi.fn()
    mockContentItem(mockNotebookRow({ updated_at: '2024-06-01T00:00:00.000Z' }))

    render(
      <NotebookProposalRenderer
        mode="update"
        state="approval-requested"
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
      await screen.findByText('This notebook changed since the assistant planned this update')
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Refresh' })).toBeInTheDocument()
    expect(onApprove).not.toHaveBeenCalled()
  })

  it('falls back to a raw-input admonition without dropping the confirm footer on a parse failure', async () => {
    const user = userEvent.setup()
    const onDeny = vi.fn()

    render(
      <NotebookProposalRenderer
        mode="create"
        state="approval-requested"
        input={{ nonsense: true }}
        output={undefined}
        onApprove={vi.fn()}
        onDeny={onDeny}
      />
    )

    expect(screen.getByText("Couldn't render a preview for this notebook")).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Skip' }))
    expect(onDeny).toHaveBeenCalledTimes(1)
  })

  it('renders an Open notebook link once output is available', () => {
    render(
      <NotebookProposalRenderer
        mode="create"
        state="output-available"
        input={{}}
        output={{ id: NOTEBOOK_ID, name: 'Signup funnel' }}
      />
    )

    const link = screen.getByRole('link', { name: 'Open notebook' })
    expect(link).toHaveAttribute('href', `/project/default/explorer/notebook/${NOTEBOOK_ID}`)
  })

  it('renders a muted skipped summary when output-denied', () => {
    render(
      <NotebookProposalRenderer mode="update" state="output-denied" input={{}} output={undefined} />
    )

    expect(screen.getByText('Skipped notebook update')).toBeInTheDocument()
  })
})
