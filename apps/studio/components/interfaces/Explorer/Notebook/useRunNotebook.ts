import { useRef, useState } from 'react'
import { type Snapshot } from 'valtio'

import { type QueryEditorHandle } from '../QueryEditor'
import { findQueryCellsMatchingSql, isMutatingSql } from './notebook.utils'
import { type PendingQueryMatches } from './RunNotebookConfirmationModal'
import { checkDestructiveQuery } from '@/components/interfaces/SQLEditor/SQLEditor.utils'
import { isQueryCell, type Cell } from '@/data/content/notebooks/notebook-schema'

interface UseRunNotebookOptions {
  /** Read when a run starts, so a store-backed caller can hand back its latest cells. */
  getCells: () => readonly Snapshot<Cell>[]
  /** Called right before any cells run. */
  onBeforeRun?: () => void
}

const getQueryCellIds = (cells: readonly Snapshot<Cell>[]) =>
  cells.filter(isQueryCell).map((cell) => cell._id)

/**
 * Runs every query cell in a notebook, asking first when any cell writes to data or schema.
 * Each query cell registers its editor through `registerQueryCell`; spread
 * `confirmationModalProps` onto a `RunNotebookConfirmationModal`.
 */
export function useRunNotebook({ getCells, onBeforeRun }: UseRunNotebookOptions) {
  const queryCellRefs = useRef(new Map<string, QueryEditorHandle>())
  const [isRunning, setIsRunning] = useState(false)
  const [pendingQueryMatches, setPendingQueryMatches] = useState<PendingQueryMatches | null>(null)
  const [skipMutatingCells, setSkipMutatingCells] = useState(false)

  const registerQueryCell = (cellId: string) => (instance: QueryEditorHandle | null) => {
    if (instance) queryCellRefs.current.set(cellId, instance)
    else queryCellRefs.current.delete(cellId)
  }

  const runCells = async ({ cellIds, force = false }: { cellIds: string[]; force?: boolean }) => {
    onBeforeRun?.()
    setIsRunning(true)

    try {
      await Promise.allSettled(
        cellIds.map((cellId) => queryCellRefs.current.get(cellId)?.run(force))
      )
    } finally {
      setIsRunning(false)
    }
  }

  const runNotebook = () => {
    const cells = getCells()
    const { destructiveQueries, mutatingQueries } = findQueryCellsMatchingSql({
      cells,
      getLiveSql: (cellId) => queryCellRefs.current.get(cellId)?.getSql(),
      matchers: {
        destructiveQueries: checkDestructiveQuery,
        mutatingQueries: isMutatingSql,
      },
    })

    if (mutatingQueries.length === 0) {
      runCells({ cellIds: getQueryCellIds(cells) })
    } else {
      setSkipMutatingCells(false)
      setPendingQueryMatches({ destructiveQueries, mutatingQueries })
    }
  }

  const handleConfirm = () => {
    const mutatingCellIds = new Set(
      (pendingQueryMatches?.mutatingQueries ?? []).map((cell) => cell.id)
    )
    const queryCellIds = getQueryCellIds(getCells())
    const cellIds = skipMutatingCells
      ? queryCellIds.filter((id) => !mutatingCellIds.has(id))
      : queryCellIds

    setPendingQueryMatches(null)
    runCells({ cellIds, force: true })
  }

  return {
    queryCellRefs,
    registerQueryCell,
    isRunning,
    runNotebook,
    confirmationModalProps: {
      pendingQueryMatches,
      skipMutatingCells,
      onSkipMutatingCellsChange: setSkipMutatingCells,
      onCancel: () => setPendingQueryMatches(null),
      onConfirm: handleConfirm,
    },
  }
}
