import { render } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { NotebookEditor } from '../NotebookEditor'
import { notebooksState } from '@/state/notebooks/notebooks-state'
import type { Notebook } from '@/state/notebooks/types'

const { mockUseParams, mockAddTab } = vi.hoisted(() => ({
  mockUseParams: vi.fn(),
  mockAddTab: vi.fn(),
}))

vi.mock('common', () => ({
  useParams: () => mockUseParams(),
}))

vi.mock('@/state/tabs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/state/tabs')>()
  return {
    ...actual,
    useTabsStateSnapshot: () => ({ addTab: mockAddTab }),
  }
})

function makeNotebook(id: string, overrides: Partial<Notebook> = {}): Notebook {
  return {
    id,
    type: 'notebook',
    name: 'My Notebook',
    description: '',
    visibility: 'project',
    favorite: false,
    owner_id: 7,
    project_id: 42,
    content: { schema_version: '1.0', cells: [] },
    ...overrides,
  }
}

describe('NotebookEditor tab registration', () => {
  beforeEach(() => {
    mockAddTab.mockClear()
    mockUseParams.mockReturnValue({ ref: 'default', id: 'notebook-1' })

    // notebooksState is a module-level singleton, so reset the state these tests touch
    for (const id of Object.keys(notebooksState.notebooks)) {
      delete notebooksState.notebooks[id]
    }
    notebooksState.needsSaving.clear()
  })

  it('registers a tab with the notebook id, type, loaded name, and metadata', () => {
    notebooksState.setNotebook({
      projectRef: 'default',
      notebook: makeNotebook('notebook-1', { name: 'My Notebook' }),
    })

    render(<NotebookEditor />)

    expect(mockAddTab).toHaveBeenCalledTimes(1)
    expect(mockAddTab).toHaveBeenCalledWith({
      id: 'notebook-notebook-1',
      type: 'notebook',
      label: 'My Notebook',
      metadata: { notebookId: 'notebook-1' },
    })
  })

  it('falls back to "New Notebook" as the label when the notebook has not loaded yet', () => {
    render(<NotebookEditor />)

    expect(mockAddTab).toHaveBeenCalledWith({
      id: 'notebook-notebook-1',
      type: 'notebook',
      label: 'New Notebook',
      metadata: { notebookId: 'notebook-1' },
    })
  })

  it('does not register a tab when there is no id in the route', () => {
    mockUseParams.mockReturnValue({ ref: 'default', id: undefined })

    render(<NotebookEditor />)

    expect(mockAddTab).not.toHaveBeenCalled()
  })
})
