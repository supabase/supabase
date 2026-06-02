import { untrustedSql } from '@supabase/pg-meta'
import { debounce } from 'lodash'
import { useCallback, useMemo, useRef } from 'react'

import { unmapNotebookContentForApi } from '@/components/interfaces/Notebook/notebookBlock.utils'
import type { ChartConfig } from '@/components/interfaces/SQLEditor/UtilityPanel/ChartConfig'
import { DEFAULT_CHART_CONFIG } from '@/components/ui/QueryBlock/QueryBlock'
import type { Content } from '@/data/content/content-query'
import { upsertContent } from '@/data/content/content-upsert-mutation'
import type { NotebookBlockPersistPatch } from '@/state/notebook-block-registry'
import type { Dashboards } from '@/types'

export function useNotebookPersist({
  projectRef,
  notebook,
  notebookContent,
  onContentChange,
}: {
  projectRef: string | undefined
  notebook: Content | undefined
  notebookContent: Dashboards.Content
  onContentChange?: (content: Dashboards.Content) => void
}) {
  const contentRef = useRef(notebookContent)
  contentRef.current = notebookContent

  const notebookRef = useRef(notebook)
  notebookRef.current = notebook

  const debouncedUpsert = useMemo(
    () =>
      debounce(async (layout: Dashboards.Chart[]) => {
        const currentNotebook = notebookRef.current
        if (!projectRef || !currentNotebook?.id) return

        const content: Dashboards.Content = {
          ...contentRef.current,
          layout,
        }

        await upsertContent({
          projectRef,
          payload: {
            ...currentNotebook,
            id: currentNotebook.id,
            type: 'report',
            content: unmapNotebookContentForApi(content),
          },
        })
      }, 1000),
    [projectRef]
  )

  const persistBlock = useCallback(
    (blockId: string, patch: NotebookBlockPersistPatch) => {
      const updatedLayout = contentRef.current.layout.map((item) => {
        if (item.id !== blockId) return item

        const next: Dashboards.Chart = { ...item }

        if (patch.label !== undefined) {
          next.label = patch.label
        }

        if (patch.chartConfig !== undefined) {
          next.chartConfig = {
            ...DEFAULT_CHART_CONFIG,
            ...(next.chartConfig ?? {}),
            ...patch.chartConfig,
          }
        }

        if (
          patch.sql !== undefined ||
          patch.querySource !== undefined ||
          patch.logsDatePickerValue !== undefined
        ) {
          next.sql = {
            ...(next.sql ?? { schema_version: '1.0' }),
            ...(patch.sql !== undefined ? { unchecked_sql: untrustedSql(patch.sql) } : {}),
            ...(patch.querySource !== undefined ? { query_source: patch.querySource } : {}),
            ...(patch.logsDatePickerValue !== undefined
              ? { logs_date_picker_value: patch.logsDatePickerValue }
              : {}),
          }
          next.attribute = 'sql_block'
        }

        return next
      })

      contentRef.current = { ...contentRef.current, layout: updatedLayout }
      onContentChange?.(contentRef.current)
      debouncedUpsert(updatedLayout)
    },
    [debouncedUpsert, onContentChange]
  )

  const persistChartConfig = useCallback(
    (blockId: string, config: ChartConfig) => {
      persistBlock(blockId, { chartConfig: { ...DEFAULT_CHART_CONFIG, ...config } })
    },
    [persistBlock]
  )

  return { persistBlock, persistChartConfig, debouncedUpsert }
}
