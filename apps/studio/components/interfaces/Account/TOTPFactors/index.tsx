import { useFlag } from 'common'
import dayjs from 'dayjs'
import { LockKeyholeIcon, PlusIcon, ShieldCheckIcon, TrashIcon } from 'lucide-react'
import { parseAsString, useQueryState } from 'nuqs'
import { useState } from 'react'
import { Button, Card, CardContent } from 'ui'
import { Admonition } from 'ui-patterns/Admonition'
import { EmptyStatePresentational } from 'ui-patterns/EmptyStatePresentational'
import {
  PageSection,
  PageSectionAside,
  PageSectionContent,
  PageSectionDescription,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns/PageSection'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'
import { TimestampInfo } from 'ui-patterns/TimestampInfo'

import { AddNewFactorModal } from './AddNewFactorModal'
import { DeleteFactorModal } from './DeleteFactorModal'
import { RecoveryCodesAvailable } from './RecoveryCodesAvailable'
import { RecoveryCodesSetup } from './RecoveryCodesSetup'
import { getPrimarySecurityAction } from '@/components/interfaces/Account/Security/Security.utils'
import { AlertError } from '@/components/ui/AlertError'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { useMfaListFactorsQuery } from '@/data/profile/mfa-list-factors-query'
import { useRecoveryCodesStatusQuery } from '@/data/recovery-codes/recovery-codes-status-query'
import { useAccountRecovery } from '@/hooks/misc/useAccountRecovery'
import { DATETIME_FORMAT } from '@/lib/constants'

export const TOTPFactors = () => {
  const enableAuthRecoveryCodes = useFlag('enableAuthRecoveryCodes')

  const [isAddNewFactorOpen, setIsAddNewFactorOpen] = useState(false)
  const [factorToBeDeleted, setFactorToBeDeleted] = useState<string | null>(null)
  const [securityAction, setSecurityAction] = useQueryState('securityAction', parseAsString)

  const { data, isPending: isLoading, isError, isSuccess, error } = useMfaListFactorsQuery()
  const totpFactors = (data?.totp ?? []).filter((factor) => factor.status === 'verified')
  const verifiedFactors = (data?.all ?? []).filter(
    (factor) => factor.status === 'verified' && factor.factor_type !== 'recovery_code'
  )
  const hasVerifiedFactors = verifiedFactors.length > 0
  const canAddApp = isSuccess && totpFactors.length < 2
  const shouldVerifyRecoveryCodes = enableAuthRecoveryCodes && hasVerifiedFactors

  const recovery = useAccountRecovery()
  const findings = recovery.findings
  const primaryAction = getPrimarySecurityAction({
    findings: findings.filter((finding) => finding.action !== 'set-password'),
    isPending: recovery.isPending,
    isError: recovery.isError,
    canEnableMfa: recovery.isFactorsSuccess && recovery.verifiedFactorCount === 0,
  })

  const {
    data: recoveryCodesStatus,
    error: recoveryCodesError,
    isError: recoveryCodesIsError,
    isPending: recoveryCodesIsPending,
    isFetching: recoveryCodesIsFetching,
  } = useRecoveryCodesStatusQuery({
    enabled: shouldVerifyRecoveryCodes,
  })

  const { data: codes, status } = recoveryCodesStatus ?? {}
  const factorFinding = findings.find((finding) => finding.id === 'single-mfa-factor')
  const codeFinding = findings.find(
    (finding) => finding.action === 'generate-codes' || finding.action === 'regenerate-codes'
  )
  const isCodeActionPrimary =
    primaryAction === 'generate-codes' || primaryAction === 'regenerate-codes'

  const canShowRecoveryCodes = shouldVerifyRecoveryCodes && !recoveryCodesIsError

  const handleAddNewApp = () => setIsAddNewFactorOpen(true)

  const disableDeleteFactor =
    shouldVerifyRecoveryCodes &&
    (recoveryCodesIsPending || recoveryCodesIsFetching || recoveryCodesIsError)

  return (
    <>
      <PageSection id="mfa" className="scroll-mt-6">
        <PageSectionMeta>
          <PageSectionSummary>
            <PageSectionTitle>Multi-factor authentication</PageSectionTitle>
            <PageSectionDescription>
              Require an extra verification step when you sign in.
            </PageSectionDescription>
          </PageSectionSummary>
          {canAddApp && hasVerifiedFactors && (
            <PageSectionAside>
              <Button
                variant={
                  primaryAction === 'add-factor' || primaryAction === 'enable-mfa'
                    ? 'primary'
                    : 'default'
                }
                icon={<PlusIcon />}
                onClick={handleAddNewApp}
              >
                Add another method
              </Button>
            </PageSectionAside>
          )}
        </PageSectionMeta>
        <PageSectionContent className="flex flex-col gap-4">
          {isLoading && (
            <Card>
              <CardContent>
                <GenericSkeletonLoader />
              </CardContent>
            </Card>
          )}
          {isError && (
            <AlertError error={error} subject="Failed to retrieve account security information" />
          )}
          {isSuccess && !hasVerifiedFactors && (
            <EmptyStatePresentational
              icon={ShieldCheckIcon}
              title="Set up multi-factor authentication"
              description="Add an authenticator to require a second check when you sign in."
            >
              <Button
                variant={primaryAction === 'enable-mfa' ? 'primary' : 'default'}
                icon={<PlusIcon />}
                onClick={handleAddNewApp}
              >
                Set up MFA
              </Button>
            </EmptyStatePresentational>
          )}
          {factorFinding && (
            <Admonition
              type="warning"
              layout="responsive"
              title="Add a backup MFA method"
              description="Set up an authenticator app on another device so you can still sign in if you lose access to this one."
            />
          )}
          {isSuccess && totpFactors.length > 0 && (
            <Card>
              <div className="divide-y">
                {totpFactors.map((factor) => (
                  <CardContent key={factor.id} className="flex justify-between items-center py-4">
                    <div className="flex items-center gap-x-4">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-selection">
                        <LockKeyholeIcon size={18} className="text-foreground-lighter" />
                      </div>
                      <div>
                        <p className="text-sm">{factor.friendly_name ?? 'No name provided'}</p>
                        <p className="text-sm text-foreground-lighter">
                          Added on{' '}
                          <TimestampInfo
                            className="text-sm"
                            utcTimestamp={factor.created_at}
                            label={dayjs(factor.created_at).format(DATETIME_FORMAT)}
                          />
                        </p>
                      </div>
                    </div>
                    <ButtonTooltip
                      size="tiny"
                      icon={<TrashIcon size={14} />}
                      aria-label={`Remove MFA method: ${factor.friendly_name ?? 'unnamed'}`}
                      tooltip={{ content: { side: 'bottom', text: 'Remove MFA method' } }}
                      onClick={() => setFactorToBeDeleted(factor.id)}
                      disabled={disableDeleteFactor}
                    />
                  </CardContent>
                ))}
              </div>
            </Card>
          )}
        </PageSectionContent>
      </PageSection>

      {enableAuthRecoveryCodes && hasVerifiedFactors && !isError && (
        <PageSection id="recovery-codes" className="scroll-mt-6">
          <PageSectionMeta>
            <PageSectionSummary>
              <PageSectionTitle>Recovery codes</PageSectionTitle>
              <PageSectionDescription>
                Recover your account in case you lose access to your MFA methods.
              </PageSectionDescription>
            </PageSectionSummary>
          </PageSectionMeta>
          <PageSectionContent aria-live="polite" className="flex flex-col gap-4">
            {(isLoading || (shouldVerifyRecoveryCodes && recoveryCodesIsPending)) && (
              <GenericSkeletonLoader />
            )}
            {recoveryCodesIsError && (
              <AlertError subject="Failed to load recovery codes" error={recoveryCodesError} />
            )}
            {canShowRecoveryCodes && status === 'unenrolled' && (
              <RecoveryCodesSetup finding={codeFinding} isPrimary={isCodeActionPrimary} />
            )}
            {canShowRecoveryCodes && status === 'available' && codes && (
              <RecoveryCodesAvailable
                codes={codes}
                finding={codeFinding}
                isPrimary={isCodeActionPrimary}
              />
            )}
          </PageSectionContent>
        </PageSection>
      )}

      <AddNewFactorModal
        visible={isAddNewFactorOpen || (securityAction === 'add-factor' && canAddApp)}
        onClose={() => {
          setIsAddNewFactorOpen(false)
          if (securityAction === 'add-factor') void setSecurityAction(null)
        }}
      />
      <DeleteFactorModal
        visible={factorToBeDeleted !== null}
        factorId={factorToBeDeleted}
        lastFactorToBeDeleted={verifiedFactors.length === 1}
        onClose={() => setFactorToBeDeleted(null)}
        hasRecoveryCodes={status === 'available'}
      />
    </>
  )
}
