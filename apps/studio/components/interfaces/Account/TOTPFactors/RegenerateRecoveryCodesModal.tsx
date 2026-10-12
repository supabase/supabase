import { RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { Button } from 'ui'

import { RecoveryCodesModal } from './RecoveryCodesModal'
import { TextConfirmModal } from '@/components/ui/TextConfirmModalWrapper'
import { useRecoveryCodesRegenerateMutation } from '@/data/recovery-codes/recovery-codes-regenerate-mutation'

export const RegenerateRecoveryCodesModal = () => {
  const [showConfirm, setShowConfirm] = useState(false)
  const [open, setOpen] = useState(false)

  const recoveryCodesRegenerateMutation = useRecoveryCodesRegenerateMutation({
    onSettled: () => {
      setShowConfirm(false)
      setOpen(true)
    },
  })

  const { mutate: regenerateCodes, isPending } = recoveryCodesRegenerateMutation

  return (
    <>
      <Button icon={<RefreshCw />} onClick={() => setShowConfirm(true)}>
        Regenerate
      </Button>
      <TextConfirmModal
        visible={showConfirm}
        size="small"
        variant="warning"
        title="Regenerate my recovery codes"
        confirmPlaceholder="REGENERATE"
        confirmString="REGENERATE"
        confirmLabel="Regenerate"
        loading={isPending}
        onConfirm={() => regenerateCodes()}
        onCancel={() => setShowConfirm(false)}
      >
        <p className="text-sm">Your existing recovery codes won't work anymore.</p>
      </TextConfirmModal>

      <RecoveryCodesModal
        open={open}
        onOpenChange={(open) => setOpen(open)}
        mutation={recoveryCodesRegenerateMutation}
      />
    </>
  )
}
