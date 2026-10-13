import { ComponentProps } from 'react'
import { Button } from 'ui'
import { Admonition } from 'ui-patterns/Admonition'

import { RecoveryCodesFlow } from './RecoveryCodesFlow'
import { useRecoveryCodesGenerateMutation } from '@/data/recovery-codes/recovery-codes-generate-mutation'

type GenerateRecoveryCodesModalProps = Partial<
  Pick<ComponentProps<typeof RecoveryCodesFlow>, 'children' | 'onComplete' | 'onStart'>
>

export const GenerateRecoveryCodesModal = ({
  children,
  ...props
}: GenerateRecoveryCodesModalProps = {}) => {
  const mutation = useRecoveryCodesGenerateMutation()
  return (
    <RecoveryCodesFlow
      action="generate"
      mutation={mutation}
      onGenerate={() => mutation.mutate({})}
      {...props}
    >
      {children ??
        (({ onClick, isPending }) => (
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
        ))}
    </RecoveryCodesFlow>
  )
}
