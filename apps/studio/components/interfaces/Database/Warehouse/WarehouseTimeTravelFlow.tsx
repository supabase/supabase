import { useParams } from 'common'
import { useRouter } from 'next/router'
import { useState } from 'react'

import { WarehouseRestoreSnapshotModal } from './WarehouseRestoreSnapshotModal'
import { WarehouseSnapshotsSheet } from './WarehouseSnapshotsSheet'
import type { WarehouseSnapshot } from './warehouseDemoStore'
import {
  buildSnapshotQuerySql,
  formatSnapshotLabel,
} from './warehouseSnapshot.utils'
import { DiscardChangesConfirmationDialog } from '@/components/ui-patterns/Dialogs/DiscardChangesConfirmationDialog'

interface WarehouseTimeTravelFlowProps {
  tableKey: string
  sheetOpen: boolean
  stacked?: boolean
  onSheetOpenChange: (open: boolean) => void
}

export function WarehouseTimeTravelFlow({
  tableKey,
  sheetOpen,
  stacked = false,
  onSheetOpenChange,
}: WarehouseTimeTravelFlowProps) {
  const router = useRouter()
  const { ref: projectRef } = useParams()
  const [restoreConfirm, setRestoreConfirm] = useState<WarehouseSnapshot | null>(null)
  const [restoreProgress, setRestoreProgress] = useState<{
    snapshotLabel: string
  } | null>(null)

  function openSnapshotQuery(snapshot: WarehouseSnapshot) {
    if (!projectRef) return
    const sql = buildSnapshotQuerySql(tableKey, snapshot)
    onSheetOpenChange(false)
    void router.push(`/project/${projectRef}/sql/new?content=${encodeURIComponent(sql)}`)
  }

  function beginRestore(snapshot: WarehouseSnapshot) {
    onSheetOpenChange(false)
    setRestoreConfirm(snapshot)
  }

  return (
    <>
      <WarehouseSnapshotsSheet
        open={sheetOpen}
        tableKey={tableKey}
        stacked={stacked}
        onOpenChange={onSheetOpenChange}
        onQuerySnapshot={openSnapshotQuery}
        onRestoreSnapshot={beginRestore}
      />

      <DiscardChangesConfirmationDialog
        visible={restoreConfirm !== null}
        onCancel={() => setRestoreConfirm(null)}
        onClose={() => {
          if (restoreConfirm) {
            setRestoreProgress({ snapshotLabel: formatSnapshotLabel(restoreConfirm) })
          }
          setRestoreConfirm(null)
        }}
        size="small"
        title="Restore from snapshot"
        description={
          restoreConfirm ? (
            <>
              This will restore <code className="text-code-inline">{tableKey}</code> to the snapshot
              from {formatSnapshotLabel(restoreConfirm)}. Current data will be replaced.
            </>
          ) : null
        }
        confirmLabel="Restore"
        cancelLabel="Cancel"
      />

      {restoreProgress && (
        <WarehouseRestoreSnapshotModal
          open={true}
          tableKey={tableKey}
          snapshotLabel={restoreProgress.snapshotLabel}
          onOpenChange={(open) => {
            if (!open) setRestoreProgress(null)
          }}
        />
      )}
    </>
  )
}
