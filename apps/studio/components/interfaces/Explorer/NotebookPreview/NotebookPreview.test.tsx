import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { NotebookPreview } from './NotebookPreview'
import type { NotebookCellDiffEntry } from '@/data/content/notebooks/notebook-operations'
import type { AgentCell, CellWire } from '@/data/content/notebooks/notebook-schema'
import { customRender as render } from '@/tests/lib/custom-render'

const wireMarkdownCell = (id: string, text: string): CellWire => ({
  _tag: 'markdown_cell',
  id,
  text,
})

const agentMarkdownCell = (text: string): AgentCell => ({ _tag: 'markdown_cell', text })

describe('NotebookPreview', () => {
  // The whole safety argument for this feature reduces to this: agent-authored markdown text
  // is rendered as literal source (via CodeBlock), never interpreted into real DOM nodes. A
  // future refactor that swaps in <Markdown> would break this silently.
  it('never renders agent-authored cell content as real img/link/src DOM nodes', () => {
    const adversarialText =
      '![x](https://evil.example/) [y](https://evil.example/) <img src=x onerror=1>'
    const entries: NotebookCellDiffEntry[] = [
      { _tag: 'added', cell: agentMarkdownCell(adversarialText), operationIndex: 0 },
    ]

    const { container } = render(<NotebookPreview entries={entries} mode="update" />)

    expect(container.querySelectorAll('img')).toHaveLength(0)
    expect(container.querySelectorAll('[href]')).toHaveLength(0)
    expect(container.querySelectorAll('[src]')).toHaveLength(0)
  })

  it('renders the create-mode header summary', () => {
    const entries: NotebookCellDiffEntry[] = [
      { _tag: 'unchanged', cell: wireMarkdownCell('a', 'one') },
      { _tag: 'unchanged', cell: wireMarkdownCell('b', 'two') },
    ]

    render(<NotebookPreview entries={entries} mode="create" />)

    expect(screen.getByText('2 cells')).toBeInTheDocument()
  })

  it('hides entries past the limit behind a "Show N more" button', async () => {
    const entries: NotebookCellDiffEntry[] = Array.from({ length: 7 }, (_, index) => ({
      _tag: 'unchanged' as const,
      cell: wireMarkdownCell(`cell-${index}`, `text-${index}`),
    }))

    render(<NotebookPreview entries={entries} mode="create" />)

    expect(screen.getByText('Show 2 more cells')).toBeInTheDocument()
  })
})
