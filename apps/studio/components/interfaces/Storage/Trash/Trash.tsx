import { useParams } from 'common'
import { parseAsString, useQueryState } from 'nuqs'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Card } from 'ui'
import { Admonition } from 'ui-patterns/admonition'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { PageContainer } from 'ui-patterns/PageContainer'
import { PageSection, PageSectionContent } from 'ui-patterns/PageSection'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { StorageBucketSelector } from '../StorageBucketSelector'
import { TrashList } from './TrashList'
import { AlertError } from '@/components/ui/AlertError'
import { usePaginatedBucketsQuery } from '@/data/storage/buckets-query'
import {
  useBucketTrashQuery,
  useBucketTrashRestoreMutation,
} from '@/data/storage/protection/bucket-trash-query'
import { type TrashObject } from '@/data/storage/protection/protection-mocks'

export const Trash = () => {
  const { ref } = useParams()

  const [bucketParam, setBucketParam] = useQueryState('bucket', parseAsString)
  const { data: bucketsData } = usePaginatedBucketsQuery({ projectRef: ref })
  const firstBucket = useMemo(() => {
    const buckets = bucketsData?.pages.flatMap((page) => page) ?? []
    return buckets.find((bucket) => !('type' in bucket) || bucket.type === 'STANDARD')?.name
  }, [bucketsData])

  const selectedBucket = bucketParam ?? firstBucket ?? undefined
  const [objectToDelete, setObjectToDelete] = useState<TrashObject>()

  const {
    data: objects,
    isPending,
    isError,
    error,
    isSuccess,
  } = useBucketTrashQuery({ projectRef: ref, bucketId: selectedBucket })

  const { mutate: restoreObject, isPending: isRestoring } = useBucketTrashRestoreMutation({
    onSuccess: (_data, variables) => {
      toast.success('Object restored')
      void variables
    },
  })

  const handleRestore = (object: TrashObject) => {
    if (!ref || !selectedBucket) return
    restoreObject({ projectRef: ref, bucketId: selectedBucket, objectId: object.id })
  }

  return (
    <>
      <PageContainer>
        <PageSection>
          <PageSectionContent className="flex flex-col gap-y-4">
            <div className="flex items-center gap-x-3">
              <StorageBucketSelector
                projectRef={ref}
                value={selectedBucket}
                onChange={setBucketParam}
              />
              {selectedBucket && (
                <p className="text-sm text-foreground-lighter">
                  Soft-deleted objects in {selectedBucket}, restorable until their retention policy
                  expires them
                </p>
              )}
            </div>

            {isPending && <GenericSkeletonLoader />}
            {isError && <AlertError error={error} subject="Failed to retrieve deleted files" />}
            {isSuccess && objects.length === 0 && (
              <Admonition
                type="default"
                title="No deleted files"
                description="Deleted objects appear here and can be restored until a lifecycle policy removes them."
              />
            )}
            {isSuccess && objects.length > 0 && (
              <>
                <Card className="overflow-hidden">
                  <TrashList
                    objects={objects}
                    isRestoring={isRestoring}
                    onRestore={handleRestore}
                    onDeleteForever={setObjectToDelete}
                  />
                </Card>
                <p className="text-sm text-foreground-lighter">
                  Items held by a snapshot stay recoverable — and billable — until every snapshot
                  referencing them is deleted, even past their retention period.
                </p>
              </>
            )}
          </PageSectionContent>
        </PageSection>
      </PageContainer>

      <ConfirmationModal
        variant="destructive"
        visible={objectToDelete !== undefined}
        title="Permanently delete object"
        confirmLabel="Delete permanently"
        onCancel={() => setObjectToDelete(undefined)}
        onConfirm={() => {
          toast.success(`Permanently deleted ${objectToDelete?.name}`)
          setObjectToDelete(undefined)
        }}
      >
        <p className="text-sm text-foreground-light">
          {objectToDelete?.name} will be permanently deleted and can no longer be restored. This
          action cannot be undone.
        </p>
      </ConfirmationModal>
    </>
  )
}
