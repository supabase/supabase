import dayjs from 'dayjs'
import { toast } from 'sonner'
import { Badge } from 'ui'
import { Admonition } from 'ui-patterns/admonition'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'

import { useBucketSnapshotRestoreMutation } from '@/data/storage/protection/bucket-snapshots-query'
import { type BucketSnapshot } from '@/data/storage/protection/protection-mocks'

interface RestoreSnapshotModalProps {
  projectRef?: string
  bucketId?: string
  snapshot?: BucketSnapshot
  onClose: () => void
}

/**
 * Prototype: derive a plausible add/revert/remove diff from the snapshot so the
 * user sees exactly what a whole-bucket restore will change before confirming.
 */
const getRestoreDiff = (snapshot: BucketSnapshot) => {
  const added = Math.max(0, 1204 - snapshot.objectCount)
  const reverted = Math.round(snapshot.objectCount * 0.0025)
  const removed = added + 8
  return { added, reverted, removed }
}

export const RestoreSnapshotModal = ({
  projectRef,
  bucketId,
  snapshot,
  onClose,
}: RestoreSnapshotModalProps) => {
  const { mutate: restoreSnapshot, isPending } = useBucketSnapshotRestoreMutation({
    onSuccess: () => {
      toast.success('Bucket restore started')
      onClose()
    },
  })

  const diff = snapshot ? getRestoreDiff(snapshot) : { added: 0, reverted: 0, removed: 0 }

  return (
    <ConfirmationModal
      size="medium"
      variant="warning"
      visible={snapshot !== undefined}
      title={`Restore bucket to “${bucketId}”`}
      confirmLabel="Restore bucket"
      confirmLabelLoading="Restoring..."
      loading={isPending}
      onCancel={onClose}
      onConfirm={() => {
        if (!projectRef || !bucketId || !snapshot) return
        restoreSnapshot({ projectRef, bucketId, snapshotId: snapshot.id })
      }}
    >
      <div className="space-y-4">
        {snapshot && (
          <p className="text-sm text-foreground-light">
            Restoring the snapshot from{' '}
            <span className="text-foreground">
              {dayjs(snapshot.createdAt).format('MMM D, YYYY · HH:mm')}
            </span>{' '}
            will make <span className="text-foreground">{bucketId}</span> match that point in time:
          </p>
        )}

        <div className="flex flex-col gap-y-2 text-sm">
          <div className="flex items-center gap-x-2">
            <Badge variant="success">+ {diff.added}</Badge>
            <span className="text-foreground-light">objects added back</span>
          </div>
          <div className="flex items-center gap-x-2">
            <Badge variant="warning">~ {diff.reverted}</Badge>
            <span className="text-foreground-light">objects reverted to earlier content</span>
          </div>
          <div className="flex items-center gap-x-2">
            <Badge variant="destructive">− {diff.removed}</Badge>
            <span className="text-foreground-light">
              objects created after the snapshot will be removed
            </span>
          </div>
        </div>

        <Admonition
          showIcon={false}
          type="warning"
          title="This action cannot be undone"
          description="Objects created after the snapshot are permanently removed unless versioning also retained them."
        />
      </div>
    </ConfirmationModal>
  )
}
