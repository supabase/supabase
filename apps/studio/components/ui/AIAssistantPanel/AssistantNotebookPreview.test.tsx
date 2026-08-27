import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { AssistantNotebookPreview } from './AssistantNotebookPreview'
import type { components } from '@/data/api'
import type { NotebookCellDiffEntry } from '@/data/content/notebooks/notebook-operations'
import type { AgentCell, CellWire } from '@/data/content/notebooks/notebook-schema'
import { customRender as render } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

const wireMarkdownCell = (id: string, text: string): CellWire => ({
  _tag: 'markdown_cell',
  _id: id,
  text,
})

const agentMarkdownCell = (text: string): AgentCell => ({ _tag: 'markdown_cell', text })

const wireDatabaseCell = (id: string, database_identifier?: string): CellWire => ({
  _tag: 'database_cell',
  _id: id,
  sql: 'select 1',
  row_limit: 100,
  database_identifier,
})

const agentDatabaseCell = (database_identifier?: string): AgentCell => ({
  _tag: 'database_cell',
  sql: 'select 1',
  row_limit: 100,
  database_identifier,
})

describe('AssistantNotebookPreview', () => {
  // The whole safety argument for this feature reduces to this: agent-authored markdown text
  // is rendered as literal source (via CodeBlock), never interpreted into real DOM nodes. A
  // future refactor that swaps in <Markdown> would break this silently.
  it('never renders agent-authored cell content as real img/link/src DOM nodes', async () => {
    const user = userEvent.setup()
    const adversarialText =
      '![x](https://evil.example/) [y](https://evil.example/) <img src=x onerror=1>'
    const entries: NotebookCellDiffEntry[] = [
      { _tag: 'added', cell: agentMarkdownCell(adversarialText), operationIndex: 0 },
    ]

    const { container } = render(<AssistantNotebookPreview entries={entries} mode="update" />)
    await user.click(screen.getByRole('button', { name: 'Added Markdown cell' }))

    expect(container.querySelectorAll('img')).toHaveLength(0)
    expect(container.querySelectorAll('[href]')).toHaveLength(0)
    expect(container.querySelectorAll('[src]')).toHaveLength(0)
  })

  it('renders the create-mode header summary', () => {
    const entries: NotebookCellDiffEntry[] = [
      { _tag: 'unchanged', cell: wireMarkdownCell('a', 'one') },
      { _tag: 'unchanged', cell: wireMarkdownCell('b', 'two') },
    ]

    const { container } = render(<AssistantNotebookPreview entries={entries} mode="create" />)

    expect(screen.getByRole('toolbar', { name: 'Notebook toolbar' })).toBeInTheDocument()
    expect(screen.getByText('2 cells')).toBeInTheDocument()
    expect(screen.getByText('New notebook')).toBeInTheDocument()
    expect(container.firstElementChild).toHaveClass('max-w-6xl')
  })

  it('surfaces a metadata-only database change after resolving the target', async () => {
    addAPIMock({
      method: 'get',
      path: '/platform/projects/:ref/databases',
      response: () =>
        HttpResponse.json<components['schemas']['DatabaseDetailResponse'][]>([
          {
            identifier: 'default',
            region: 'us-east-1',
            status: 'ACTIVE_HEALTHY',
            cloud_provider: 'AWS',
            db_host: 'db.default.supabase.co',
            db_name: 'postgres',
            db_port: 5432,
            db_user: 'postgres',
            inserted_at: '2026-01-01T00:00:00.000Z',
            restUrl: 'https://default.supabase.co/rest/v1',
            size: 't4g.micro',
          },
          {
            identifier: 'default-replica-3',
            region: 'us-east-1',
            status: 'ACTIVE_HEALTHY',
            cloud_provider: 'AWS',
            db_host: 'db.default-replica-3.supabase.co',
            db_name: 'postgres',
            db_port: 5432,
            db_user: 'postgres',
            inserted_at: '2026-01-01T00:00:00.000Z',
            restUrl: 'https://default-replica-3.supabase.co/rest/v1',
            size: 't4g.micro',
          },
        ]),
    })

    const entries: NotebookCellDiffEntry[] = [
      {
        _tag: 'replaced',
        before: wireDatabaseCell('cell-1', 'default'),
        after: agentDatabaseCell('default-replica-3'),
        operationIndex: 0,
      },
    ]

    render(<AssistantNotebookPreview entries={entries} mode="update" />)

    expect(screen.getByText('Loading database…')).toBeInTheDocument()
    const metadata = await screen.findByText('Database: Primary → Database: Replica')
    expect(metadata).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Replaced Query: Untitled query' })
    ).toHaveTextContent('Database: Primary → Database: Replica')
  })

  it('hides entries past the limit behind a "Show N more" button', async () => {
    const entries: NotebookCellDiffEntry[] = Array.from({ length: 7 }, (_, index) => ({
      _tag: 'unchanged' as const,
      cell: wireMarkdownCell(`cell-${index}`, `text-${index}`),
    }))

    render(<AssistantNotebookPreview entries={entries} mode="create" />)

    expect(screen.getByText('Show 2 more cells')).toBeInTheDocument()
  })

  it('renders run results inside their matching minified notebook cell', () => {
    const entries: NotebookCellDiffEntry[] = [
      { _tag: 'unchanged', cell: wireDatabaseCell('cell-1') },
    ]

    const { container } = render(
      <AssistantNotebookPreview
        entries={entries}
        mode="run"
        title="Signup funnel"
        results={{ 'cell-1': { rows: [] } }}
      />
    )

    expect(screen.getByText('Signup funnel')).toBeInTheDocument()
    expect(screen.getByText('1 cell')).toBeInTheDocument()
    expect(screen.getByText('Success. No rows returned')).toBeInTheDocument()
    expect(screen.getByText('0 rows')).toBeInTheDocument()
    expect(container.querySelector('[data-slot="explorer-query-results"]')).toBeInTheDocument()
  })

  it('bases result rendering and layout on supplied results rather than preview mode', () => {
    const entries: NotebookCellDiffEntry[] = [
      { _tag: 'unchanged', cell: wireDatabaseCell('cell-1') },
    ]

    const { container } = render(
      <AssistantNotebookPreview
        entries={entries}
        mode="create"
        results={{ 'cell-1': { rows: [{ value: 1 }] } }}
      />
    )

    expect(screen.getByText('1 row')).toBeInTheDocument()
    expect(container.querySelector('[data-slot="explorer-query-results"]')).toBeInTheDocument()
    expect(container.querySelector('.flex.flex-col.gap-2')).toBeInTheDocument()
    expect(container.querySelector('.divide-y.divide-border')).not.toBeInTheDocument()
  })

  it('keeps a run preview without results in the grouped cell layout', () => {
    const entries: NotebookCellDiffEntry[] = [
      { _tag: 'unchanged', cell: wireDatabaseCell('cell-1') },
    ]

    const { container } = render(<AssistantNotebookPreview entries={entries} mode="run" />)

    expect(container.querySelector('[data-slot="explorer-query-results"]')).not.toBeInTheDocument()
    expect(container.querySelector('.divide-y.divide-border')).toBeInTheDocument()
  })
})
