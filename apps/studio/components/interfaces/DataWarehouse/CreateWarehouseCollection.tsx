import { useRouter } from 'next/router'
import { toast } from 'sonner'

import { useParams } from 'common'
import { useCreateCollection } from 'data/analytics/warehouse-collections-create-mutation'
import { Modal } from 'ui'
import { CollectionForm } from './CollectionForm'

export const CreateWarehouseCollectionModal = ({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) => {
  const router = useRouter()
  const { ref } = useParams()

  const { mutate: createCollection, isLoading } = useCreateCollection({
    onSuccess: (data) => {
      onOpenChange(false)
      toast.success('Collection created successfully')
      router.push(`/project/${ref}/logs/collections/${data.token}`)
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  return (
    <Modal
      size="medium"
      onCancel={() => onOpenChange(false)}
      header="Create collection"
      visible={open}
      hideFooter
    >
      <CollectionForm
        onCancelClick={() => onOpenChange(false)}
        isLoading={isLoading}
        onSubmit={(vals) => {
          if (!ref) {
            return
          }
          createCollection({
            projectRef: ref,
            name: vals.name,
            retention_days: vals.retention_days,
          })
        }}
      />
    </Modal>
  )
}
