import { toast } from 'sonner'

import { useParams } from 'common'
import { useFDWDropForeignTableMutation } from 'data/fdw/fdw-drop-foreign-table-mutation'
import { useVectorBucketIndexDeleteMutation } from 'data/storage/vector-bucket-index-delete-mutation'
import { VectorBucketIndex } from 'data/storage/vector-buckets-indexes-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { useS3VectorsWrapperInstance } from './useS3VectorsWrapperInstance'

interface DeleteVectorTableModalProps {
  visible: boolean
  table?: VectorBucketIndex
  onClose: () => void
}

export const DeleteVectorTableModal = ({
  visible,
  table,
  onClose,
}: DeleteVectorTableModalProps) => {
  const { bucketId } = useParams()
  const { data: project } = useSelectedProjectQuery()

  const { data: wrapperInstance } = useS3VectorsWrapperInstance({ bucketId })
  const foreignTable = wrapperInstance?.tables?.find((x) => x.name === table?.indexName)

  const { mutateAsync: deleteForeignTable } = useFDWDropForeignTableMutation({
    onError: () => {},
  })

  const { mutate: deleteIndex, isPending: isDeleting } = useVectorBucketIndexDeleteMutation({
    onSuccess: (_, vars) => {
      try {
        if (!!foreignTable) {
          deleteForeignTable({
            projectRef: project?.ref,
            connectionString: project?.connectionString,
            schemaName: foreignTable.schema,
            tableName: foreignTable.name,
          })
        }
        toast.success(`Table "${vars.indexName}" deleted successfully`)
        onClose()
      } catch (error: any) {
        toast.success(
          `Table "${vars.indexName}" deleted successfully, but its corresponding foreign table failed to clean up: ${error.message}`
        )
      }
    },
  })

  const onConfirmDelete = () => {
    if (!project?.ref) return console.error('Project ref is required')
    if (!table) return console.error('Vector table is required')

    deleteIndex({
      projectRef: project?.ref,
      bucketName: table.vectorBucketName,
      indexName: table.indexName,
    })
  }

  return (
    <ConfirmationModal
      visible={visible}
      loading={isDeleting}
      variant="destructive"
      title={`Confirm to delete table "${table?.indexName}"`}
      onConfirm={onConfirmDelete}
      onCancel={onClose}
    >
      {/* [Joshen] Can probably beef up more details here - what are potential side effects of deleting a table */}
      <p className="text-sm">This action cannot be undone.</p>
    </ConfirmationModal>
  )
}
