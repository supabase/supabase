import { parseAsString, useQueryState } from 'nuqs'
import { useEffect } from 'react'
import { toast } from 'sonner'

import { useParams } from 'common'
import { useFDWDropForeignTableMutation } from 'data/fdw/fdw-drop-foreign-table-mutation'
import { useVectorBucketIndexDeleteMutation } from 'data/storage/vector-bucket-index-delete-mutation'
import { useVectorBucketsIndexesQuery } from 'data/storage/vector-buckets-indexes-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { ConfirmationModal } from 'ui-patterns/Dialogs/ConfirmationModal'
import { useS3VectorsWrapperInstance } from './useS3VectorsWrapperInstance'

export const DeleteVectorTableModal = () => {
  const { ref: projectRef, bucketId } = useParams()
  const { data: project } = useSelectedProjectQuery()

  const [selectedTableIdToDelete, setSelectedTableIdToDelete] = useQueryState(
    'deleteTable',
    parseAsString.withOptions({ history: 'push', clearOnDefault: true })
  )

  const { data, isSuccess: isSuccessIndexes } = useVectorBucketsIndexesQuery({
    projectRef,
    vectorBucketName: bucketId,
  })
  const allIndexes = data?.indexes ?? []
  const table = allIndexes.find((index) => index.indexName === selectedTableIdToDelete)

  const { data: wrapperInstance } = useS3VectorsWrapperInstance({ bucketId })
  const foreignTable = wrapperInstance?.tables?.find((x) => x.name === table?.indexName)

  const { mutateAsync: deleteForeignTable } = useFDWDropForeignTableMutation({
    onError: () => {},
  })

  const {
    mutate: deleteIndex,
    isPending: isDeleting,
    isSuccess: isSuccessDelete,
  } = useVectorBucketIndexDeleteMutation({
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
        setSelectedTableIdToDelete(null)
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

  useEffect(() => {
    if (!!selectedTableIdToDelete && isSuccessIndexes && !table && !isSuccessDelete) {
      toast(`Table ${selectedTableIdToDelete} cannot be found in your bucket`)
      setSelectedTableIdToDelete(null)
    }
  }, [
    isSuccessIndexes,
    selectedTableIdToDelete,
    table,
    setSelectedTableIdToDelete,
    isSuccessDelete,
  ])

  return (
    <ConfirmationModal
      visible={!!table}
      loading={isDeleting}
      variant="destructive"
      title={`Confirm to delete table "${table?.indexName}"`}
      onConfirm={onConfirmDelete}
      onCancel={() => setSelectedTableIdToDelete(null)}
    >
      {/* [Joshen] Can probably beef up more details here - what are potential side effects of deleting a table */}
      <p className="text-sm">This action cannot be undone.</p>
    </ConfirmationModal>
  )
}
