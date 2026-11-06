import { RectangleEllipsisIcon } from 'lucide-react'
import { Admonition } from 'ui-patterns/Admonition'
import { EmptyStatePresentational } from 'ui-patterns/EmptyStatePresentational'

import { GenerateRecoveryCodesModal } from './GenerateRecoveryCodesModal'
import type { AccountRecoveryFinding } from '@/lib/account-recovery/evaluate-account-recovery'

interface RecoveryCodesSetupProps {
  finding: AccountRecoveryFinding | undefined
  isPrimary: boolean
}

export const RecoveryCodesSetup = ({ finding, isPrimary }: RecoveryCodesSetupProps) => (
  <>
    {finding && (
      <Admonition
        type="warning"
        title="No recovery codes"
        description="Save recovery codes so you can sign in if you lose access to your authenticator."
      />
    )}
    <EmptyStatePresentational
      icon={RectangleEllipsisIcon}
      title="Set up recovery codes"
      description="Save a backup way to sign in if you lose your authenticator."
    >
      <GenerateRecoveryCodesModal variant={isPrimary ? 'primary' : 'default'} />
    </EmptyStatePresentational>
  </>
)
