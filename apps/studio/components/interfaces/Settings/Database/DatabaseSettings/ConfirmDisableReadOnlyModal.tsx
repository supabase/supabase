import { useParams } from 'common'
import { toast } from 'sonner'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'

import { useDisableReadOnlyModeMutation } from '@/data/config/project-temp-disable-read-only-mutation'

interface ConfirmDisableReadOnlyModeModalProps {
  visible: boolean
  onClose: () => void
}

const ConfirmDisableReadOnlyModeModal = ({
  visible,
  onClose,
}: ConfirmDisableReadOnlyModeModalProps) => {
  const { ref } = useParams()
  const { mutate: disableReadOnlyMode, isPending } = useDisableReadOnlyModeMutation({
    onSuccess: () => {
      toast.success('Successfully disabled read-only mode for 15 minutes')
      onClose()
    },
  })

  return (
    <ConfirmationModal
      visible={visible}
      onCancel={onClose}
      loading={isPending}
      confirmLabel="Disable read-only mode"
      title="Confirm to temporarily disable read-only mode"
      onConfirm={() => {
        if (!ref) return console.error('Project ref is required')
        disableReadOnlyMode({ projectRef: ref })
      }}
      size="medium"
    >
      <div className="space-y-2">
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
      </div>
    </ConfirmationModal>
  )
}

export default ConfirmDisableReadOnlyModeModal
