import { renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { useOnRowsChange } from './Grid.utils'

vi.mock('@/state/table-editor-table', () => ({
  useTableEditorTableStateSnapshot: () => ({
    originalTable: {
      columns: [],
      primary_keys: [],
      entity_type: 'table',
    },
    table: { id: 1 },
  }),
}))

vi.mock('../../hooks/useTableRowOperations', () => ({
  useTableRowOperations: () => ({
    editCell: vi.fn(),
  }),
}))

describe('useOnRowsChange', () => {
  it('does not throw when data.indexes is empty', () => {
    const rows = [{ idx: 0, id: 1 }]
    const { result } = renderHook(() => useOnRowsChange(rows))

    expect(() => {
      result.current(rows, { indexes: [], column: {} as any })
    }).not.toThrow()
  })

  it('does not throw when row at index does not exist', () => {
    const rows = [{ idx: 0, id: 1 }]
    const { result } = renderHook(() => useOnRowsChange(rows))

    expect(() => {
      result.current(rows, { indexes: [999], column: {} as any })
    }).not.toThrow()
  })
})
