import { useFlag } from 'common'
import dayjs from 'dayjs'
import {
  LockKeyholeIcon,
  PlusIcon,
  RectangleEllipsisIcon,
  ShieldCheckIcon,
  TrashIcon,
} from 'lucide-react'
import { parseAsString, useQueryState } from 'nuqs'
import { useState } from 'react'
import { Button, Card, CardContent, cn } from 'ui'
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
import { GenerateRecoveryCodesModal } from './GenerateRecoveryCodesModal'
import { RegenerateRecoveryCodesModal } from './RegenerateRecoveryCodesModal'
import { UnenrollRecoveryCodesModal } from './UnenrollRecoveryCodesModal'
import { AlertError } from '@/components/ui/AlertError'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { useMfaListFactorsQuery } from '@/data/profile/mfa-list-factors-query'
import { useRecoveryCodesStatusQuery } from '@/data/recovery-codes/recovery-codes-status-query'
import type { AccountRecoveryFinding } from '@/lib/account-recovery/evaluate-account-recovery'
import { DATETIME_FORMAT } from '@/lib/constants'

type TOTPFactorsProps = {
  findings: AccountRecoveryFinding[]
  primaryAction: AccountRecoveryFinding['action'] | 'enable-mfa' | undefined
}

export const TOTPFactors = ({ findings, primaryAction }: TOTPFactorsProps) => {
  const [isAddNewFactorOpen, setIsAddNewFactorOpen] = useState(false)
  const [securityAction, setSecurityAction] = useQueryState('securityAction', parseAsString)
  const [factorToBeDeleted, setFactorToBeDeleted] = useState<string | null>(null)
  const { data, isPending: isLoading, isError, isSuccess, error } = useMfaListFactorsQuery()
  const enableAuthRecoveryCodes = useFlag('enableAuthRecoveryCodes')

  const totpFactors = (data?.totp ?? []).filter((factor) => factor.status === 'verified')
  const canAddApp = isSuccess && totpFactors.length < 2
  const shouldVerifyRecoveryCodes = enableAuthRecoveryCodes && totpFactors.length > 0

  const {
    data: recoveryCodesStatus,
    error: recoveryCodesError,
    isError: recoveryCodesIsError,
    isPending: recoveryCodesIsPending,
  } = useRecoveryCodesStatusQuery({
    enabled: shouldVerifyRecoveryCodes,
  })
  const { data: codes, status } = recoveryCodesStatus ?? {}
  const factorFinding = findings.find((finding) => finding.id === 'single-mfa-factor')
  const handleAddNewApp = () => setIsAddNewFactorOpen(true)

  const disableDeleteFactor =
    shouldVerifyRecoveryCodes && (recoveryCodesIsPending || recoveryCodesIsError)

  return (
    <>
      <PageSection id="mfa" className="scroll-mt-6">
        <PageSectionMeta>
          <PageSectionSummary>
            <PageSectionTitle>Multi-factor authentication</PageSectionTitle>
            <PageSectionDescription>
              Use a multi-factor authentication app (like Google Authenticator or 1Password) to
              protect your account.
            </PageSectionDescription>
          </PageSectionSummary>
          {canAddApp && totpFactors.length > 0 && (
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
                Add authenticator
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
          {isSuccess && totpFactors.length === 0 && (
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
              title="Add a backup authenticator"
              description="Add an authenticator on another device so you can still sign in if you lose access to this one."
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
                      aria-label={`Remove ${factor.friendly_name ?? 'unnamed'} authenticator`}
                      tooltip={{ content: { side: 'top', text: 'Remove authenticator' } }}
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

      {shouldVerifyRecoveryCodes && (
        <PageSection>
          <PageSectionMeta>
            <PageSectionSummary>
              <PageSectionTitle>Recovery codes</PageSectionTitle>
              <PageSectionDescription>
                Recovery codes allow you to recover your account in case you lost access to your MFA
                apps.
              </PageSectionDescription>
            </PageSectionSummary>
          </PageSectionMeta>
          <PageSectionContent aria-live="polite">
            {recoveryCodesIsError && (
              <AlertError subject="Failed to load recovery codes" error={recoveryCodesError} />
            )}
            {status === 'unenrolled' && <GenerateRecoveryCodesModal />}
            {status === 'available' && codes && (
              <Card>
                <CardContent className="flex items-center justify-between">
                  <div className="flex items-center gap-x-4">
                    <div className="w-9 h-9 rounded-full bg-selection flex items-center justify-center">
                      <RectangleEllipsisIcon size={18} className="text-foreground-lighter" />
                    </div>
                    <div className="text-sm">
                      <p className={cn(codes.remaining < 2 ? 'text-warning' : '')}>
                        {codes.remaining}/{codes.total} recovery codes available
                      </p>
                      <p className="text-foreground-lighter">Each code can only be used once</p>
                    </div>
                  </div>

                  <div className="flex gap-2 ml-auto">
                    <RegenerateRecoveryCodesModal />
                    <UnenrollRecoveryCodesModal />
                  </div>
                </CardContent>
              </Card>
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
        lastFactorToBeDeleted={totpFactors.length === 1}
        onClose={() => setFactorToBeDeleted(null)}
        hasRecoveryCodes={status === 'available'}
      />
    </>
  )
}
