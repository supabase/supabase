import { useQueryClient } from '@tanstack/react-query'
import { useFlag, useUser } from 'common'
import { ArrowRightIcon } from 'lucide-react'
import { parseAsString, useQueryState } from 'nuqs'
import { useState } from 'react'
import { Button, CardFooter } from 'ui'
import { AdmonitionTypeIcon } from 'ui-patterns/Admonition'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import { GenerateRecoveryCodesModal } from '../TOTPFactors/GenerateRecoveryCodesModal'
import { RegenerateRecoveryCodesModal } from '../TOTPFactors/RegenerateRecoveryCodesModal'
import { AuthenticatorTask } from './AuthenticatorTask'
import { getRecoveryGap, getRecoveryReturnTo, type RecoveryGap } from './RecoveryInterstitial.utils'
import { RecoveryTaskRow } from './RecoveryTaskRow'
import { InterstitialLayout, SupabaseLogo } from '@/components/layouts/InterstitialLayout'
import { AlertError } from '@/components/ui/AlertError'
import { profileKeys } from '@/data/profile/keys'
import { recoveryCodeKeys } from '@/data/recovery-codes/keys'
import { useAccountRecovery } from '@/hooks/misc/useAccountRecovery'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'
import {
  clearRecoveryReminderSnooze,
  getRemainingRecoveryGap,
  writeRecoveryReminderSnooze,
} from '@/lib/account-recovery/recovery-reminder'
import { BASE_PATH } from '@/lib/constants'

export const RecoveryInterstitial = () => {
  const [returnTo] = useQueryState('returnTo', parseAsString)
  const destination = getRecoveryReturnTo(returnTo, BASE_PATH)

  return <LiveRecoveryReminder destination={destination} />
}

const LiveRecoveryReminder = ({ destination }: { destination: string }) => {
  const user = useUser()
  const queryClient = useQueryClient()
  const isEnabled = useFlag('enableAuthRecoveryCodes')
  const hasSecuritySettings = useIsFeatureEnabled('account:show_security_settings')
  const { findings, isPending, isError, verifiedFactorCount } = useAccountRecovery({
    enabled: isEnabled && hasSecuritySettings,
  })
  const gap = isError || isPending ? null : getRecoveryGap(findings)
  return (
    <RecoveryReminder
      key={user?.id}
      gap={gap}
      destination={destination}
      isLoading={isPending}
      isError={isError}
      hasAuthenticatorTask={verifiedFactorCount === 1}
      onExit={({ gap: activeGap, areCodesSaved, isFactorComplete }) => {
        if (user?.id) {
          // Completed mutations can precede the refreshed status response.
          const remainingGap = getRemainingRecoveryGap({
            currentGap: getRecoveryGap(findings),
            activeGap,
            isReadUnavailable: isPending || isError,
            areCodesSaved,
            isFactorComplete,
          })
          if (remainingGap) writeRecoveryReminderSnooze(user.id, remainingGap)
          else clearRecoveryReminderSnooze(user.id)
        }
      }}
      onCodesComplete={() => {
        queryClient.invalidateQueries({ queryKey: recoveryCodeKeys.status(user?.id) })
      }}
      onFactorComplete={() => {
        queryClient.invalidateQueries({ queryKey: profileKeys.mfaFactors(user?.id) })
      }}
    />
  )
}

export const RecoveryReminder = ({
  gap,
  destination,
  isLoading = false,
  isError = false,
  hasAuthenticatorTask = true,
  onCodesComplete,
  onFactorComplete,
  onAction,
  onTaskComplete,
  onExit,
}: {
  gap: RecoveryGap | null
  destination: string
  isLoading?: boolean
  isError?: boolean
  hasAuthenticatorTask?: boolean
  onCodesComplete?: () => void
  onFactorComplete?: () => void
  onAction?: (action: 'generate_codes' | 'regenerate_codes' | 'add_factor') => void
  onTaskComplete?: (task: 'recovery_codes' | 'authenticator') => void
  onExit?: (state: { gap: RecoveryGap; areCodesSaved: boolean; isFactorComplete: boolean }) => void
}) => {
  const [startedGap, setStartedGap] = useState<RecoveryGap | null>(null)
  const [startedHasAuthenticatorTask, setStartedHasAuthenticatorTask] = useState<boolean | null>(
    null
  )
  const [areCodesSaved, setAreCodesSaved] = useState(false)
  const [isFactorComplete, setIsFactorComplete] = useState(false)
  // Preserve all task dialogs and completed rows during background status updates.
  const activeGap = startedGap ?? gap
  if (!activeGap && isError) {
    return (
      <InterstitialLayout
        logo={<SupabaseLogo />}
        title="Account recovery check unavailable"
        widthClassName="max-w-md"
      >
        <div className="px-6">
          <AlertError subject="Failed to check account recovery" />
        </div>
        <CardFooter className="justify-center">
          <Button asChild size="tiny">
            <a href={destination}>Continue</a>
          </Button>
        </CardFooter>
      </InterstitialLayout>
    )
  }
  if (!activeGap) {
    return (
      <InterstitialLayout
        logo={
          <div className="relative">
            <SupabaseLogo />
            {!isLoading && (
              <span className="absolute -top-2 -right-2 scale-80">
                <AdmonitionTypeIcon type="success" />
              </span>
            )}
          </div>
        }
        title={
          isLoading ? (
            <div role="status" aria-label="Checking account recovery">
              <ShimmeringLoader className="h-7 w-40 py-0" />
            </div>
          ) : (
            'You’re all set'
          )
        }
        widthClassName="max-w-md"
        description={
          isLoading ? (
            <ShimmeringLoader className="h-5 w-64 max-w-full py-0" />
          ) : (
            'No account recovery reminder is available.'
          )
        }
      >
        <CardFooter className="justify-center min-h-12">
          {!isLoading && (
            <Button asChild size="tiny">
              <a href={destination}>Continue</a>
            </Button>
          )}
        </CardFooter>
      </InterstitialLayout>
    )
  }
  const isExhausted = activeGap === 'exhausted'
  const handleStart = () => {
    setStartedGap(activeGap)
    setStartedHasAuthenticatorTask(startedHasAuthenticatorTask ?? hasAuthenticatorTask)
  }
  const handleCodesSaved = () => {
    setAreCodesSaved(true)
    onCodesComplete?.()
    onTaskComplete?.('recovery_codes')
  }
  const flowProps = {
    showSecurityLink: true,
    onStart: () => {
      handleStart()
      onAction?.(isExhausted ? 'regenerate_codes' : 'generate_codes')
    },
    onComplete: handleCodesSaved,
    children: getRecoveryCodeTrigger(isExhausted, areCodesSaved),
  }
  let codesTitle = isExhausted ? 'Recovery codes used up' : 'No recovery codes'
  if (areCodesSaved) codesTitle = 'Recovery codes saved'

  return (
    <InterstitialLayout
      logo={
        <div className="relative">
          <SupabaseLogo />
          <span className="absolute -top-2 -right-2 scale-80">
            <AdmonitionTypeIcon type="warning" />
          </span>
        </div>
      }
      title="Secure your account"
      description="Complete the following tasks to reduce the risk of being locked out of your Supabase account."
      widthClassName="max-w-md"
      containerClassName="relative before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-64 before:bg-gradient-to-b before:from-warning-600/10 before:to-transparent"
      cardClassName="relative"
    >
      <div className="border-t divide-y">
        <RecoveryTaskRow
          title={codesTitle}
          description={getCodesDescription(isExhausted, areCodesSaved)}
          isComplete={areCodesSaved}
        >
          {isExhausted && <RegenerateRecoveryCodesModal {...flowProps} />}
          {!isExhausted && <GenerateRecoveryCodesModal {...flowProps} />}
        </RecoveryTaskRow>
        {(startedHasAuthenticatorTask ?? hasAuthenticatorTask) && (
          <AuthenticatorTask
            onStart={() => {
              handleStart()
              onAction?.('add_factor')
            }}
            onComplete={() => {
              setIsFactorComplete(true)
              onFactorComplete?.()
              onTaskComplete?.('authenticator')
            }}
            onRecoveryCodesSaved={handleCodesSaved}
          />
        )}
      </div>
      <CardFooter className="justify-center px-6 py-5 border-t">
        <Button
          asChild
          variant="text"
          size="tiny"
          className={areCodesSaved || isFactorComplete ? '' : 'text-foreground-lighter'}
          iconRight={
            areCodesSaved || isFactorComplete ? (
              <ArrowRightIcon size={14} aria-hidden="true" />
            ) : undefined
          }
        >
          <a
            href={destination}
            onClick={() => onExit?.({ gap: activeGap, areCodesSaved, isFactorComplete })}
          >
            {areCodesSaved || isFactorComplete ? 'Continue' : 'Skip for now'}
          </a>
        </Button>
      </CardFooter>
    </InterstitialLayout>
  )
}

function getCodesDescription(isExhausted: boolean, areCodesSaved: boolean) {
  if (areCodesSaved) return 'Keep your recovery codes somewhere safe.'
  return isExhausted
    ? 'Generate a new set for future use.'
    : 'Save codes in case you lose access to your authenticator.'
}

function getRecoveryCodeTrigger(isExhausted: boolean, areCodesSaved: boolean) {
  return function RecoveryCodeTrigger({
    onClick,
    isPending,
  }: {
    onClick: () => void
    isPending: boolean
  }) {
    if (areCodesSaved) return null
    return (
      <Button variant="primary" size="tiny" onClick={onClick} loading={isPending}>
        {isExhausted ? 'Regenerate codes' : 'Generate codes'}
      </Button>
    )
  }
}
