import { useMemo } from 'react'

import { useData, useView } from '../Trace'
import type { VisibleRow } from '../types'
import { flattenTree, indexRowsById } from '../utils'

export interface UseVisibleRowsResult {
  rows: readonly VisibleRow[]
  rowIndexById: ReadonlyMap<string, number>
  totalCount: number
  matchCount: number | null
}

export function useVisibleRows(): UseVisibleRowsResult {
  const index = useData()
  const { collapsed, matchIds } = useView()

  return useMemo(() => {
    const rows = flattenTree(index, collapsed, matchIds)
    return {
      rows,
      rowIndexById: indexRowsById(rows),
      totalCount: index.byId.size,
      matchCount: matchIds ? matchIds.size : null,
    }
  }, [index, collapsed, matchIds])
}
