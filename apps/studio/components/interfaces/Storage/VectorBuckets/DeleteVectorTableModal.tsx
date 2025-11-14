import { toast } from 'sonner'

import { useFDWDropForeignTableMutation } from 'data/fdw/fdw-drop-foreign-table-mutation'
import { useVectorBucketIndexDeleteMutation } from 'data/storage/vector-bucket-index-delete-mutation'
import { VectorBucketIndex } from 'data/storage/vector-buckets-indexes-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { getVectorBucketFDWSchemaName } from './VectorBuckets.utils'

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
  const { data: project } = useSelectedProjectQuery()

  const { mutate: deleteForeignTable } = useFDWDropForeignTableMutation({
    onError: () => {},
  })

  const { mutate: deleteIndex, isLoading: isDeleting } = useVectorBucketIndexDeleteMutation({
    onSuccess: (_, vars) => {
      deleteForeignTable({
        projectRef: project?.ref,
        connectionString: project?.connectionString,
        schemaName: getVectorBucketFDWSchemaName(vars.bucketName),
        tableName: vars.indexName,
      })
      toast.success(`Table "${vars.indexName}" deleted successfully`)
      onClose()
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
