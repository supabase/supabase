import type { AuthMFARecoveryCodesStatusResponseData } from '@supabase/supabase-js'
import { RectangleEllipsisIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Card, CardContent } from 'ui'
import { Admonition } from 'ui-patterns/Admonition'

import type { AccountRecoveryFinding } from '@/lib/account-recovery/evaluate-account-recovery'

interface RecoveryCodesAvailableProps {
  codes: AuthMFARecoveryCodesStatusResponseData
  finding: AccountRecoveryFinding | undefined
  children: ReactNode
}

export const RecoveryCodesAvailable = ({
  codes,
  finding,
  children,
}: RecoveryCodesAvailableProps) => {
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
          {children}
        </CardContent>
      </Card>
    </>
  )
}
