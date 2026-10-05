import { Trash } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { TextConfirmModal } from '@/components/ui/TextConfirmModalWrapper'
import { useRecoveryCodesUnenrollMutation } from '@/data/recovery-codes/recovery-codes-unenroll'

export const UnenrollRecoveryCodesModal = () => {
  const [showConfirm, setShowConfirm] = useState(false)
  const { mutate: unenrollCodes, isPending } = useRecoveryCodesUnenrollMutation({
    onSuccess: () => {
      toast.success('Successfully removed recovery codes')
      setShowConfirm(false)
    },
  })

  return (
    <>
      <ButtonTooltip
        icon={<Trash />}
        aria-label="Delete recovery codes"
        onClick={() => setShowConfirm(true)}
        tooltip={{ content: { side: 'bottom', text: 'Delete recovery codes' } }}
      />

      <TextConfirmModal
        visible={showConfirm}
        size="small"
        variant="destructive"
        title="Delete my recovery codes"
        confirmPlaceholder="DELETE"
        confirmString="DELETE"
        confirmLabel="Delete"
        loading={isPending}
        onConfirm={() => unenrollCodes()}
        onCancel={() => setShowConfirm(false)}
      >
        <p className="text-sm">
          Your recovery codes won't work anymore. Make sure to regenerate them if needed.
        </p>
      </TextConfirmModal>
    </>
  )
}
