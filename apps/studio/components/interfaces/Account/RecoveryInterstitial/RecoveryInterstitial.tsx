import { useFeatureFlags, useFlag, useUser } from 'common'
import { ArrowRightIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button, CardFooter, cn } from 'ui'
import { AdmonitionTypeIcon } from 'ui-patterns/Admonition'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import { GenerateRecoveryCodesModal } from '../TOTPFactors/GenerateRecoveryCodesModal'
import { RegenerateRecoveryCodesModal } from '../TOTPFactors/RegenerateRecoveryCodesModal'
import { AuthenticatorTask } from './AuthenticatorTask'
import { getRecoveryGap, type RecoveryGap } from './RecoveryInterstitial.utils'
import { RecoveryTaskRow } from './RecoveryTaskRow'
import { InterstitialLayout, SupabaseLogo } from '@/components/layouts/InterstitialLayout'
import { AlertError } from '@/components/ui/AlertError'
import { useAccountRecovery } from '@/hooks/misc/useAccountRecovery'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'

// Anchor the header while the card grows from checking to actionable tasks.
const recoveryContainerClassName = 'items-start pt-16 sm:pt-32'

export const RecoveryInterstitial = ({ onDismiss }: { onDismiss: () => void }) => {
  return <LiveRecoveryReminder onDismiss={onDismiss} />
}

const LiveRecoveryReminder = ({ onDismiss }: { onDismiss: () => void }) => {
  const user = useUser()
  const { hasLoaded, isConfigCatStale } = useFeatureFlags()
  const flagsReady = hasLoaded === true && !isConfigCatStale
  const isEnabled = useFlag('enableAuthRecoveryCodes')
  const hasSecuritySettings = useIsFeatureEnabled('account:show_security_settings')
  const { findings, isPending, isFetching, isError, verifiedFactorCount } = useAccountRecovery({
    enabled: flagsReady && isEnabled && hasSecuritySettings,
  })
  const isLoading = !flagsReady || isPending || isFetching
  const isUnavailable = flagsReady && (!isEnabled || !hasSecuritySettings)
  const gap = isError || !flagsReady || isPending || isUnavailable ? null : getRecoveryGap(findings)
  let announcement = 'Account recovery check complete'
  if (gap) announcement = 'Account recovery action needed'
  if (isUnavailable) announcement = 'Account recovery check unavailable'
  if (isLoading) announcement = 'Checking account recovery'
  if (isError) announcement = ''
  return (
    <>
      <span className="sr-only" role="status">
        {announcement}
      </span>
      <RecoveryReminder
        key={user?.id}
        gap={gap}
        onDismiss={onDismiss}
        isLoading={isLoading}
        isUnavailable={isUnavailable}
        hasAuthenticatorTask={verifiedFactorCount === 1}
        isError={isError}
      />
    </>
  )
}

export const RecoveryReminder = ({
  gap,
  onDismiss,
  isLoading = false,
  isError = false,
  isUnavailable = false,
  hasAuthenticatorTask = true,
  onCodesComplete,
  onFactorComplete,
  onAction,
  onTaskComplete,
  onExit,
}: {
  gap: RecoveryGap | null
  onDismiss: () => void
  isLoading?: boolean
  isError?: boolean
  isUnavailable?: boolean
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
  useEffect(() => {
    if (isUnavailable || (!activeGap && !isLoading && !isError)) onDismiss()
  }, [activeGap, isLoading, isError, isUnavailable, onDismiss])

  if (isUnavailable || (!activeGap && !isLoading && !isError)) return null
  if (!activeGap && isError) {
    return (
      <InterstitialLayout
        logo={<SupabaseLogo />}
        title="Account recovery check unavailable"
        widthClassName="max-w-md"
        containerClassName={recoveryContainerClassName}
      >
        <div className="px-6">
          <AlertError subject="Failed to check account recovery" />
        </div>
        <CardFooter className="justify-center">
          <Button size="tiny" onClick={onDismiss}>
            Continue
          </Button>
        </CardFooter>
      </InterstitialLayout>
    )
  }
  if (!activeGap) {
    return (
      <InterstitialLayout
        logo={<SupabaseLogo />}
        title={
          <div role="status" aria-label="Checking account recovery">
            <ShimmeringLoader className="h-7 w-40 py-0" />
          </div>
        }
        widthClassName="max-w-md"
        containerClassName={recoveryContainerClassName}
        description={<ShimmeringLoader className="h-5 w-64 max-w-full py-0" />}
      >
        <CardFooter className="justify-center px-6 py-5 min-h-16" />
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
      containerClassName={cn(
        recoveryContainerClassName,
        'relative before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-64 before:bg-gradient-to-b before:from-warning-600/10 before:to-transparent'
      )}
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
          variant="text"
          size="tiny"
          onClick={() => {
            onExit?.({ gap: activeGap, areCodesSaved, isFactorComplete })
            onDismiss()
          }}
          className={areCodesSaved || isFactorComplete ? '' : 'text-foreground-lighter'}
          iconRight={
            areCodesSaved || isFactorComplete ? (
              <ArrowRightIcon size={14} aria-hidden="true" />
            ) : undefined
          }
        >
          {areCodesSaved || isFactorComplete ? 'Continue' : 'Skip for now'}
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
