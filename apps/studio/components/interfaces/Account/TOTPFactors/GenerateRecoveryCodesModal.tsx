import { ReactNode, useState } from 'react'
import { Button } from 'ui'
import { Admonition } from 'ui-patterns/Admonition'

import { RecoveryCodesModal } from './RecoveryCodesModal'
import { useRecoveryCodesGenerateMutation } from '@/data/recovery-codes/recovery-codes-generate-mutation'

export interface GenerateRecoveryCodesModalProps {
  children?: (trigger: { onClick: () => void; isPending: boolean }) => ReactNode
  onComplete?: () => void
  onStart?: () => void
  showSecurityLink?: boolean
}

const DefaultTrigger = ({ onClick, isPending }: { onClick: () => void; isPending: boolean }) => (
  <Admonition
    type="warning"
    layout="horizontal"
    title="No recovery codes generated"
    description="Recovery codes let you access your account if you lose access to your MFA device"
    actions={
      <Button onClick={onClick} loading={isPending}>
        {isPending ? 'Generating codes' : 'Generate recovery codes'}
      </Button>
    }
  />
)

export const GenerateRecoveryCodesModal = ({
  children,
  onComplete,
  onStart,
  showSecurityLink,
}: GenerateRecoveryCodesModalProps = {}) => {
  const mutation = useRecoveryCodesGenerateMutation()
  const [isOpen, setIsOpen] = useState(false)
  const handleGenerate = () => {
    onStart?.()
    setIsOpen(true)
    mutation.mutate({})
  }
  const triggerProps = { onClick: handleGenerate, isPending: mutation.isPending }

  return (
    <>
      {children ? children(triggerProps) : <DefaultTrigger {...triggerProps} />}
      <RecoveryCodesModal
        open={isOpen}
        mutation={mutation}
        showSecurityLink={showSecurityLink}
        onOpenChange={(open) => {
          setIsOpen(open)
          if (!open && mutation.isSuccess) onComplete?.()
        }}
      />
    </>
  )
}
