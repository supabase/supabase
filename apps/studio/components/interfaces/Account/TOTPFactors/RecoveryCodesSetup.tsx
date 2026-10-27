import { RectangleEllipsisIcon } from 'lucide-react'
import { Button } from 'ui'
import { Admonition } from 'ui-patterns/Admonition'
import { EmptyStatePresentational } from 'ui-patterns/EmptyStatePresentational'

import { GenerateRecoveryCodesModal } from './GenerateRecoveryCodesModal'
import type { AccountRecoveryFinding } from '@/lib/account-recovery/evaluate-account-recovery'

interface RecoveryCodesSetupProps {
  isVisible: boolean
  finding: AccountRecoveryFinding | undefined
  isPrimary: boolean
}

export const RecoveryCodesSetup = ({ isVisible, finding, isPrimary }: RecoveryCodesSetupProps) => (
  <GenerateRecoveryCodesModal>
    {({ onClick, isPending }) =>
      isVisible ? (
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
            <Button
              variant={isPrimary ? 'primary' : 'default'}
              onClick={onClick}
              loading={isPending}
            >
              Generate recovery codes
            </Button>
          </EmptyStatePresentational>
        </>
      ) : null
    }
  </GenerateRecoveryCodesModal>
)
