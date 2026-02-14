import { useQueryClient } from '@tanstack/react-query'
import { ROW_CONTEXT_MENU_ID } from 'components/grid/constants'
import type { SupaRow } from 'components/grid/types'
import { queueRowDeletesWithOptimisticUpdate } from 'components/grid/utils/queueOperationUtils'
import { useIsQueueOperationsEnabled } from 'components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { getCellValue } from 'data/table-rows/get-cell-value-mutation'
import { fetchSelectedTableRows } from 'data/table-rows/table-rows-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { RoleImpersonationState } from 'lib/role-impersonation'
import { Copy, Edit, Trash } from 'lucide-react'
import { useCallback } from 'react'
import { Item, ItemParams, Menu } from 'react-contexify'
import { toast } from 'sonner'
import { useRoleImpersonationStateSnapshot } from 'state/role-impersonation-state'
import { useTableEditorStateSnapshot } from 'state/table-editor'
import { useTableEditorTableStateSnapshot } from 'state/table-editor-table'
import { DialogSectionSeparator, copyToClipboard } from 'ui'

import { formatClipboardValue } from '../../utils/common'

type RowContextMenuProps = {
  rows: SupaRow[]
}

type RowContextMenuItemProps = ItemParams<{ rowIdx: number }, string>

export const RowContextMenu = ({ rows }: RowContextMenuProps) => {
  const queryClient = useQueryClient()
  const { data: project } = useSelectedProjectQuery()
  const tableEditorSnap = useTableEditorStateSnapshot()
  const snap = useTableEditorTableStateSnapshot()
  const isQueueOperationsEnabled = useIsQueueOperationsEnabled()
  const roleImpersonationState = useRoleImpersonationStateSnapshot()

  function onDeleteRow(p: RowContextMenuItemProps) {
    const rowIdx = p.props?.rowIdx
    if (rowIdx === undefined || rowIdx === null) return

    const row = rows[rowIdx]
    if (!row) {
      toast.error('Row not found')
      return
    }

    if (isQueueOperationsEnabled) {
      queueRowDeletesWithOptimisticUpdate({
        rows: [row],
        table: snap.originalTable,
        queryClient,
        queueOperation: tableEditorSnap.queueOperation,
        projectRef: project?.ref,
      })
      return
    }

    tableEditorSnap.onDeleteRows([row])
  }

  function onEditRowClick(p: RowContextMenuItemProps) {
    const rowIdx = p.props?.rowIdx
    if (rowIdx === undefined || rowIdx === null) return

    const row = rows[rowIdx]
    tableEditorSnap.onEditRow(row)
  }

  const buildPkMatch = useCallback(
    (row: SupaRow): Record<string, any> | null => {
      const primaryKey = snap.table?.primaryKey
      if (!primaryKey || primaryKey.length === 0) return null
      const pkMatch: Record<string, any> = {}
      for (const col of primaryKey) {
        pkMatch[col] = row[col]
      }
      return pkMatch
    },
    [snap.table?.primaryKey]
  )

  const onCopyCellContent = useCallback(
    (p: RowContextMenuItemProps) => {
      const rowIdx = p.props?.rowIdx
      if (!snap.selectedCellPosition || rowIdx === undefined || rowIdx === null) return

      const row = rows[rowIdx]
      const columnKey = snap.gridColumns[snap.selectedCellPosition.idx as number].key

      let valuePromise: Promise<string>

      const pkMatch = project ? buildPkMatch(row) : null
      if (project && pkMatch) {
        valuePromise = getCellValue({
          projectRef: project.ref,
          connectionString: project.connectionString,
          table: { schema: snap.table.schema ?? 'public', name: snap.table.name },
          column: columnKey,
          pkMatch,
        })
          .then((value) => formatClipboardValue(value))
          .catch(() => formatClipboardValue(row[columnKey]))
      } else {
        valuePromise = Promise.resolve(formatClipboardValue(row[columnKey]))
      }

      copyToClipboard(valuePromise).then(() => {
        toast.success('Copied cell value to clipboard')
      })
    },
    [rows, snap.gridColumns, snap.selectedCellPosition, project, snap.table, buildPkMatch]
  )

  const onCopyRowContent = useCallback(
    (p: RowContextMenuItemProps) => {
      const rowIdx = p.props?.rowIdx
      if (rowIdx === undefined || rowIdx === null) return

      const row = rows[rowIdx]

      let textPromise: Promise<string>

      if (project && snap.table) {
        textPromise = fetchSelectedTableRows({
          projectRef: project.ref,
          connectionString: project.connectionString,
          table: snap.table,
          selectedRows: [row],
          roleImpersonationState: roleImpersonationState as RoleImpersonationState,
        })
          .then((fullRows) => JSON.stringify(fullRows.length > 0 ? fullRows[0] : row))
          .catch(() => JSON.stringify(row))
      } else {
        textPromise = Promise.resolve(JSON.stringify(row))
      }

      copyToClipboard(textPromise).then(() => {
        toast.success('Copied row to clipboard')
      })
    },
    [rows, project, snap.table, roleImpersonationState]
  )

  return (
    <Menu id={ROW_CONTEXT_MENU_ID} animation={false} className="!min-w-36">
      <Item onClick={onCopyCellContent}>
        <Copy size={12} />
        <span className="ml-2 text-xs">Copy cell</span>
      </Item>
      <Item onClick={onCopyRowContent}>
        <Copy size={12} />
        <span className="ml-2 text-xs">Copy row</span>
      </Item>

      {/* We can't just wrap this entire section in a fragment conditional
		  on snap.editable because of a bug in react-contexify. Only the
		  top-level children of Menu are cloned with the necessary bound props,
		  so Items must be direct children of Menu:
		  https://github.com/fkhadra/react-contexify/blob/8d9fc63ac13040d3250e8eefd593d50a3ebdd1e6/src/components/Menu.tsx#L295
		*/}
      {snap.editable && <DialogSectionSeparator className="my-1.5" />}
      <Item onClick={onEditRowClick} hidden={!snap.editable} data="edit">
        <Edit size={12} />
        <span className="ml-2 text-xs">Edit row</span>
      </Item>
      {snap.editable && <DialogSectionSeparator className="my-1.5" />}
      <Item onClick={onDeleteRow} hidden={!snap.editable} data="delete">
        <Trash size={12} />
        <span className="ml-2 text-xs">Delete row</span>
      </Item>
    </Menu>
  )
}
