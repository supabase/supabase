import { useParams } from 'common'
import { Trash2 } from 'lucide-react'
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
import { toggleSelectAll, toggleSelection } from './Trash.utils'
import { TrashList } from './TrashList'
import { TrashSelectionBar } from './TrashSelectionBar'
import { AlertError } from '@/components/ui/AlertError'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { TextConfirmModal } from '@/components/ui/TextConfirmModalWrapper'
import { usePaginatedBucketsQuery } from '@/data/storage/buckets-query'
import {
  useBucketTrashDeleteMutation,
  useBucketTrashQuery,
  useBucketTrashRestoreMutation,
} from '@/data/storage/protection/bucket-trash-query'
import { type TrashObject } from '@/data/storage/protection/protection-mocks'

interface TrashProps {
  /**
   * When set, the bucket is fixed to this value (embedded in a bucket view) —
   * the bucket selector is hidden and the `?bucket=` query param is ignored.
   */
  bucketId?: string
}

export const Trash = ({ bucketId }: TrashProps = {}) => {
  const { ref } = useParams()
  const isBucketFixed = bucketId !== undefined

  const [bucketParam, setBucketParam] = useQueryState('bucket', parseAsString)
  const { data: bucketsData } = usePaginatedBucketsQuery(
    { projectRef: ref },
    { enabled: !isBucketFixed }
  )
  const firstBucket = useMemo(() => {
    const buckets = bucketsData?.pages.flatMap((page) => page) ?? []
    return buckets.find((bucket) => !('type' in bucket) || bucket.type === 'STANDARD')?.name
  }, [bucketsData])

  const selectedBucket = bucketId ?? bucketParam ?? firstBucket ?? undefined

  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [lastToggledId, setLastToggledId] = useState<string | null>(null)
  const [objectToDelete, setObjectToDelete] = useState<TrashObject>()
  const [showBulkDelete, setShowBulkDelete] = useState(false)
  const [showDeleteAll, setShowDeleteAll] = useState(false)

  const {
    data: objects,
    isPending,
    isError,
    error,
    isSuccess,
  } = useBucketTrashQuery({ projectRef: ref, bucketId: selectedBucket })

  const { mutate: restoreObjects, isPending: isRestoring } = useBucketTrashRestoreMutation({
    onSuccess: (_data, variables) => {
      const count = variables.objectIds.length
      toast.success(count === 1 ? 'Version restored' : `${count} versions restored`)
      setSelectedIds([])
    },
  })

  const { mutate: deleteObjects, isPending: isDeleting } = useBucketTrashDeleteMutation({
    onSuccess: () => {
      toast.success('Versions permanently deleted')
      setSelectedIds([])
      setObjectToDelete(undefined)
      setShowBulkDelete(false)
      setShowDeleteAll(false)
    },
  })

  const orderedIds = (objects ?? []).map((object) => object.id)
  const selectedObjects = (objects ?? []).filter((object) => selectedIds.includes(object.id))
  const heldCount = selectedObjects.filter((object) => object.heldBySnapshot).length
  const deletableIds = selectedObjects
    .filter((object) => !object.heldBySnapshot)
    .map((object) => object.id)
  const heldInBucketCount = (objects ?? []).filter((object) => object.heldBySnapshot).length

  const handleToggleSelect = (id: string, isShiftHeld: boolean) => {
    setSelectedIds(toggleSelection({ selectedIds, orderedIds, id, lastToggledId, isShiftHeld }))
    setLastToggledId(id)
  }

  const handleRestore = (objectIds: string[]) => {
    if (!ref || !selectedBucket || objectIds.length === 0) return
    restoreObjects({ projectRef: ref, bucketId: selectedBucket, objectIds })
  }

  return (
    <>
      <PageContainer>
        <PageSection>
          <PageSectionContent className="flex flex-col gap-y-4">
            <div className="flex items-center justify-between gap-x-3">
              <div className="flex items-center gap-x-3">
                {!isBucketFixed && (
                  <StorageBucketSelector
                    projectRef={ref}
                    value={selectedBucket}
                    onChange={(bucket) => {
                      setBucketParam(bucket)
                      setSelectedIds([])
                    }}
                  />
                )}
                {selectedBucket && (
                  <p className="text-sm text-foreground-lighter">
                    {isBucketFixed
                      ? 'Soft-deleted versions in this bucket, restorable until their expiration policy removes them'
                      : `Soft-deleted versions in ${selectedBucket}, restorable until their expiration policy removes them`}
                  </p>
                )}
              </div>
              {isSuccess && objects.length > 0 && (
                <ButtonTooltip
                  variant="default"
                  icon={<Trash2 />}
                  disabled={objects.length === heldInBucketCount}
                  onClick={() => setShowDeleteAll(true)}
                  tooltip={{
                    content: {
                      side: 'bottom',
                      text:
                        objects.length === heldInBucketCount
                          ? 'Every deleted version is held by a snapshot'
                          : undefined,
                    },
                  }}
                >
                  Delete all permanently
                </ButtonTooltip>
              )}
            </div>

            {isPending && <GenericSkeletonLoader />}
            {isError && <AlertError error={error} subject="Failed to retrieve deleted versions" />}
            {isSuccess && objects.length === 0 && (
              <Admonition
                type="default"
                title="No deleted versions"
                description="Deleted versions appear here and can be restored until their expiration policy removes them."
              />
            )}
            {isSuccess && objects.length > 0 && (
              <>
                <Card className="overflow-hidden">
                  {selectedIds.length > 0 && (
                    <TrashSelectionBar
                      count={selectedIds.length}
                      heldCount={heldCount}
                      isRestoring={isRestoring}
                      onRestore={() => handleRestore(selectedIds)}
                      onDelete={() => setShowBulkDelete(true)}
                      onClear={() => setSelectedIds([])}
                    />
                  )}
                  <TrashList
                    objects={objects}
                    selectedIds={selectedIds}
                    isRestoring={isRestoring}
                    onToggleSelect={handleToggleSelect}
                    onToggleSelectAll={() =>
                      setSelectedIds(toggleSelectAll(selectedIds, orderedIds))
                    }
                    onRestore={(object) => handleRestore([object.id])}
                    onDeleteForever={setObjectToDelete}
                  />
                </Card>
                <p className="text-sm text-foreground-lighter">
                  Versions held by a snapshot stay recoverable — and billable — until every snapshot
                  referencing them is deleted, even past their expiration period.
                </p>
              </>
            )}
          </PageSectionContent>
        </PageSection>
      </PageContainer>

      {/* Single object */}
      <ConfirmationModal
        variant="destructive"
        visible={objectToDelete !== undefined}
        title="Permanently delete version"
        confirmLabel="Delete permanently"
        confirmLabelLoading="Deleting..."
        loading={isDeleting}
        onCancel={() => setObjectToDelete(undefined)}
        onConfirm={() => {
          if (!ref || !selectedBucket || !objectToDelete) return
          deleteObjects({
            projectRef: ref,
            bucketId: selectedBucket,
            objectIds: [objectToDelete.id],
          })
        }}
      >
        <p className="text-sm text-foreground-light">
          {objectToDelete?.name} will be permanently deleted and can no longer be restored. This
          action cannot be undone.
        </p>
      </ConfirmationModal>

      {/* Current selection */}
      <ConfirmationModal
        variant="destructive"
        visible={showBulkDelete}
        title={`Permanently delete ${deletableIds.length} version${deletableIds.length === 1 ? '' : 's'}`}
        confirmLabel="Delete permanently"
        confirmLabelLoading="Deleting..."
        loading={isDeleting}
        onCancel={() => setShowBulkDelete(false)}
        onConfirm={() => {
          if (!ref || !selectedBucket) return
          deleteObjects({ projectRef: ref, bucketId: selectedBucket, objectIds: deletableIds })
        }}
      >
        <p className="text-sm text-foreground-light">
          These versions will be permanently deleted and can no longer be restored. This action
          cannot be undone.
        </p>
        {heldCount > 0 && (
          <Admonition
            className="mt-3"
            type="warning"
            showIcon={false}
            title={`${heldCount} selected version${heldCount === 1 ? '' : 's'} will be kept`}
            description="Versions held by a snapshot can't be deleted until every snapshot referencing them is deleted."
          />
        )}
      </ConfirmationModal>

      {/* Everything in the bucket — type-to-confirm, matching Delete bucket */}
      <TextConfirmModal
        variant="destructive"
        visible={showDeleteAll}
        size="medium"
        title={`Delete all deleted versions in "${selectedBucket}"`}
        confirmLabel="Delete all permanently"
        confirmPlaceholder="Type bucket name"
        confirmString={selectedBucket ?? ''}
        loading={isDeleting}
        onCancel={() => setShowDeleteAll(false)}
        onConfirm={() => {
          if (!ref || !selectedBucket) return
          deleteObjects({ projectRef: ref, bucketId: selectedBucket })
        }}
        alert={{
          title: 'You cannot recover these versions once deleted',
          description: 'This action cannot be undone',
        }}
      >
        <p className="text-sm">
          Every soft-deleted version in{' '}
          <span className="font-bold text-foreground">{selectedBucket}</span> will be permanently
          deleted.
          {heldInBucketCount > 0 &&
            ` ${heldInBucketCount} version${heldInBucketCount === 1 ? '' : 's'} held by a snapshot will be kept.`}
        </p>
      </TextConfirmModal>
    </>
  )
}
