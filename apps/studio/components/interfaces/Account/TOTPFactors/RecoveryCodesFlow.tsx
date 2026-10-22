import { ComponentProps, ReactNode, useState } from 'react'

import { RecoveryCodesModal } from './RecoveryCodesModal'
import { TextConfirmModal } from '@/components/ui/TextConfirmModalWrapper'

interface RecoveryCodesTrigger {
  onClick: () => void
  isPending: boolean
}

interface RecoveryCodesFlowProps {
  action: 'generate' | 'regenerate'
  mutation: ComponentProps<typeof RecoveryCodesModal>['mutation']
  onGenerate: () => void
  onComplete?: () => void
  onStart?: () => void
  showSecurityLink?: boolean
  children: (trigger: RecoveryCodesTrigger) => ReactNode
}

export const RecoveryCodesFlow = ({
  action,
  mutation,
  onGenerate,
  onComplete,
  onStart,
  showSecurityLink,
  children,
}: RecoveryCodesFlowProps) => {
  const [stage, setStage] = useState<'idle' | 'confirm' | 'codes'>('idle')
  const handleGenerate = () => {
    setStage('codes')
    onGenerate()
  }

  return (
    <>
      {children({
        onClick: () => {
          onStart?.()
          if (action === 'regenerate') setStage('confirm')
          else handleGenerate()
        },
        isPending: mutation.isPending,
      })}
      <TextConfirmModal
        visible={stage === 'confirm'}
        size="small"
        variant="warning"
        title="Regenerate my recovery codes"
        confirmPlaceholder="REGENERATE"
        confirmString="REGENERATE"
        confirmLabel="Regenerate"
        loading={mutation.isPending}
        onConfirm={handleGenerate}
        onCancel={() => setStage('idle')}
      >
        <p className="text-sm">Your existing recovery codes won't work anymore.</p>
      </TextConfirmModal>
      <RecoveryCodesModal
        open={stage === 'codes'}
        mutation={mutation}
        showSecurityLink={showSecurityLink}
        onOpenChange={(isOpen) => {
          if (isOpen) return
          setStage('idle')
          // The modal permits a successful close only after the save acknowledgement.
          if (mutation.isSuccess) onComplete?.()
        }}
      />
    </>
  )
}
