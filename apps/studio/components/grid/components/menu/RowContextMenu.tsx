import { Copy, Edit, Trash } from 'lucide-react'
import { useCallback } from 'react'
import { Item, ItemParams, Menu } from 'react-contexify'
import { toast } from 'sonner'

import { ROW_CONTEXT_MENU_ID } from 'components/grid/constants'
import type { SupaRow } from 'components/grid/types'
import { useTableRowCreateMutation } from 'data/table-rows/table-row-create-mutation'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { useGetImpersonatedRoleState } from 'state/role-impersonation-state'
import { useTableEditorStateSnapshot } from 'state/table-editor'
import { useTableEditorTableStateSnapshot } from 'state/table-editor-table'
import { copyToClipboard, DialogSectionSeparator } from 'ui'
import { formatClipboardValue } from '../../utils/common'
import {
  buildDuplicateRowPayload,
  fetchFullRowForDuplicate,
  getEnumArrayColumns,
  isLikelyMissingPrimaryKeyError,
  maybeAddGeneratedUuidPrimaryKeyForDuplicate,
} from './RowContextMenu.utils'

type RowContextMenuProps = {
  rows: SupaRow[]
}

type RowContextMenuItemProps = ItemParams<{ rowIdx: number }, string>

export const RowContextMenu = ({ rows }: RowContextMenuProps) => {
  const tableEditorSnap = useTableEditorStateSnapshot()
  const snap = useTableEditorTableStateSnapshot()
  const { data: project } = useSelectedProjectQuery()
  const getImpersonatedRoleState = useGetImpersonatedRoleState()

  const { mutateAsync: createTableRow } = useTableRowCreateMutation({
    onError: () => {},
  })

  function onDeleteRow(p: RowContextMenuItemProps) {
    const rowIdx = p.props?.rowIdx
    if (rowIdx === undefined || rowIdx === null) return

    const row = rows[rowIdx]
    if (row) tableEditorSnap.onDeleteRows([row])
  }

  function onEditRowClick(p: RowContextMenuItemProps) {
    const rowIdx = p.props?.rowIdx
    if (rowIdx === undefined || rowIdx === null) return

    const row = rows[rowIdx]
    tableEditorSnap.onEditRow(row)
  }

  const onCopyCellContent = useCallback(
    (p: RowContextMenuItemProps) => {
      const rowIdx = p.props?.rowIdx
      if (!snap.selectedCellPosition || rowIdx === undefined || rowIdx === null) return

      const row = rows[rowIdx]
      const columnKey = snap.gridColumns[snap.selectedCellPosition.idx as number].key

      const value = row[columnKey]
      const text = formatClipboardValue(value)

      copyToClipboard(text)
      toast.success('Copied cell value to clipboard')
    },
    [rows, snap.gridColumns, snap.selectedCellPosition]
  )

  const onCopyRowContent = useCallback(
    (p: RowContextMenuItemProps) => {
      const rowIdx = p.props?.rowIdx
      if (rowIdx === undefined || rowIdx === null) return

      const row = rows[rowIdx]
      copyToClipboard(JSON.stringify(row))
      toast.success('Copied row to clipboard')
    },
    [rows]
  )

  const onDuplicateRow = useCallback(
    async (p: RowContextMenuItemProps) => {
      const rowIdx = p.props?.rowIdx
      if (rowIdx === undefined || rowIdx === null) return

      if (!project) {
        toast.error('Project is required')
        return
      }

      const row = rows[rowIdx]
      if (!row) return

      const toastId = toast.loading('Duplicating row...')
      try {
        const roleImpersonationState = getImpersonatedRoleState()
        const fullRow = await fetchFullRowForDuplicate({
          projectRef: project.ref,
          connectionString: project.connectionString,
          table: snap.table,
          row,
          roleImpersonationState,
        })
        const payload = buildDuplicateRowPayload({ table: snap.table, row: fullRow })
        const enumArrayColumns = getEnumArrayColumns(snap.table)

        try {
          await createTableRow({
            projectRef: project.ref,
            connectionString: project.connectionString,
            table: {
              id: snap.table.id,
              name: snap.table.name,
              schema: snap.table.schema ?? undefined,
            },
            payload,
            enumArrayColumns,
            roleImpersonationState,
          })
        } catch (error: any) {
          if (isLikelyMissingPrimaryKeyError({ error, table: snap.table })) {
            const retry = maybeAddGeneratedUuidPrimaryKeyForDuplicate({ table: snap.table, payload })
            if (retry.generated) {
              await createTableRow({
                projectRef: project.ref,
                connectionString: project.connectionString,
                table: {
                  id: snap.table.id,
                  name: snap.table.name,
                  schema: snap.table.schema ?? undefined,
                },
                payload: retry.payload,
                enumArrayColumns,
                roleImpersonationState,
              })
            } else {
              throw error
            }
          } else {
            throw error
          }
        }

        toast.success('Row duplicated', { id: toastId })
      } catch (error: any) {
        toast.error(error?.message ?? 'Failed to duplicate row', { id: toastId })
      }
    },
    [createTableRow, getImpersonatedRoleState, project, rows, snap.table]
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
      <Item onClick={onDuplicateRow} hidden={!snap.editable} data="duplicate">
        <Copy size={12} />
        <span className="ml-2 text-xs">Duplicate row</span>
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
