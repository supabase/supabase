import { useFeatureFlags, useFlag, useUser } from 'common'
import { ArrowRightIcon } from 'lucide-react'
import { useState } from 'react'
import { Button, CardFooter } from 'ui'
import { AdmonitionTypeIcon } from 'ui-patterns/Admonition'

import { GenerateRecoveryCodesModal } from '../TOTPFactors/GenerateRecoveryCodesModal'
import { RegenerateRecoveryCodesModal } from '../TOTPFactors/RegenerateRecoveryCodesModal'
import { getRecoveryGap, type RecoveryGap } from './RecoveryInterstitial.utils'
import { RecoveryTaskRow } from './RecoveryTaskRow'
import { InterstitialLayout, SupabaseLogo } from '@/components/layouts/InterstitialLayout'
import { AlertError } from '@/components/ui/AlertError'
import { useAccountRecovery } from '@/hooks/misc/useAccountRecovery'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'

export const RecoveryInterstitial = ({ onDismiss }: { onDismiss: () => void }) => {
  return <LiveRecoveryReminder onDismiss={onDismiss} />
}

const LiveRecoveryReminder = ({ onDismiss }: { onDismiss: () => void }) => {
  const user = useUser()
  const { hasLoaded, isConfigCatStale } = useFeatureFlags()
  const flagsReady = hasLoaded === true && !isConfigCatStale
  const isEnabled = useFlag('enableAuthRecoveryCodes')
  const hasSecuritySettings = useIsFeatureEnabled('account:show_security_settings')
  const { findings, isPending, isError } = useAccountRecovery({
    enabled: flagsReady && isEnabled && hasSecuritySettings,
  })
  const isLoading = !flagsReady || isPending
  const isUnavailable = flagsReady && (!isEnabled || !hasSecuritySettings)
  const gap = isError || isLoading || isUnavailable ? null : getRecoveryGap(findings)
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
  onCodesComplete,
  onAction,
  onTaskComplete,
  onExit,
}: {
  gap: RecoveryGap | null
  onDismiss: () => void
  isLoading?: boolean
  isError?: boolean
  isUnavailable?: boolean
  onCodesComplete?: () => void
  onAction?: (action: 'generate_codes' | 'regenerate_codes' | 'add_factor') => void
  onTaskComplete?: (task: 'recovery_codes' | 'authenticator') => void
  onExit?: (state: { gap: RecoveryGap; areCodesSaved: boolean; isFactorComplete: boolean }) => void
}) => {
  const [startedGap, setStartedGap] = useState<RecoveryGap | null>(null)
  const [areCodesSaved, setAreCodesSaved] = useState(false)
  const isFactorComplete = false
  // Preserve all task dialogs and completed rows during background status updates.
  const activeGap = startedGap ?? gap
  const emptyTitle =
    isError || isUnavailable ? 'Account recovery check unavailable' : 'You’re all set'
  const emptyDescription = isUnavailable
    ? 'Account recovery checks are not enabled for this account.'
    : 'No account recovery reminder is available.'
  if (!activeGap) {
    return (
      <InterstitialLayout
        logo={<SupabaseLogo />}
        title={isLoading ? 'Checking account recovery' : emptyTitle}
        description={isLoading || isError ? undefined : emptyDescription}
        widthClassName="max-w-md"
      >
        {isError && (
          <div className="px-6">
            <AlertError subject="Failed to check account recovery" />
          </div>
        )}
        <CardFooter className="justify-center min-h-12">
          {!isLoading && (
            <Button size="tiny" onClick={onDismiss}>
              Continue
            </Button>
          )}
        </CardFooter>
      </InterstitialLayout>
    )
  }
  const isExhausted = activeGap === 'exhausted'
  const handleStart = () => {
    setStartedGap(activeGap)
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
