import { PermissionAction } from '@supabase/shared-types/out/constants'
import { Alert, AlertDescription, AlertTitle, Button, CriticalIcon } from 'ui'

import type { TableLike } from '@/data/table-editor/table-editor-types'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { useTableEditorStateSnapshot } from '@/state/table-editor'

interface TableDetailDeleteTableSectionProps {
  table: TableLike
}

export function TableDetailDeleteTableSection({ table }: TableDetailDeleteTableSectionProps) {
  const snap = useTableEditorStateSnapshot()
  const { can: canDeleteTables } = useAsyncCheckPermissions(
    PermissionAction.TENANT_SQL_ADMIN_WRITE,
    'tables'
  )

  return (
    <Alert variant="destructive">
      <CriticalIcon />
      <AlertTitle>Once this table is deleted, it can no longer be restored</AlertTitle>
      <AlertDescription>
        Deleting <code className="text-code-inline">{table.schema}.{table.name}</code> permanently
        removes the table and its data. Use cascade if dependent objects must be removed too.
      </AlertDescription>
      <AlertDescription className="mt-3">
        <Button
          variant="danger"
          disabled={!canDeleteTables}
          onClick={() => snap.onDeleteTable()}
        >
          Delete table
        </Button>
      </AlertDescription>
    </Alert>
  )
}
