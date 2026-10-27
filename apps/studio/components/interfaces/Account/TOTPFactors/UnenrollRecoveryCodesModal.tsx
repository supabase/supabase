import { toast } from 'sonner'

import { TextConfirmModal } from '@/components/ui/TextConfirmModalWrapper'
import { useRecoveryCodesUnenrollMutation } from '@/data/recovery-codes/recovery-codes-unenroll'

export const UnenrollRecoveryCodesModal = ({
  visible,
  onClose,
}: {
  visible: boolean
  onClose: () => void
}) => {
  const { mutate: unenrollCodes, isPending } = useRecoveryCodesUnenrollMutation({
    onSuccess: () => {
      toast.success('Successfully removed recovery codes')
      onClose()
    },
  })

  return (
    <TextConfirmModal
      visible={visible}
      size="small"
      variant="destructive"
      title="Delete my recovery codes"
      confirmPlaceholder="DELETE"
      confirmString="DELETE"
      confirmLabel="Delete"
      loading={isPending}
      onConfirm={() => unenrollCodes()}
      onCancel={onClose}
    >
      <p className="text-sm">
        Your recovery codes won't work anymore. Make sure to regenerate them if needed.
      </p>
    </TextConfirmModal>
  )
}
