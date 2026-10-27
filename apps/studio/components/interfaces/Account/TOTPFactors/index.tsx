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
import { GenericSkeletonLoader, ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'
import { TimestampInfo } from 'ui-patterns/TimestampInfo'

import { AddNewFactorModal } from './AddNewFactorModal'
import { DeleteFactorModal } from './DeleteFactorModal'
import { useGenerateRecoveryCodesModal } from './GenerateRecoveryCodesModal'
import { RecoveryCodesAvailable } from './RecoveryCodesAvailable'
import { RecoveryCodesSetup } from './RecoveryCodesSetup'
import { useRegenerateRecoveryCodesModal } from './RegenerateRecoveryCodesModal'
import { useRecoveryCodesGate } from './useRecoveryCodesGate'
import { getPrimarySecurityAction } from '@/components/interfaces/Account/Security/Security.utils'
import { AlertError } from '@/components/ui/AlertError'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { useMfaListFactorsQuery } from '@/data/profile/mfa-list-factors-query'
import { useAccountRecovery } from '@/hooks/misc/useAccountRecovery'
import { DATETIME_FORMAT } from '@/lib/constants'

export const TOTPFactors = () => {
  const [isCheckingIdentity, setIsCheckingIdentity] = useState(false)
  const [isAddNewFactorOpen, setIsAddNewFactorOpen] = useState(false)
  const [resumeFactorId, setResumeFactorId] = useQueryState('removeAuthenticator', parseAsString)
  const [selectedFactorId, setSelectedFactorId] = useState<string | null | undefined>(undefined)
  const factorToBeDeleted = selectedFactorId === undefined ? resumeFactorId : selectedFactorId
  const [securityAction, setSecurityAction] = useQueryState('securityAction', parseAsString)

  const { data, isPending: isLoading, isError, isSuccess, error } = useMfaListFactorsQuery()
  const totpFactors = (data?.totp ?? []).filter((factor) => factor.status === 'verified')
  const verifiedFactors = (data?.all ?? []).filter(
    (factor) => factor.status === 'verified' && factor.factor_type !== 'recovery_code'
  )
  const hasVerifiedFactors = verifiedFactors.length > 0
  const canAddApp = isSuccess && totpFactors.length < 2

  const recovery = useAccountRecovery()
  const findings = recovery.findings
  const primaryAction = getPrimarySecurityAction({
    findings: findings.filter((finding) => finding.action !== 'set-password'),
    isPending: recovery.isPending,
    isError: recovery.isError,
    canEnableMfa: recovery.isFactorsSuccess && recovery.verifiedFactorCount === 0,
  })

  const recoveryCodes = useRecoveryCodesGate({ enabled: hasVerifiedFactors })
  const { codes, status } = recoveryCodes
  const disableDeleteFactor = !recoveryCodes.canRemoveFactor
  const factorIdToDelete = totpFactors.find((factor) => factor.id === factorToBeDeleted)?.id ?? null
  const isDeleteFactorModalVisible = factorIdToDelete !== null
  const factorFinding = findings.find((finding) => finding.id === 'single-mfa-factor')
  const codeFinding = findings.find(
    (finding) => finding.action === 'generate-codes' || finding.action === 'regenerate-codes'
  )
  const isCodeActionPrimary =
    primaryAction === 'generate-codes' || primaryAction === 'regenerate-codes'

  const codeActionVariant = isCodeActionPrimary ? 'primary' : 'default'
  const generateCodes = useGenerateRecoveryCodesModal({ variant: codeActionVariant })
  const regenerateCodes = useRegenerateRecoveryCodesModal({ variant: codeActionVariant })

  const canShowRecoveryCodes = recoveryCodes.isActive && !recoveryCodes.isError

  const handleAddNewApp = () => setIsAddNewFactorOpen(true)
  const deleteFactorTooltip = recoveryCodes.isError
    ? 'Cannot delete authenticator: recovery code status unavailable'
    : 'Checking recovery code status before deletion'

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
                Add MFA method
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
                      tooltip={{
                        content: {
                          side: 'bottom',
                          text: disableDeleteFactor ? deleteFactorTooltip : 'Remove MFA method',
                        },
                      }}
                      onClick={() => setSelectedFactorId(factor.id)}
                      loading={isCheckingIdentity && factorToBeDeleted === factor.id}
                      disabled={disableDeleteFactor || isCheckingIdentity}
                    />
                  </CardContent>
                ))}
              </div>
            </Card>
          )}
        </PageSectionContent>
      </PageSection>

      {recoveryCodes.isActive && !isError && (
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
            {recoveryCodes.isPending && (
              <Card>
                <CardContent role="status" className="flex items-center gap-4">
                  <span className="sr-only">Checking recovery codes</span>
                  <ShimmeringLoader className="size-9 shrink-0 rounded-full py-0" />
                  <div className="flex flex-1 flex-col gap-2 py-1">
                    <ShimmeringLoader className="h-3 w-48 py-0" />
                    <ShimmeringLoader className="h-3 w-40 py-0" />
                  </div>
                  <ShimmeringLoader className="h-7 w-24 py-0" />
                </CardContent>
              </Card>
            )}
            {!recoveryCodes.isPending && recoveryCodes.isFetching && (
              <p role="status" className="text-sm text-foreground-light">
                Checking recovery codes…
              </p>
            )}
            {recoveryCodes.isError && (
              <AlertError
                subject="Failed to load recovery codes"
                error={recoveryCodes.error}
                showInstructions={false}
                additionalActions={
                  <Button
                    loading={recoveryCodes.isFetching}
                    onClick={() => void recoveryCodes.refetch()}
                  >
                    Retry
                  </Button>
                }
              />
            )}
            {canShowRecoveryCodes && status === 'unenrolled' && (
              <RecoveryCodesSetup>{generateCodes.trigger}</RecoveryCodesSetup>
            )}
            {canShowRecoveryCodes && status === 'available' && codes && (
              <RecoveryCodesAvailable codes={codes} finding={codeFinding}>
                {regenerateCodes.trigger}
              </RecoveryCodesAvailable>
            )}
          </PageSectionContent>
        </PageSection>
      )}

      {/* Keep open dialogs mounted when a status refresh replaces their triggers. */}
      {generateCodes.dialog}
      {regenerateCodes.dialog}
      <AddNewFactorModal
        visible={isAddNewFactorOpen || (securityAction === 'add-factor' && canAddApp)}
        onClose={() => {
          setIsAddNewFactorOpen(false)
          if (securityAction === 'add-factor') void setSecurityAction(null)
        }}
      />
      <DeleteFactorModal
        onCheckingIdentity={setIsCheckingIdentity}
        visible={isDeleteFactorModalVisible}
        factorId={factorIdToDelete}
        onClose={() => {
          setSelectedFactorId(null)
          void setResumeFactorId(null)
        }}
      />
    </>
  )
}
