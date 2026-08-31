import { useParams } from 'common'
import { Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button, Card } from 'ui'
import { Admonition } from 'ui-patterns/Admonition'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { PageContainer } from 'ui-patterns/PageContainer'
import { PageSection, PageSectionContent } from 'ui-patterns/PageSection'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { AlertError } from '@/components/ui/AlertError'
import { TextConfirmModal } from '@/components/ui/TextConfirmModalWrapper'
import {
  useBucketTrashDeleteMutation,
  useBucketTrashQuery,
  useBucketTrashRestoreMutation,
  useTrashVersionDeleteMutation,
  useTrashVersionRestoreMutation,
} from '@/data/storage/protection/bucket-trash-query'
import {
  type DeletedObjectVersion,
  type TrashObject,
} from '@/data/storage/protection/protection-mocks'

import { toggleSelectAll, toggleSelection } from './Trash.utils'
import { TrashList } from './TrashList'
import { TrashSelectionBar } from './TrashSelectionBar'

interface TrashProps {
  bucketId: string
}

export const Trash = ({ bucketId }: TrashProps) => {
  const { ref } = useParams()

  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [lastToggledId, setLastToggledId] = useState<string | null>(null)
  const [objectToDelete, setObjectToDelete] = useState<TrashObject>()
  const [versionToDelete, setVersionToDelete] = useState<{
    parent: TrashObject
    version: DeletedObjectVersion
  }>()
  const [showBulkDelete, setShowBulkDelete] = useState(false)
  const [showDeleteAll, setShowDeleteAll] = useState(false)

  const {
    data: objects,
    isPending,
    isError,
    error,
    isSuccess,
  } = useBucketTrashQuery({ projectRef: ref, bucketId })

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

  const { mutate: restoreVersion } = useTrashVersionRestoreMutation({
    onSuccess: (_data, variables) => {
      toast.success(`Version ${variables.versionId.slice(0, 8)} restored`)
    },
  })

  const { mutate: deleteVersionPermanently, isPending: isDeletingVersion } =
    useTrashVersionDeleteMutation({
      onSuccess: () => {
        toast.success('Version permanently deleted')
        setVersionToDelete(undefined)
      },
    })

  const orderedIds = (objects ?? []).map((object) => object.id)

  const handleToggleSelect = (id: string, isShiftHeld: boolean) => {
    setSelectedIds(toggleSelection({ selectedIds, orderedIds, id, lastToggledId, isShiftHeld }))
    setLastToggledId(id)
  }

  const handleRestore = (objectIds: string[]) => {
    if (!ref || objectIds.length === 0) return
    restoreObjects({ projectRef: ref, bucketId, objectIds })
  }

  return (
    <>
      <PageContainer>
        <PageSection>
          <PageSectionContent className="flex flex-col gap-y-4">
            <div className="flex items-center justify-between gap-x-3">
              <p className="text-sm text-foreground-lighter">
                Deleted versions in this bucket, restorable until a lifecycle policy expires them
              </p>
              {isSuccess && objects.length > 0 && (
                <Button variant="danger" icon={<Trash2 />} onClick={() => setShowDeleteAll(true)}>
                  Delete all versions permanently
                </Button>
              )}
            </div>

            {isPending && <GenericSkeletonLoader />}
            {isError && <AlertError error={error} subject="Failed to retrieve deleted versions" />}
            {isSuccess && objects.length === 0 && (
              <Admonition
                type="default"
                title="No deleted versions"
                description="Deleted versions appear here and can be restored until a lifecycle policy expires them."
              />
            )}
            {isSuccess && objects.length > 0 && (
              <Card className="overflow-hidden">
                {selectedIds.length > 0 && (
                  <TrashSelectionBar
                    count={selectedIds.length}
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
                  onToggleSelectAll={() => setSelectedIds(toggleSelectAll(selectedIds, orderedIds))}
                  onRestore={(object) => handleRestore([object.id])}
                  onDeleteForever={setObjectToDelete}
                  onRestoreVersion={(parent, version) => {
                    if (!ref) return
                    restoreVersion({
                      projectRef: ref,
                      bucketId,
                      objectId: parent.id,
                      versionId: version.versionId,
                    })
                  }}
                  onDeleteVersionForever={(parent, version) =>
                    setVersionToDelete({ parent, version })
                  }
                />
              </Card>
            )}
          </PageSectionContent>
        </PageSection>
      </PageContainer>

      <ConfirmationModal
        variant="destructive"
        visible={objectToDelete !== undefined}
        title="Permanently delete version"
        confirmLabel="Delete permanently"
        confirmLabelLoading="Deleting..."
        loading={isDeleting}
        onCancel={() => setObjectToDelete(undefined)}
        onConfirm={() => {
          if (!ref || !objectToDelete) return
          deleteObjects({
            projectRef: ref,
            bucketId,
            objectIds: [objectToDelete.id],
          })
        }}
      >
        <p className="text-sm text-foreground-light">
          {objectToDelete?.name} will be permanently deleted and can no longer be restored. This
          action cannot be undone.
        </p>
      </ConfirmationModal>

      <ConfirmationModal
        variant="destructive"
        visible={showBulkDelete}
        title={`Permanently delete ${selectedIds.length} version${selectedIds.length === 1 ? '' : 's'}`}
        confirmLabel="Delete permanently"
        confirmLabelLoading="Deleting..."
        loading={isDeleting}
        onCancel={() => setShowBulkDelete(false)}
        onConfirm={() => {
          if (!ref) return
          deleteObjects({ projectRef: ref, bucketId, objectIds: selectedIds })
        }}
      >
        <p className="text-sm text-foreground-light">
          These versions will be permanently deleted and can no longer be restored. This action
          cannot be undone.
        </p>
      </ConfirmationModal>

      <ConfirmationModal
        variant="destructive"
        visible={versionToDelete !== undefined}
        title="Permanently delete version"
        confirmLabel="Delete permanently"
        confirmLabelLoading="Deleting..."
        loading={isDeletingVersion}
        onCancel={() => setVersionToDelete(undefined)}
        onConfirm={() => {
          if (!ref || !versionToDelete) return
          deleteVersionPermanently({
            projectRef: ref,
            bucketId,
            objectId: versionToDelete.parent.id,
            versionId: versionToDelete.version.versionId,
          })
        }}
      >
        <p className="text-sm text-foreground-light">
          Version{' '}
          <span className="font-mono text-foreground">
            {versionToDelete?.version.versionId.slice(0, 8)}
          </span>{' '}
          of {versionToDelete?.parent.name} will be permanently deleted. This action cannot be
          undone.
        </p>
      </ConfirmationModal>

      <TextConfirmModal
        variant="destructive"
        visible={showDeleteAll}
        size="medium"
        title={`Delete all deleted versions in "${bucketId}"`}
        confirmLabel="Delete all permanently"
        confirmPlaceholder="Type bucket name"
        confirmString={bucketId}
        loading={isDeleting}
        onCancel={() => setShowDeleteAll(false)}
        onConfirm={() => {
          if (!ref) return
          deleteObjects({ projectRef: ref, bucketId })
        }}
        alert={{
          title: 'You cannot recover these versions once deleted',
          description: 'This action cannot be undone',
        }}
      >
        <p className="text-sm">
          Every deleted version in <span className="font-bold text-foreground">{bucketId}</span>{' '}
          will be permanently deleted.
        </p>
      </TextConfirmModal>
    </>
  )
}
