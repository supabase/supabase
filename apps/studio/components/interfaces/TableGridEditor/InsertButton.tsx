import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import { ArrowUp, ChevronDown, FileText } from 'lucide-react'
import {
  Button,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from 'ui'

import { ShortcutBadge } from '@/components/ui/ShortcutBadge'
import { useSendEventMutation } from '@/data/telemetry/send-event-mutation'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { SHORTCUT_IDS } from '@/state/shortcuts/registry'
import { useShortcut } from '@/state/shortcuts/useShortcut'
import { useTableEditorStateSnapshot } from '@/state/table-editor'
import { useTableEditorTableStateSnapshot } from '@/state/table-editor-table'

export const InsertButton = () => {
  const { ref: projectRef } = useParams()
  const { data: org } = useSelectedOrganizationQuery()

  const snap = useTableEditorTableStateSnapshot()
  const tableEditorSnap = useTableEditorStateSnapshot()
  const { can: canCreateColumns } = useAsyncCheckPermissions(
    PermissionAction.TENANT_SQL_ADMIN_WRITE,
    'columns'
  )
  const { mutate: sendEvent } = useSendEventMutation()

  const onAddRow =
    snap.editable && (snap.table.columns ?? []).length > 0 ? tableEditorSnap.onAddRow : undefined
  const onAddColumn = snap.editable ? tableEditorSnap.onAddColumn : undefined
  const onImportData = snap.editable ? tableEditorSnap.onImportData : undefined

  const canAddNew = onAddRow !== undefined || onAddColumn !== undefined

  useShortcut(SHORTCUT_IDS.TABLE_EDITOR_INSERT_ROW, () => onAddRow?.(), {
    registerInCommandMenu: true,
    enabled: onAddRow !== undefined && canAddNew && canCreateColumns,
  })
  useShortcut(SHORTCUT_IDS.TABLE_EDITOR_INSERT_COLUMN, () => onAddColumn?.(), {
    registerInCommandMenu: true,
    enabled: onAddColumn !== undefined && canAddNew && canCreateColumns,
  })
  useShortcut(SHORTCUT_IDS.TABLE_EDITOR_IMPORT_CSV, () => onImportData?.(), {
    registerInCommandMenu: true,
    enabled: onImportData !== undefined && canAddNew && canCreateColumns,
  })

  if (!canAddNew || !canCreateColumns) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          data-testid="table-editor-insert-new-row"
          type="primary"
          size="tiny"
          icon={<ChevronDown strokeWidth={1.5} />}
        >
          Insert
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="bottom" align="end">
        {[
          ...(onAddRow !== undefined
            ? [
                <DropdownMenuItem
                  key="add-row"
                  className="flex items-center group gap-x-3"
                  onClick={onAddRow}
                >
                  <div className="shrink-0 w-4">
                    <div className="border border-foreground-lighter w-[15px] h-[4px]" />
                    <div className="border border-foreground-lighter w-[15px] h-[4px] my-[2px]" />
                    <div
                      className={cn([
                        'border border-foreground-light w-[15px] h-[4px] translate-x-0.5',
                        'transition duration-200 group-data-highlighted:border-brand group-data-highlighted:translate-x-0',
                      ])}
                    />
                  </div>
                  <p className="flex-1 min-w-0 pr-4">Insert row</p>
                  <ShortcutBadge
                    shortcutId={SHORTCUT_IDS.TABLE_EDITOR_INSERT_ROW}
                    className="shrink-0"
                  />
                </DropdownMenuItem>,
              ]
            : []),
          ...(onAddColumn !== undefined
            ? [
                <DropdownMenuItem key="add-column" className="group gap-x-3" onClick={onAddColumn}>
                  <div className="flex shrink-0 w-4">
                    <div className="border border-foreground-lighter w-[4px] h-[15px]" />
                    <div className="border border-foreground-lighter w-[4px] h-[15px] mx-[2px]" />
                    <div
                      className={cn([
                        'border border-foreground-light w-[4px] h-[15px] -translate-y-0.5',
                        'transition duration-200 group-data-highlighted:border-brand group-data-highlighted:translate-y-0',
                      ])}
                    />
                  </div>
                  <p className="flex-1 min-w-0 pr-4">Insert column</p>
                  <ShortcutBadge
                    shortcutId={SHORTCUT_IDS.TABLE_EDITOR_INSERT_COLUMN}
                    className="shrink-0"
                  />
                </DropdownMenuItem>,
              ]
            : []),
          ...(onImportData !== undefined
            ? [
                <DropdownMenuItem
                  key="import-data"
                  className="group gap-x-3"
                  onClick={() => {
                    onImportData()
                    sendEvent({
                      action: 'import_data_button_clicked',
                      properties: { tableType: 'Existing Table' },
                      groups: {
                        project: projectRef ?? 'Unknown',
                        organization: org?.slug ?? 'Unknown',
                      },
                    })
                  }}
                >
                  <div className="relative shrink-0 w-4">
                    <FileText size={18} strokeWidth={1.5} className="translate-x-[-2px]" />
                    <ArrowUp
                      className={cn(
                        'transition duration-200 absolute bottom-0 right-0 translate-y-1 opacity-0 bg-brand-400 rounded-full',
                        'group-data-highlighted:translate-y-0 group-data-highlighted:text-brand group-data-highlighted:opacity-100'
                      )}
                      strokeWidth={3}
                      size={12}
                    />
                  </div>
                  <p className="flex-1 min-w-0 pr-4">Import data from CSV</p>
                  <ShortcutBadge
                    shortcutId={SHORTCUT_IDS.TABLE_EDITOR_IMPORT_CSV}
                    className="shrink-0"
                  />
                </DropdownMenuItem>,
              ]
            : []),
        ]}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
