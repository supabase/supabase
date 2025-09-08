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
}

export const UpdateVersionModal = ({
  visible,
  currentVersionName,
  newVersionName,
  onCancel,
  onConfirm,
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
      confirmLabel="Update and restart"
      confirmLabelLoading="Updating"
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
        <p className="text-sm text-foreground-light text-center">
          Updating the replication pipeline version briefly pauses the pipeline and then resumes it
          automatically. If there is a long-running transaction during the restart, some data might
          be duplicated.
        </p>
      </div>
    </ConfirmationModal>
  )
}
