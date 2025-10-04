import { useParams } from 'common'
import { toast } from 'sonner'

import { useBucketEmptyMutation } from 'data/storage/bucket-empty-mutation'
import type { Bucket } from 'data/storage/buckets-query'
import { useStorageExplorerStateSnapshot } from 'state/storage-explorer'
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
import { Admonition } from 'ui-patterns'

export interface EmptyBucketModalProps {
  visible: boolean
  bucket?: Bucket
  onClose: () => void
}

export const EmptyBucketModal = ({ visible, bucket, onClose }: EmptyBucketModalProps) => {
  const { ref: projectRef } = useParams()
  const { fetchFolderContents } = useStorageExplorerStateSnapshot()

  const { mutate: emptyBucket, isLoading } = useBucketEmptyMutation({
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
          <DialogTitle>{`Confirm to delete all contents from ${bucket?.name}`}</DialogTitle>
        </DialogHeader>
        <DialogSectionSeparator />
        <Admonition
          type="destructive"
          className="rounded-none border-x-0 border-t-0 mb-0"
          title="This action cannot be undone"
          description="The contents of your bucket cannot be recovered once deleted."
        />
        <DialogSection>
          <p className="text-sm">Are you sure you want to empty the bucket "{bucket?.name}"?</p>
        </DialogSection>
        <DialogFooter>
          <Button type="default" disabled={isLoading} onClick={onClose}>
            Cancel
          </Button>
          <Button type="danger" loading={isLoading} onClick={onEmptyBucket}>
            Empty bucket
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
