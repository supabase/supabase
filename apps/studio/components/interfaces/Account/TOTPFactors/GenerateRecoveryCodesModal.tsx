import { useState } from 'react'
import { Button } from 'ui'
import { Admonition } from 'ui-patterns/Admonition'

import { RecoveryCodesModal } from './RecoveryCodesModal'
import { useRecoveryCodesGenerateMutation } from '@/data/recovery-codes/recovery-codes-generate-mutation'

export const GenerateRecoveryCodesModal = () => {
  const recoveryCodesGenerateMutation = useRecoveryCodesGenerateMutation({
    onSettled: () => setOpen(true),
  })
  const { mutate, isPending } = recoveryCodesGenerateMutation

  const [open, setOpen] = useState(false)

  return (
    <Admonition
      type="warning"
      layout="horizontal"
      title="No recovery codes generated"
      description="Recovery codes let you access your account if you lose access to your MFA device"
      actions={
        <>
          <Button onClick={() => mutate({})} loading={isPending}>
            {isPending ? 'Generating codes' : 'Generate recovery codes'}
          </Button>
          <RecoveryCodesModal
            open={open}
            onOpenChange={(open) => setOpen(open)}
            mutation={recoveryCodesGenerateMutation}
          />
        </>
      }
    />
  )
}
