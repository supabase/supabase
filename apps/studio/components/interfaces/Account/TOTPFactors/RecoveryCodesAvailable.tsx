import type { AuthMFARecoveryCodesStatusResponseData } from '@supabase/supabase-js'
import { RectangleEllipsisIcon, RefreshCwIcon } from 'lucide-react'
import { Button, Card, CardContent } from 'ui'
import { Admonition } from 'ui-patterns/Admonition'

import { RegenerateRecoveryCodesModal } from './RegenerateRecoveryCodesModal'
import type { AccountRecoveryFinding } from '@/lib/account-recovery/evaluate-account-recovery'

interface RecoveryCodesAvailableProps {
  codes: AuthMFARecoveryCodesStatusResponseData | undefined
  isVisible: boolean
  finding: AccountRecoveryFinding | undefined
  isPrimary: boolean
}

export const RecoveryCodesAvailable = ({
  codes,
  isVisible,
  finding,
  isPrimary,
}: RecoveryCodesAvailableProps) => {
  return (
    <>
      <RegenerateRecoveryCodesModal>
        {({ onClick, isPending }) =>
          isVisible && codes ? (
            <RecoveryCodesCard
              codes={codes}
              finding={finding}
              isPrimary={isPrimary}
              onRegenerate={onClick}
              isRegenerating={isPending}
            />
          ) : null
        }
      </RegenerateRecoveryCodesModal>
    </>
  )
}

interface RecoveryCodesCardProps {
  codes: AuthMFARecoveryCodesStatusResponseData
  finding: AccountRecoveryFinding | undefined
  isPrimary: boolean
  onRegenerate: () => void
  isRegenerating: boolean
}

const RecoveryCodesCard = ({
  codes,
  finding,
  isPrimary,
  onRegenerate,
  isRegenerating,
}: RecoveryCodesCardProps) => {
  const action = (
    <Button
      variant={isPrimary ? 'primary' : 'default'}
      icon={<RefreshCwIcon />}
      onClick={onRegenerate}
      loading={isRegenerating}
    >
      Regenerate
    </Button>
  )
  return (
    <>
      {finding && (
        <Admonition
          type={finding.severity === 'critical' ? 'destructive' : 'warning'}
          title={
            finding.id === 'recovery-codes-exhausted'
              ? 'Recovery codes used up'
              : `${codes.remaining} recovery ${codes.remaining === 1 ? 'code' : 'codes'} remaining`
          }
          description={
            finding.id === 'recovery-codes-exhausted'
              ? 'Generate a new set so you have a backup way to sign in.'
              : 'Generate a new set before you need them to recover your account.'
          }
        />
      )}
      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-x-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-selection">
              <RectangleEllipsisIcon size={18} className="text-foreground-lighter" />
            </div>
            <div className="text-sm">
              <p>
                {codes.remaining} of {codes.total} recovery codes available
              </p>
              <p className="text-foreground-lighter">
                Each code can only be used once. Keep them somewhere safe.
              </p>
            </div>
          </div>
          {action}
        </CardContent>
      </Card>
    </>
  )
}
