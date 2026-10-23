import { pdf } from '@react-pdf/renderer'
import saveAs from 'file-saver'
import type { Snapshot } from 'valtio'

import { type QueryResult } from '../types'
import { NotebookPdfDocument } from './NotebookPdfDocument'
import { isQueryCell, type Cell } from '@/data/content/notebooks/notebook-schema'

export interface ExportNotebookToPdfParams {
  name: string
  projectName?: string
  cells: readonly Snapshot<Cell>[]
  // The notebook's `as_of`, which relative log ranges count back from
  asOf?: string | null
  getResult: (cellId: string) => QueryResult | undefined
}

/**
 * Gathers a notebook's cells and each query cell's last in-session result — results aren't
 * persisted with the notebook, so they're read off the same `queryCellRefs` imperative
 * handles `notebookToMarkdown` (ExplorerNotebookTab.utils.ts) already uses — then renders
 * and downloads a PDF report.
 */
export async function exportNotebookToPdf({
  name,
  projectName,
  cells,
  asOf,
  getResult,
}: ExportNotebookToPdfParams): Promise<void> {
  const results = new Map<string, QueryResult>()
  cells.filter(isQueryCell).forEach((cell) => {
    const result = getResult(cell._id)
    if (result) results.set(cell._id, result)
  })

  const blob = await pdf(
    <NotebookPdfDocument
      name={name}
      projectName={projectName}
      cells={cells}
      asOf={asOf}
      results={results}
    />
  ).toBlob()

  saveAs(blob, `${name}.pdf`)
}
