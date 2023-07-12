import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { useFDWDeleteMutation } from 'data/fdw/fdw-delete-mutation'
import { FDW } from 'data/fdw/fdws-query'
import { useStore } from 'hooks'
import { Modal } from 'ui'
import { WRAPPERS } from './Wrappers.constants'

interface DeleteWrapperModalProps {
  selectedWrapper?: FDW
  onClose: () => void
}

const DeleteWrapperModal = ({ selectedWrapper, onClose }: DeleteWrapperModalProps) => {
  const { ui } = useStore()
  const { project } = useProjectContext()
  const { mutateAsync: deleteFDW, isLoading: isDeleting } = useFDWDeleteMutation()
  const wrapperMeta = WRAPPERS.find((meta) => meta.handlerName === selectedWrapper?.handler)

  const onConfirmDelete = async () => {
    if (!project?.ref) return console.error('Project ref is required')
    if (!selectedWrapper) return console.error('Wrapper is required')
    if (!wrapperMeta) return console.error('Wrapper meta is required')

    await deleteFDW({
      projectRef: project?.ref,
      connectionString: project?.connectionString,
      wrapper: selectedWrapper,
      wrapperMeta: wrapperMeta,
    })

    ui.setNotification({
      category: 'success',
      message: `Successfully disabled ${selectedWrapper.name} foreign data wrapper`,
    })
    onClose()
  }

  return (
    <Modal
      size="medium"
      alignFooter="right"
      loading={isDeleting}
      visible={selectedWrapper !== undefined}
      onCancel={() => onClose()}
      onConfirm={() => onConfirmDelete()}
      header={`Confirm to disable ${selectedWrapper?.name}`}
    >
      <div className="py-4">
        <Modal.Content>
          <p className="text-sm">
            Are you sure you want to disable {selectedWrapper?.name}? This will also remove all
            tables created with this wrapper.
          </p>
        </Modal.Content>
      </div>
    </Modal>
  )
}

export default DeleteWrapperModal
