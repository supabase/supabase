import { ComponentProps, useState } from 'react'
import { Button } from 'ui'

import { RecoveryCodesModal } from './RecoveryCodesModal'
import { useRecoveryCodesGenerateMutation } from '@/data/recovery-codes/recovery-codes-generate-mutation'

export interface GenerateRecoveryCodesModalProps extends Pick<
  ComponentProps<typeof Button>,
  'variant' | 'size'
> {
  label?: string
  onComplete?: () => void
  onStart?: () => void
  showSecurityLink?: boolean
}

export const GenerateRecoveryCodesModal = ({
  label = 'Generate recovery codes',
  variant,
  size,
  onComplete,
  onStart,
  showSecurityLink,
}: GenerateRecoveryCodesModalProps) => {
  const mutation = useRecoveryCodesGenerateMutation()
  const [isOpen, setIsOpen] = useState(false)
  const handleGenerate = () => {
    onStart?.()
    setIsOpen(true)
    mutation.mutate({})
  }

  return (
    <>
      <Button variant={variant} size={size} onClick={handleGenerate} loading={mutation.isPending}>
        {label}
      </Button>
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
