import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createQueryCellSkeleton } from '../utils'
import { QueryCellEditor } from './QueryCellEditor'
import { customRender } from '@/tests/lib/custom-render'
import { setupSqlEditorMocks } from '@/tests/lib/sql-editor-test-utils'

vi.mock('common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('common')>()
  return {
    ...actual,
    IS_PLATFORM: true,
    useParams: () => ({ ref: 'default' }),
    useFlag: () => false,
  }
})

vi.mock('@/components/ui/CodeEditor/CodeEditor', () => ({
  CodeEditor: ({ value, isReadOnly }: { value: string; isReadOnly?: boolean }) => (
    <textarea aria-label="SQL editor" value={value} readOnly={isReadOnly} onChange={() => {}} />
  ),
}))

vi.mock('../QueryEditor/QuerySourceMenu', () => ({
  QuerySourceMenu: () => <div>Query source menu</div>,
}))

const cell = createQueryCellSkeleton({ title: 'Signups', sql: 'select 1' })

// The display settings trigger is icon-only, with its label in a hover tooltip
const queryDisplaySettingsButton = () => document.querySelector('button:has(.lucide-settings2)')

beforeEach(() => {
  setupSqlEditorMocks()
})

describe('QueryCellEditor', () => {
  it('lets a cell with onCellChange edit its SQL, title, source and display', () => {
    customRender(
      <QueryCellEditor cell={cell} onCellChange={vi.fn()} showQuery onShowQueryChange={vi.fn()} />
    )

    expect(screen.getByRole('textbox', { name: 'SQL editor' })).not.toHaveAttribute('readonly')
    expect(screen.getByRole('button', { name: 'Signups' })).toBeInTheDocument()
    expect(screen.getByText('Query source menu')).toBeInTheDocument()
    expect(queryDisplaySettingsButton()).toBeInTheDocument()
  })
})
