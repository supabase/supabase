import { useState } from 'react'
import { Button } from 'ui'
import { Admonition } from 'ui-patterns/Admonition'

import { RecoveryCodesModal } from './RecoveryCodesModal'
import { useRecoveryCodesGenerateMutation } from '@/data/recovery-codes/recovery-codes-generate-mutation'

export const GenerateRecoveryCodesModal = () => {
  const recoveryCodesGenerateMutation = useRecoveryCodesGenerateMutation()
  const [open, setOpen] = useState(false)

  return (
    <Admonition
      type="danger"
      layout="horizontal"
      title="You haven't generated recovery codes yet"
      description="Recovery codes are important to ensure you can recover your account if you loose access to your MFA."
      actions={
        <>
          <Button
            onClick={() => {
              setOpen(true)
              recoveryCodesGenerateMutation.mutate({})
            }}
          >
            Generate recovery codes
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
