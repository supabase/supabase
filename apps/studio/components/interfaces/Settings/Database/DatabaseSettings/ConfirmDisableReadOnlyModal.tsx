import { useParams } from 'common'
import toast from 'react-hot-toast'
import { Modal } from 'ui'

import { useDisableReadOnlyModeMutation } from 'data/config/project-temp-disable-read-only-mutation'

interface ConfirmDisableReadOnlyModeModalProps {
  visible: boolean
  onClose: () => void
}

const ConfirmDisableReadOnlyModeModal = ({
  visible,
  onClose,
}: ConfirmDisableReadOnlyModeModalProps) => {
  const { ref } = useParams()
  const { mutate: disableReadOnlyMode, isLoading } = useDisableReadOnlyModeMutation({
    onSuccess: () => {
      toast.success('Successfully disabled read-only mode for 15 minutes')
      onClose()
    },
  })

  return (
    <Modal
      alignFooter="right"
      visible={visible}
      onCancel={onClose}
      loading={isLoading}
      confirmText="Disable read-only mode"
      header="Confirm to temporarily disable read-only mode"
      onConfirm={() => {
        if (!ref) return console.error('Project ref is required')
        disableReadOnlyMode({ projectRef: ref })
      }}
    >
      <Modal.Content className="py-4 space-y-2">
        <p className="text-sm">
          This will temporarily allow writes to your database for the{' '}
          <span className="text-amber-900">next 15 minutes</span>, during which you can reduce your
          database size. After deleting data, you should run a vacuum to reclaim as much space as
          possible.
        </p>
        <p className="text-sm">
          If your database size has not been sufficiently reduced after 15 minutes, read-only mode
          will be toggled back on. Otherwise, it will stay disabled.
        </p>
      </Modal.Content>
    </Modal>
  )
}

export default ConfirmDisableReadOnlyModeModal
