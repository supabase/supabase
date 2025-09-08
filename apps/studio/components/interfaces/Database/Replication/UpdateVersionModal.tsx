import { useState } from 'react'
import { ArrowDown } from 'lucide-react'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { Badge } from 'ui'

interface UpdateVersionModalProps {
  visible: boolean
  currentVersionName?: string
  newVersionName?: string
  onCancel: () => void
  onConfirm: () => Promise<void>
  confirmLabel?: string
  confirmLabelLoading?: string
}

export const UpdateVersionModal = ({
  visible,
  currentVersionName,
  newVersionName,
  onCancel,
  onConfirm,
  confirmLabel = 'Update and restart',
  confirmLabelLoading = 'Updating',
}: UpdateVersionModalProps) => {
  const [loading, setLoading] = useState(false)

  const handleConfirm = async () => {
    setLoading(true)
    try {
      await onConfirm()
    } finally {
      setLoading(false)
    }
  }

  return (
    <ConfirmationModal
      size="small"
      visible={visible}
      loading={loading}
      title="Update pipeline version"
      confirmLabel={confirmLabel}
      confirmLabelLoading={confirmLabelLoading}
      onCancel={onCancel}
      onConfirm={handleConfirm}
    >
      <div className="flex flex-col items-center gap-y-3">
        <div className="flex flex-col items-center gap-1">
          <p className="text-xs text-foreground-light">Current version</p>
          <Badge variant="default">{currentVersionName ?? 'Current'}</Badge>
        </div>
        <div className="flex items-center justify-center">
          <ArrowDown size={16} />
        </div>
        <div className="flex flex-col items-center gap-1">
          <p className="text-xs text-foreground-light">New version</p>
          <Badge variant="brand">{newVersionName ?? 'New version'}</Badge>
        </div>
        <div className="mt-4 w-full text-left text-sm text-foreground">
          Applying the update switches your pipeline to the latest version. The pipeline
          restarts briefly to complete the change.
        </div>
        <div className="mt-3 w-full rounded-md border border-overlay bg-surface-100 px-3 py-2 text-xs text-left">
          <p className="font-medium text-foreground">Note</p>
          <p className="mt-1 text-foreground-light">
            During the brief restart, replication pauses and resumes. If a long‑running transaction
            is in progress, some records may be reprocessed (duplicates). This is due to PostgreSQL
            logical replication limitations.
          </p>
        </div>
      </div>
    </ConfirmationModal>
  )
}
