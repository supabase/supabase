import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useFlag, useUser } from 'common'
import { ArrowRight } from 'lucide-react'
import { parseAsString, useQueryState } from 'nuqs'
import { useState } from 'react'
import { Button, CardFooter } from 'ui'
import { AdmonitionTypeIcon } from 'ui-patterns/Admonition'

import { GenerateRecoveryCodesModal } from '../TOTPFactors/GenerateRecoveryCodesModal'
import { RegenerateRecoveryCodesModal } from '../TOTPFactors/RegenerateRecoveryCodesModal'
import { AuthenticatorTask } from './AuthenticatorTask'
import { recoveryInterstitialKeys } from './keys'
import { PreviewRecoveryCodesFlow } from './PreviewRecoveryCodesFlow'
import {
  evaluateRecoveryGap,
  getMockRecoveryGap,
  getRecoveryReturnTo,
  type RecoveryGap,
} from './RecoveryInterstitial.utils'
import { RecoveryTaskRow } from './RecoveryTaskRow'
import { InterstitialLayout, SupabaseLogo } from '@/components/layouts/InterstitialLayout'
import { getMfaListFactors } from '@/data/profile/mfa-list-factors-query'
import { getProfileIdentities } from '@/data/profile/profile-identities-query'
import { getRecoveryCodesStatus } from '@/data/recovery-codes/recovery-codes-status-query'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'
import { IS_PLATFORM } from '@/lib/constants'

export const RecoveryInterstitial = () => {
  const [mock] = useQueryState('mockRecoveryInterstitial', parseAsString)
  const [returnTo] = useQueryState('returnTo', parseAsString)
  const [mockTasks] = useQueryState('mockRecoveryTasks', parseAsString)
  const mockGap = getMockRecoveryGap(mock, process.env.NODE_ENV === 'development')
  const destination = getRecoveryReturnTo(returnTo)

  if (mockGap)
    return (
      <RecoveryReminder
        gap={mockGap}
        destination={destination}
        isPreview
        hasAuthenticatorTask={mockTasks !== 'codes'}
      />
    )
  return <LiveRecoveryReminder destination={destination} />
}

const LiveRecoveryReminder = ({ destination }: { destination: string }) => {
  const user = useUser()
  const queryClient = useQueryClient()
  const isEnabled = useFlag('enableAuthRecoveryCodes')
  const hasSecuritySettings = useIsFeatureEnabled('account:show_security_settings')
  const canReadAccount = IS_PLATFORM && !!user?.id && !!isEnabled && hasSecuritySettings
  const identities = useQuery({
    queryKey: recoveryInterstitialKeys.identities(user?.id),
    queryFn: getProfileIdentities,
    enabled: canReadAccount,
    staleTime: 0,
  })
  const factors = useQuery({
    queryKey: recoveryInterstitialKeys.factors(user?.id),
    queryFn: getMfaListFactors,
    enabled: canReadAccount,
    staleTime: 0,
  })
  const codes = useQuery({
    queryKey: recoveryInterstitialKeys.codes(user?.id),
    queryFn: getRecoveryCodesStatus,
    enabled: canReadAccount,
    staleTime: 0,
  })
  const isReady =
    identities.isSuccess &&
    factors.isSuccess &&
    codes.isSuccess &&
    (codes.data.status === 'unenrolled' || codes.data.data !== null)
  const gap = evaluateRecoveryGap({
    isEnabled: canReadAccount,
    isReady,
    isManaged:
      identities.data?.identities.some((identity) => identity.provider.startsWith('sso')) ?? false,
    verifiedFactorCount:
      factors.data?.all.filter(
        (factor) => factor.status === 'verified' && factor.factor_type !== 'recovery_code'
      ).length ?? 0,
    remainingCodes: codes.data?.data?.remaining ?? null,
  })

  const isLoading = canReadAccount && (identities.isPending || factors.isPending || codes.isPending)
  return (
    <RecoveryReminder
      key={user?.id}
      gap={gap}
      destination={destination}
      isLoading={isLoading}
      onCodesComplete={() => {
        queryClient.invalidateQueries({ queryKey: recoveryInterstitialKeys.codes(user?.id) })
      }}
      onFactorComplete={() => {
        queryClient.invalidateQueries({ queryKey: recoveryInterstitialKeys.factors(user?.id) })
      }}
    />
  )
}

export const RecoveryReminder = ({
  gap,
  destination,
  isPreview = false,
  isLoading = false,
  hasAuthenticatorTask = true,
  onCodesComplete,
  onFactorComplete,
}: {
  gap: RecoveryGap | null
  destination: string
  isPreview?: boolean
  isLoading?: boolean
  hasAuthenticatorTask?: boolean
  onCodesComplete?: () => void
  onFactorComplete?: () => void
}) => {
  const [startedGap, setStartedGap] = useState<RecoveryGap | null>(null)
  const [areCodesSaved, setAreCodesSaved] = useState(false)
  const [isFactorComplete, setIsFactorComplete] = useState(false)
  // Preserve all task dialogs and completed rows during background status updates.
  const activeGap = startedGap ?? gap
  if (!activeGap) {
    return (
      <InterstitialLayout
        title={isLoading ? 'Checking account recovery' : 'Continue to your dashboard'}
        description={
          isLoading
            ? 'Checking your backup sign-in options.'
            : 'No account recovery reminder is available.'
        }
      >
        <CardFooter className="justify-center">
          <Button asChild size="tiny">
            <a href={destination}>Continue to dashboard</a>
          </Button>
        </CardFooter>
      </InterstitialLayout>
    )
  }
  const isExhausted = activeGap === 'exhausted'
  const handleStart = () => setStartedGap(activeGap)
  const handleCodesSaved = () => {
    setAreCodesSaved(true)
    onCodesComplete?.()
  }
  const flowProps = {
    onStart: handleStart,
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
          {isPreview && (
            <PreviewRecoveryCodesFlow
              action={isExhausted ? 'regenerate' : 'generate'}
              {...flowProps}
            />
          )}
          {!isPreview && isExhausted && <RegenerateRecoveryCodesModal {...flowProps} />}
          {!isPreview && !isExhausted && <GenerateRecoveryCodesModal {...flowProps} />}
        </RecoveryTaskRow>
        {hasAuthenticatorTask && (
          <AuthenticatorTask
            isPreview={isPreview}
            onStart={handleStart}
            onComplete={() => {
              setIsFactorComplete(true)
              onFactorComplete?.()
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
              <ArrowRight size={14} aria-hidden="true" />
            ) : undefined
          }
        >
          <a href={destination}>
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
