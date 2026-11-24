import { useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'
import { toast } from 'sonner'

import { tableEditorQueryOptions } from '@/data/table-editor/table-editor-query'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { useTableEditorStateSnapshot } from '@/state/table-editor'

// Matches the stale time of `useTableEditorQuery`, so a table that is already cached isn't refetched
const TABLE_STALE_TIME_MS = 5 * 60 * 1000

/**
 * Opens the edit / duplicate / delete flows for any table, view or materialized view by id.
 *
 * The side panel and dialogs read the table they act on from the table editor query cache, so the
 * table is loaded first. If it can't be loaded the flow is not opened, which avoids a panel or
 * dialog appearing with nothing to act on.
 */
export const useTableActions = () => {
  const queryClient = useQueryClient()
  const { data: project } = useSelectedProjectQuery()
  const { onEditTable, onDuplicateTable, onDeleteTable, onDeleteView, onDeleteMaterializedView } =
    useTableEditorStateSnapshot()
  const projectRef = project?.ref
  const connectionString = project?.connectionString

  // Stable so callers can list the actions in dependency arrays
  return useMemo(() => {
    const openForTable = async (tableId: number, open: (tableId: number) => void) => {
      try {
        await queryClient.fetchQuery({
          ...tableEditorQueryOptions({ projectRef, connectionString, id: tableId }),
          staleTime: TABLE_STALE_TIME_MS,
        })
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        toast.error(`Failed to load table: ${message}`)
        return
      }
      open(tableId)
    }

    return {
      editTable: (tableId: number) => openForTable(tableId, onEditTable),
      duplicateTable: (tableId: number) => openForTable(tableId, onDuplicateTable),
      deleteTable: (tableId: number) => openForTable(tableId, onDeleteTable),
      deleteView: (tableId: number) => openForTable(tableId, onDeleteView),
      deleteMaterializedView: (tableId: number) => openForTable(tableId, onDeleteMaterializedView),
    }
  }, [
    queryClient,
    projectRef,
    connectionString,
    onEditTable,
    onDuplicateTable,
    onDeleteTable,
    onDeleteView,
    onDeleteMaterializedView,
  ])
}
