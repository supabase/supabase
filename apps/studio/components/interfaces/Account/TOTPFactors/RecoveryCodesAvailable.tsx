import type { AuthMFARecoveryCodesStatusResponseData } from '@supabase/supabase-js'
import { ChevronDownIcon, RectangleEllipsisIcon, RefreshCwIcon } from 'lucide-react'
import { useState } from 'react'
import {
  Button,
  Card,
  CardContent,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from 'ui'
import { Admonition } from 'ui-patterns/Admonition'

import { RegenerateRecoveryCodesModal } from './RegenerateRecoveryCodesModal'
import { UnenrollRecoveryCodesModal } from './UnenrollRecoveryCodesModal'
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
  const [isRemovalOpen, setIsRemovalOpen] = useState(false)

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
              onRemove={() => setIsRemovalOpen(true)}
            />
          ) : null
        }
      </RegenerateRecoveryCodesModal>
      <UnenrollRecoveryCodesModal visible={isRemovalOpen} onClose={() => setIsRemovalOpen(false)} />
    </>
  )
}

interface RecoveryCodesCardProps {
  codes: AuthMFARecoveryCodesStatusResponseData
  finding: AccountRecoveryFinding | undefined
  isPrimary: boolean
  onRegenerate: () => void
  isRegenerating: boolean
  onRemove: () => void
}

const RecoveryCodesCard = ({
  codes,
  finding,
  isPrimary,
  onRegenerate,
  isRegenerating,
  onRemove,
}: RecoveryCodesCardProps) => {
  const action = (
    <div className="flex w-fit">
      <Button
        variant={isPrimary ? 'primary' : 'default'}
        className="flex-1 @lg:flex-none rounded-r-none hover:z-10 focus-visible:z-10 focus-visible:rounded-r-sm"
        icon={<RefreshCwIcon />}
        onClick={onRegenerate}
        loading={isRegenerating}
      >
        Regenerate
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant={isPrimary ? 'primary' : 'default'}
            aria-label="Recovery code options"
            className="shrink-0 rounded-l-none px-1 py-1.25 -ml-px focus-visible:z-10 focus-visible:rounded-l-sm"
            icon={<ChevronDownIcon />}
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem onSelect={onRemove}>Remove codes</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
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
