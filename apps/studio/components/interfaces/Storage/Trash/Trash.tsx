import { useParams } from 'common'
import { parseAsString, useQueryState } from 'nuqs'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Card } from 'ui'
import { Admonition } from 'ui-patterns/admonition'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { PageContainer } from 'ui-patterns/PageContainer'
import {
  PageHeader,
  PageHeaderAside,
  PageHeaderDescription,
  PageHeaderMeta,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'
import { PageSection, PageSectionContent } from 'ui-patterns/PageSection'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { AlertError } from '@/components/ui/AlertError'
import { usePaginatedBucketsQuery } from '@/data/storage/buckets-query'
import {
  useBucketTrashQuery,
  useBucketTrashRestoreMutation,
} from '@/data/storage/protection/bucket-trash-query'
import { type TrashObject } from '@/data/storage/protection/protection-mocks'
import { StorageBucketSelector } from '../StorageBucketSelector'
import { TrashList } from './TrashList'

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
      <PageHeader>
        <PageHeaderMeta>
          <PageHeaderSummary>
            <PageHeaderTitle>Trash</PageHeaderTitle>
            <PageHeaderDescription>
              {selectedBucket
                ? `Soft-deleted objects in ${selectedBucket}. Restorable until their retention policy expires them.`
                : 'Soft-deleted objects, restorable until their retention policy expires them.'}
            </PageHeaderDescription>
          </PageHeaderSummary>
          <PageHeaderAside>
            <StorageBucketSelector
              projectRef={ref}
              value={selectedBucket}
              onChange={setBucketParam}
            />
          </PageHeaderAside>
        </PageHeaderMeta>
      </PageHeader>

      <PageContainer>
        <PageSection>
          <PageSectionContent className="gap-y-4">
            {isPending && <GenericSkeletonLoader />}
            {isError && <AlertError error={error} subject="Failed to retrieve trash" />}
            {isSuccess && objects.length === 0 && (
              <Admonition
                type="default"
                title="Nothing in the trash"
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
                  referencing them is deleted, even past their trash retention.
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
