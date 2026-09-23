import { pdf } from '@react-pdf/renderer'
import saveAs from 'file-saver'
import { toPng } from 'html-to-image'
import type { Snapshot } from 'valtio'

import { type QueryResult } from '../types'
import { NotebookPdfDocument } from './NotebookPdfDocument'
import { isQueryCell, type Cell } from '@/data/content/notebooks/notebook-schema'

export interface ExportNotebookToPdfParams {
  name: string
  projectName?: string
  cells: readonly Snapshot<Cell>[]
  getResult: (cellId: string) => QueryResult | undefined
  /** The rendered chart's DOM node for a cell currently in chart view, for rasterization. */
  getChartElement: (cellId: string) => HTMLElement | null | undefined
}

async function captureChartImages(
  cells: readonly Snapshot<Cell>[],
  getResult: ExportNotebookToPdfParams['getResult'],
  getChartElement: ExportNotebookToPdfParams['getChartElement']
): Promise<Map<string, string>> {
  const images = new Map<string, string>()

  await Promise.all(
    cells.filter(isQueryCell).map(async (cell) => {
      if ((cell.view ?? 'table') !== 'chart') return
      if ((getResult(cell._id)?.rows ?? []).length === 0) return

      const element = getChartElement(cell._id)
      if (!element) return

      try {
        images.set(cell._id, await toPng(element))
      } catch {
        // NotebookPdfDocument falls back to a table when no image was captured for a
        // chart-view cell — e.g. the chart wasn't mounted/visible at export time.
      }
    })
  )

  return images
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
  getResult,
  getChartElement,
}: ExportNotebookToPdfParams): Promise<void> {
  const results = new Map<string, QueryResult>()
  cells.filter(isQueryCell).forEach((cell) => {
    const result = getResult(cell._id)
    if (result) results.set(cell._id, result)
  })

  const chartImages = await captureChartImages(cells, getResult, getChartElement)

  const blob = await pdf(
    <NotebookPdfDocument
      name={name}
      projectName={projectName}
      cells={cells}
      results={results}
      chartImages={chartImages}
    />
  ).toBlob()

  saveAs(blob, `${name}.pdf`)
}
