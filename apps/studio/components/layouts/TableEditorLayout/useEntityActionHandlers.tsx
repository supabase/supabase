import { toast } from 'sonner'
import { copyToClipboard } from 'ui'

import type { EntityActionId } from './EntityActions.utils'
import { useExportAllRowsAsCsv, useExportAllRowsAsSql } from './ExportAllRows'
import { getTableDefinition } from '@/data/database/table-definition-query'
import { getViewDefinition } from '@/data/database/view-definition-query'
import { ENTITY_TYPE } from '@/data/entity-types/entity-type-constants'
import type { Entity } from '@/data/entity-types/entity-types-infinite-query'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { formatSql } from '@/lib/formatSql'
import { useTableEditorStateSnapshot } from '@/state/table-editor'

type UseEntityActionHandlersParams = {
  entity: Entity
  projectRef: string
  rowCount?: number
  onExportCLI: (id: number) => void
  onViewPartitions?: (id: number) => void
}

export const useEntityActionHandlers = ({
  entity,
  projectRef,
  rowCount,
  onExportCLI,
  onViewPartitions,
}: UseEntityActionHandlersParams) => {
  const { data: project } = useSelectedProjectQuery()
  const snap = useTableEditorStateSnapshot()

  const { exportCsv, confirmationModal: exportCsvConfirmationModal } = useExportAllRowsAsCsv({
    enabled: true,
    projectRef,
    connectionString: project?.connectionString ?? null,
    entity,
    type: 'fetch_all',
    totalRows: rowCount,
  })

  const { exportSql, confirmationModal: exportSqlConfirmationModal } = useExportAllRowsAsSql({
    enabled: true,
    projectRef,
    connectionString: project?.connectionString ?? null,
    entity,
    type: 'fetch_all',
    totalRows: rowCount,
  })

  const copyDefinition = async ({
    label,
    getDefinition,
  }: {
    label: string
    getDefinition: () => Promise<string | undefined | null>
  }) => {
    const capitalizedLabel = label[0].toUpperCase() + label.slice(1)
    const toastId = toast.loading(`Getting ${label}...`)

    const formattedDefinition = getDefinition().then((definition) => {
      if (!definition) throw new Error(`Failed to get ${label}`)
      return formatSql(definition)
    })

    try {
      await copyToClipboard(formattedDefinition, () => {
        toast.success(`${capitalizedLabel} copied to clipboard`, { id: toastId })
      })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      toast.error(`Failed to copy ${label}: ${message}`, { id: toastId })
    }
  }

  const onSelectAction = (actionId: EntityActionId) => {
    switch (actionId) {
      case 'copy-name':
        copyToClipboard(entity.name)
        break
      case 'copy-schema':
        copyDefinition({
          label: 'table schema',
          getDefinition: () =>
            getTableDefinition({
              id: entity.id,
              projectRef: project?.ref,
              connectionString: project?.connectionString,
            }),
        })
        break
      case 'copy-definition':
        copyDefinition({
          label:
            entity.type === ENTITY_TYPE.MATERIALIZED_VIEW
              ? 'materialized view definition'
              : 'view definition',
          getDefinition: () =>
            getViewDefinition({
              id: entity.id,
              projectRef: project?.ref,
              connectionString: project?.connectionString,
              includeCreateStatement: true,
            }),
        })
        break
      case 'edit-table':
        snap.onEditTable()
        break
      case 'duplicate-table':
        snap.onDuplicateTable()
        break
      case 'export-csv':
        exportCsv()
        break
      case 'export-sql':
        exportSql()
        break
      case 'export-cli':
        onExportCLI(entity.id)
        break
      case 'view-partitions':
        onViewPartitions?.(entity.id)
        break
      case 'delete':
        if (entity.type === ENTITY_TYPE.VIEW) snap.onDeleteView()
        else if (entity.type === ENTITY_TYPE.MATERIALIZED_VIEW) snap.onDeleteMaterializedView()
        else snap.onDeleteTable()
        break
      // Navigation (`view-policies`) is handled by the item's href, and `export` only opens a submenu
      default:
        break
    }
  }

  const modals = (
    <>
      {exportCsvConfirmationModal}
      {exportSqlConfirmationModal}
    </>
  )

  return { onSelectAction, modals }
}
