import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  IconAlertTriangle,
  Modal,
} from 'ui'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { useEnumeratedTypeDeleteMutation } from 'data/enumerated-types/enumerated-type-delete-mutation'
import toast from 'react-hot-toast'

interface DeleteEnumeratedTypeModalProps {
  visible: boolean
  selectedEnumeratedType?: any
  onClose: () => void
}

const DeleteEnumeratedTypeModal = ({
  visible,
  selectedEnumeratedType,
  onClose,
}: DeleteEnumeratedTypeModalProps) => {
  const { project } = useProjectContext()
  const { mutate: deleteEnumeratedType, isLoading: isDeleting } = useEnumeratedTypeDeleteMutation({
    onSuccess: () => {
      toast.success(`Successfully deleted "${selectedEnumeratedType.name}"`)
      onClose()
    },
  })

  const onConfirmDeleteType = () => {
    if (selectedEnumeratedType === undefined) return console.error('No enumerated type selected')
    if (project?.ref === undefined) return console.error('Project ref required')
    if (project?.connectionString === undefined)
      return console.error('Project connectionString required')

    deleteEnumeratedType({
      projectRef: project?.ref,
      connectionString: project?.connectionString,
      name: selectedEnumeratedType.name,
      schema: selectedEnumeratedType.schema,
    })
  }

  return (
    <ConfirmationModal
      variant={'destructive'}
      size="medium"
      loading={isDeleting}
      visible={visible}
      title={
        <>
          Confirm to delete enumerated type{' '}
          <code className="text-sm">{selectedEnumeratedType?.name}</code>
        </>
      }
      confirmLabel="Confirm delete"
      confirmLabelLoading="Deleting..."
      onCancel={onClose}
      onConfirm={() => onConfirmDeleteType()}
      alert={{
        title: 'This action cannot be undone',
        description:
          'You will need to re-create the enumerated type if you want to revert the deletion.',
      }}
    >
      <p className="text-sm">Before deleting this enumerated type, consider:</p>
      <ul className="space-y-2 mt-2 text-sm text-foreground-light">
        <li className="list-disc ml-6">
          This enumerated type is no longer in use in any tables or functions
        </li>
      </ul>
    </ConfirmationModal>
  )
}

export default DeleteEnumeratedTypeModal
