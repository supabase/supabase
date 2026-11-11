import { RefreshCwIcon } from 'lucide-react'
import { useState } from 'react'
import { Button } from 'ui'

import type { GenerateRecoveryCodesModalProps } from './GenerateRecoveryCodesModal'
import { RecoveryCodesModal } from './RecoveryCodesModal'
import { TextConfirmModal } from '@/components/ui/TextConfirmModalWrapper'
import { useRecoveryCodesRegenerateMutation } from '@/data/recovery-codes/recovery-codes-regenerate-mutation'

interface RegenerateRecoveryCodesModalProps extends GenerateRecoveryCodesModalProps {
  showIcon?: boolean
}

export const useRegenerateRecoveryCodesModal = ({
  label = 'Regenerate',
  showIcon = true,
  variant,
  size,
  onComplete,
  onStart,
  showSecurityLink,
}: RegenerateRecoveryCodesModalProps = {}) => {
  const mutation = useRecoveryCodesRegenerateMutation()
  const [stage, setStage] = useState<'idle' | 'confirm' | 'codes'>('idle')
  const handleStart = () => {
    onStart?.()
    setStage('confirm')
  }

  return {
    trigger: (
      <Button
        variant={variant}
        size={size}
        icon={showIcon ? <RefreshCwIcon /> : undefined}
        onClick={handleStart}
        loading={mutation.isPending}
      >
        {label}
      </Button>
    ),
    dialog: (
      <>
        <TextConfirmModal
          visible={stage === 'confirm'}
          size="small"
          variant="warning"
          title="Regenerate my recovery codes"
          confirmPlaceholder="REGENERATE"
          confirmString="REGENERATE"
          confirmLabel="Regenerate"
          loading={mutation.isPending}
          onConfirm={() => {
            setStage('codes')
            mutation.mutate()
          }}
          onCancel={() => setStage('idle')}
        >
          <p className="text-sm">Your existing recovery codes won't work anymore.</p>
        </TextConfirmModal>
        <RecoveryCodesModal
          open={stage === 'codes'}
          mutation={mutation}
          showSecurityLink={showSecurityLink}
          onOpenChange={(open) => {
            if (open) return
            setStage('idle')
            if (mutation.isSuccess) onComplete?.()
          }}
        />
      </>
    ),
  }
}

export const RegenerateRecoveryCodesModal = (props: RegenerateRecoveryCodesModalProps) => {
  const { trigger, dialog } = useRegenerateRecoveryCodesModal(props)

  return (
    <>
      {trigger}
      {dialog}
    </>
  )
}
