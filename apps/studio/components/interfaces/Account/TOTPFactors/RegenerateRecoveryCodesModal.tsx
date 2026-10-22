import { RefreshCwIcon } from 'lucide-react'
import { ComponentProps } from 'react'
import { Button } from 'ui'

import { RecoveryCodesFlow } from './RecoveryCodesFlow'
import { useRecoveryCodesRegenerateMutation } from '@/data/recovery-codes/recovery-codes-regenerate-mutation'

type RegenerateRecoveryCodesModalProps = Partial<
  Pick<ComponentProps<typeof RecoveryCodesFlow>, 'children' | 'onComplete' | 'onStart'>
>

export const RegenerateRecoveryCodesModal = ({
  children,
  ...props
}: RegenerateRecoveryCodesModalProps = {}) => {
  const mutation = useRecoveryCodesRegenerateMutation()
  return (
    <RecoveryCodesFlow
      action="regenerate"
      mutation={mutation}
      onGenerate={() => mutation.mutate()}
      {...props}
    >
      {children ??
        (({ onClick, isPending }) => (
          <Button icon={<RefreshCwIcon />} onClick={onClick} loading={isPending}>
            Regenerate
          </Button>
        ))}
    </RecoveryCodesFlow>
  )
}
