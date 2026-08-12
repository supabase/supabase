import { useParams } from 'common'
import { toast } from 'sonner'
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
} from 'ui'
import { Admonition } from 'ui-patterns/Admonition'

import { useBucketEmptyMutation } from '@/data/storage/bucket-empty-mutation'
import type { Bucket } from '@/data/storage/buckets-query'
import { useStorageExplorerStateSnapshot } from '@/state/storage-explorer'

import { hasVersioningHistory } from './StorageProtection.constants'

export interface EmptyBucketModalProps {
  visible: boolean
  bucket?: Bucket
  onClose: () => void
}

export const EmptyBucketModal = ({ visible, bucket, onClose }: EmptyBucketModalProps) => {
  const { ref: projectRef } = useParams()
  const { fetchFolderContents } = useStorageExplorerStateSnapshot()
  const isVersioned = hasVersioningHistory(bucket?.id)

  const { mutate: emptyBucket, isPending } = useBucketEmptyMutation({
    onSuccess: async () => {
      if (bucket === undefined) return
      await fetchFolderContents({
        bucketId: bucket.id,
        folderId: bucket.id,
        folderName: bucket.name,
        index: -1,
      })
      toast.success(`Successfully emptied bucket ${bucket!.name}`)
      onClose()
    },
  })

  const onEmptyBucket = async () => {
    if (!projectRef) return console.error('Project ref is required')
    if (!bucket) return console.error('No bucket is selected')
    emptyBucket({ projectRef, id: bucket.id })
  }

  return (
    <Dialog
      open={visible}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{`Empty bucket “${bucket?.name}”`}</DialogTitle>
        </DialogHeader>
        <DialogSectionSeparator />
        <Admonition
          type="destructive"
          className="rounded-none border-x-0 border-t-0"
          title="This action cannot be undone"
          description={
            isVersioned
              ? 'All live objects, noncurrent versions, and soft-deleted files in this bucket will be permanently deleted and cannot be recovered.'
              : 'The contents of your bucket cannot be recovered once deleted.'
          }
        />
        <DialogSection className="space-y-3">
          <p className="text-sm">
            Are you sure you want to remove all contents from the bucket “{bucket?.name}”?
          </p>
          {isVersioned && (
            <Admonition
              type="warning"
              title="This bucket has retained versions"
              description="Emptying will also permanently delete every noncurrent version and every archived (soft-deleted) file, whether or not versioning is still active. Nothing will be recoverable."
            />
          )}
        </DialogSection>
        <DialogFooter>
          <Button variant="default" disabled={isPending} onClick={onClose}>
            Cancel
          </Button>
          <Button variant="danger" loading={isPending} onClick={onEmptyBucket}>
            Empty bucket
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
