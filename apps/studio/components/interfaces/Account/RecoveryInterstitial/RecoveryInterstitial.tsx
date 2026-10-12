import { useQuery } from '@tanstack/react-query'
import { useFlag, useUser } from 'common'
import { parseAsString, useQueryState } from 'nuqs'
import { Button, CardContent, CardFooter } from 'ui'
import { AdmonitionTypeIcon } from 'ui-patterns/Admonition'

import { recoveryInterstitialKeys } from './keys'
import {
  evaluateRecoveryGap,
  getMockRecoveryGap,
  getRecoveryReturnTo,
  type RecoveryGap,
} from './RecoveryInterstitial.utils'
import { InterstitialLayout, SupabaseLogo } from '@/components/layouts/InterstitialLayout'
import { getMfaListFactors } from '@/data/profile/mfa-list-factors-query'
import { getProfileIdentities } from '@/data/profile/profile-identities-query'
import { getRecoveryCodesStatus } from '@/data/recovery-codes/recovery-codes-status-query'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'
import { IS_PLATFORM } from '@/lib/constants'

export const RecoveryInterstitial = () => {
  const [mock] = useQueryState('mockRecoveryInterstitial', parseAsString)
  const [returnTo] = useQueryState('returnTo', parseAsString)
  const mockGap = getMockRecoveryGap(mock, process.env.NODE_ENV === 'development')
  const destination = getRecoveryReturnTo(returnTo)

  if (mockGap) return <RecoveryReminder gap={mockGap} destination={destination} />
  return <LiveRecoveryReminder destination={destination} />
}

const LiveRecoveryReminder = ({ destination }: { destination: string }) => {
  const user = useUser()
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

  if (gap) return <RecoveryReminder gap={gap} destination={destination} />
  const isLoading = canReadAccount && (identities.isPending || factors.isPending || codes.isPending)

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
        <Button asChild>
          <a href={destination}>Continue to dashboard</a>
        </Button>
      </CardFooter>
    </InterstitialLayout>
  )
}

export const RecoveryReminder = ({
  gap,
  destination,
}: {
  gap: RecoveryGap
  destination: string
}) => {
  const isExhausted = gap === 'exhausted'
  const securityHref = `/account/security?recoveryReturnTo=${encodeURIComponent(destination)}`
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
      title="Save a backup way to sign in"
      description={
        isExhausted
          ? 'You have used all your recovery codes.'
          : 'You have one authenticator and no recovery codes.'
      }
      widthClassName="max-w-md"
      containerClassName="relative before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-64 before:bg-gradient-to-b before:from-warning-600/10 before:to-transparent"
      cardClassName="relative"
    >
      <CardContent className="border-0 px-6 pb-6 text-sm text-foreground-light">
        <p>
          Recovery codes let you sign in if you lose access to your authenticator. Generate a set
          and store them somewhere safe.
        </p>
        <p className="mt-3">You can do this later in Account Security.</p>
      </CardContent>
      <CardFooter className="flex flex-col gap-3 px-6 py-5">
        <Button asChild block variant="primary" size="small">
          <a href={securityHref}>Review account security</a>
        </Button>
        <Button asChild block variant="text" size="small">
          <a href={destination}>Continue to dashboard</a>
        </Button>
      </CardFooter>
    </InterstitialLayout>
  )
}
