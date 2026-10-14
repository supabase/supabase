import { useFlag, useUser } from 'common'
import dayjs from 'dayjs'
import {
  ChevronDown,
  LockKeyhole,
  Plus,
  RectangleEllipsis,
  RefreshCw,
  ShieldCheck,
  Trash,
} from 'lucide-react'
import { parseAsString, useQueryState } from 'nuqs'
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
import {
  PreviewAuthenticatorDialog,
  PreviewGenerateRecoveryCodesFlow,
  PreviewRecoveryCodesFlow,
  PreviewRemoveRecoveryCodesModal,
} from './PreviewRecoveryCodesFlow'
import type { RecoveryCodesPreview } from './RecoveryCodesPreview.utils'
import { RegenerateRecoveryCodesModal } from './RegenerateRecoveryCodesModal'
import { UnenrollRecoveryCodesModal } from './UnenrollRecoveryCodesModal'
import { AlertError } from '@/components/ui/AlertError'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { useMfaListFactorsQuery } from '@/data/profile/mfa-list-factors-query'
import { useRecoveryCodesStatusQuery } from '@/data/recovery-codes/recovery-codes-status-query'
import type { AccountRecoveryFinding } from '@/lib/account-recovery/evaluate-account-recovery'
import { DATETIME_FORMAT } from '@/lib/constants'

type TOTPFactorsProps = {
  previewRemaining?: RecoveryCodesPreview
  findings: AccountRecoveryFinding[]
  primaryAction: AccountRecoveryFinding['action'] | 'enable-mfa' | undefined
}

export const TOTPFactors = ({ findings, primaryAction, previewRemaining }: TOTPFactorsProps) => {
  const [isAddNewFactorOpen, setIsAddNewFactorOpen] = useState(false)
  const [securityAction, setSecurityAction] = useQueryState('securityAction', parseAsString)
  const [factorToBeDeleted, setFactorToBeDeleted] = useState<string | null>(null)
  const userId = useUser()?.id
  const isPreview = previewRemaining !== undefined
  const {
    data: queriedData,
    isPending: queryIsLoading,
    isError: queryIsError,
    isSuccess: queryIsSuccess,
    error,
  } = useMfaListFactorsQuery({ userId: isPreview ? 'local-preview' : userId, enabled: !isPreview })
  const previewFactorCount = previewRemaining === 'backup' ? 2 : 1
  const previewHasCodes = previewRemaining !== 'missing' && previewRemaining !== 'mfa-off'
  const previewCodeCount = typeof previewRemaining === 'number' ? previewRemaining : 10
  const previewCodesStatus = previewHasCodes
    ? { status: 'available' as const, data: { remaining: previewCodeCount, total: 10 } }
    : { status: 'unenrolled' as const, data: undefined }
  const data = isPreview
    ? {
        totp:
          previewRemaining === 'mfa-off'
            ? []
            : Array.from({ length: previewFactorCount }, (_, index) => ({
                id: `preview-factor-${index}`,
                friendly_name: index === 0 ? 'Preview authenticator' : 'Backup authenticator',
                status: 'verified',
                created_at: '2026-10-01T00:00:00Z',
              })),
      }
    : queriedData
  const isLoading = !isPreview && queryIsLoading
  const isError = !isPreview && queryIsError
  const isSuccess = isPreview || queryIsSuccess
  const isRecoveryCodesFlagEnabled = useFlag('enableAuthRecoveryCodes')
  const enableAuthRecoveryCodes = isPreview || isRecoveryCodesFlagEnabled

  const totpFactors = (data?.totp ?? []).filter((factor) => factor.status === 'verified')
  const canAddApp = isSuccess && totpFactors.length < 2
  const shouldVerifyRecoveryCodes = enableAuthRecoveryCodes && totpFactors.length > 0

  const {
    data: queriedCodesStatus,
    error: recoveryCodesError,
    isError: queriedCodesIsError,
    isPending: queriedCodesIsPending,
  } = useRecoveryCodesStatusQuery({
    enabled: shouldVerifyRecoveryCodes && !isPreview,
    userId: isPreview ? 'local-preview' : userId,
  })
  const recoveryCodesStatus = isPreview ? previewCodesStatus : queriedCodesStatus
  const recoveryCodesIsError = !isPreview && queriedCodesIsError
  const recoveryCodesIsPending = !isPreview && queriedCodesIsPending
  const { data: codes, status } = recoveryCodesStatus ?? {}
  const factorFinding = findings.find((finding) => finding.id === 'single-mfa-factor')
  const codeFinding = findings.find(
    (finding) => finding.action === 'generate-codes' || finding.action === 'regenerate-codes'
  )
  const isCodeActionPrimary =
    primaryAction === 'generate-codes' || primaryAction === 'regenerate-codes'

  const GenerateFlow = isPreview ? PreviewGenerateRecoveryCodesFlow : GenerateRecoveryCodesModal
  const RegenerateFlow = isPreview ? PreviewRecoveryCodesFlow : RegenerateRecoveryCodesModal
  const RemoveCodesFlow = isPreview ? PreviewRemoveRecoveryCodesModal : UnenrollRecoveryCodesModal

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
                icon={<Plus />}
                onClick={handleAddNewApp}
              >
                {totpFactors.length === 0 ? 'Set up MFA' : 'Add authenticator'}
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
              icon={ShieldCheck}
              title="Set up multi-factor authentication"
              description="Add an authenticator to require a second check when you sign in."
            >
              <Button
                variant={primaryAction === 'enable-mfa' ? 'primary' : 'default'}
                icon={<Plus />}
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
                        <LockKeyhole size={18} className="text-foreground-lighter" />
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
                      icon={<Trash size={14} />}
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

      {enableAuthRecoveryCodes && (
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
            {isLoading && <GenericSkeletonLoader />}
            {isError && (
              <p className="text-sm text-foreground-lighter">
                Recovery code status is unavailable until your MFA methods can be checked.
              </p>
            )}
            {isSuccess && totpFactors.length === 0 && (
              <EmptyStatePresentational
                icon={RectangleEllipsis}
                title="Set up recovery codes"
                description="Enable multi-factor authentication first, then generate codes to recover access if you lose your authenticator."
              >
                <Button variant="default" icon={<Plus />} onClick={handleAddNewApp}>
                  Set up MFA first
                </Button>
              </EmptyStatePresentational>
            )}
            {recoveryCodesIsError && (
              <AlertError subject="Failed to load recovery codes" error={recoveryCodesError} />
            )}
            {shouldVerifyRecoveryCodes && recoveryCodesIsPending && <GenericSkeletonLoader />}
            <GenerateFlow>
              {({ onClick, isPending }) =>
                shouldVerifyRecoveryCodes && status === 'unenrolled' && !recoveryCodesIsError ? (
                  <>
                    {codeFinding && (
                      <Admonition
                        type="warning"
                        title="No recovery codes"
                        description="Save recovery codes so you can sign in if you lose access to your authenticator."
                      />
                    )}
                    <EmptyStatePresentational
                      icon={RectangleEllipsis}
                      title="Set up recovery codes"
                      description="Save a backup way to sign in if you lose your authenticator."
                    >
                      <Button
                        variant={isCodeActionPrimary ? 'primary' : 'default'}
                        onClick={onClick}
                        loading={isPending}
                      >
                        Generate recovery codes
                      </Button>
                    </EmptyStatePresentational>
                  </>
                ) : null
              }
            </GenerateFlow>
            <RemoveCodesFlow>
              {({ onClick: onRemove }) => (
                <RegenerateFlow>
                  {({ onClick, isPending }) => {
                    if (
                      !shouldVerifyRecoveryCodes ||
                      status !== 'available' ||
                      !codes ||
                      recoveryCodesIsError
                    )
                      return null
                    const action = (
                      <div className="flex w-fit">
                        <Button
                          variant={isCodeActionPrimary ? 'primary' : 'default'}
                          className="flex-1 @lg:flex-none rounded-r-none hover:z-10 focus-visible:z-10 focus-visible:rounded-r-sm"
                          icon={<RefreshCw />}
                          onClick={onClick}
                          loading={isPending}
                        >
                          Regenerate
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant={isCodeActionPrimary ? 'primary' : 'default'}
                              aria-label="Recovery code options"
                              className="shrink-0 rounded-l-none px-1 py-1.25 -ml-px focus-visible:z-10 focus-visible:rounded-l-sm"
                              icon={<ChevronDown />}
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
                        {codeFinding && (
                          <Admonition
                            type={codeFinding.severity === 'critical' ? 'destructive' : 'warning'}
                            title={
                              codeFinding.id === 'recovery-codes-exhausted'
                                ? 'Recovery codes used up'
                                : `${codes.remaining} recovery ${codes.remaining === 1 ? 'code' : 'codes'} remaining`
                            }
                            description={
                              codeFinding.id === 'recovery-codes-exhausted'
                                ? 'Generate a new set so you have a backup way to sign in.'
                                : 'Generate a new set before you need them to recover your account.'
                            }
                          />
                        )}
                        <Card>
                          <CardContent className="flex flex-wrap items-center justify-between gap-4">
                            <div className="flex items-center gap-x-4">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-selection">
                                <RectangleEllipsis size={18} className="text-foreground-lighter" />
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
                  }}
                </RegenerateFlow>
              )}
            </RemoveCodesFlow>
          </PageSectionContent>
        </PageSection>
      )}

      {isPreview && (
        <>
          <PreviewAuthenticatorDialog
            visible={isAddNewFactorOpen}
            onClose={() => setIsAddNewFactorOpen(false)}
          />
          <PreviewAuthenticatorDialog
            visible={factorToBeDeleted !== null}
            isRemoval
            onClose={() => setFactorToBeDeleted(null)}
          />
        </>
      )}
      {!isPreview && (
        <AddNewFactorModal
          visible={isAddNewFactorOpen || (securityAction === 'add-factor' && canAddApp)}
          onClose={() => {
            setIsAddNewFactorOpen(false)
            if (securityAction === 'add-factor') void setSecurityAction(null)
          }}
        />
      )}

      {!isPreview && (
        <DeleteFactorModal
          visible={factorToBeDeleted !== null}
          factorId={factorToBeDeleted}
          lastFactorToBeDeleted={totpFactors.length === 1}
          onClose={() => setFactorToBeDeleted(null)}
          hasRecoveryCodes={status === 'available'}
          canUseRecoveryCodes={
            enableAuthRecoveryCodes && status === 'available' && !!codes && codes.remaining > 0
          }
        />
      )}
    </>
  )
}
