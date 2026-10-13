import { useFlag, useUser } from 'common'
import dayjs from 'dayjs'
import { MoreHorizontal, Plus, RectangleEllipsis, ShieldCheck } from 'lucide-react'
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
import { RegenerateRecoveryCodesModal } from './RegenerateRecoveryCodesModal'
import { UnenrollRecoveryCodesModal } from './UnenrollRecoveryCodesModal'
import { AlertError } from '@/components/ui/AlertError'
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
  const userId = useUser()?.id
  const {
    data,
    isPending: isLoading,
    isError,
    isSuccess,
    error,
  } = useMfaListFactorsQuery({ userId })
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
    userId,
  })
  const { data: codes, status } = recoveryCodesStatus ?? {}
  const factorFinding = findings.find((finding) => finding.id === 'single-mfa-factor')
  const codeFinding = findings.find(
    (finding) => finding.action === 'generate-codes' || finding.action === 'regenerate-codes'
  )
  const isCodeActionPrimary =
    primaryAction === 'generate-codes' || primaryAction === 'regenerate-codes'

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
          {isSuccess && totpFactors.length > 0 && (
            <Card>
              <div className="divide-y">
                {factorFinding && (
                  <CardContent>
                    <p className="text-sm text-foreground-lighter">
                      Add one on another device as a backup.
                    </p>
                  </CardContent>
                )}
                {totpFactors.map((factor) => (
                  <CardContent key={factor.id} className="flex justify-between items-center py-4">
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
                    <Button
                      size="tiny"
                      onClick={() => setFactorToBeDeleted(factor.id)}
                      disabled={disableDeleteFactor}
                    >
                      Delete
                    </Button>
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
              <p className="text-sm text-foreground-lighter">Set up MFA to use recovery codes.</p>
            )}
            {recoveryCodesIsError && (
              <AlertError subject="Failed to load recovery codes" error={recoveryCodesError} />
            )}
            {shouldVerifyRecoveryCodes && recoveryCodesIsPending && <GenericSkeletonLoader />}
            <GenerateRecoveryCodesModal>
              {({ onClick, isPending }) =>
                shouldVerifyRecoveryCodes && status === 'unenrolled' && !recoveryCodesIsError ? (
                  <Admonition
                    type={codeFinding ? 'warning' : 'default'}
                    layout="responsive"
                    title="No recovery codes"
                    description="Save recovery codes so you can sign in if you lose access to your authenticator."
                    actions={
                      <Button
                        variant={isCodeActionPrimary ? 'primary' : 'default'}
                        onClick={onClick}
                        loading={isPending}
                      >
                        Generate recovery codes
                      </Button>
                    }
                  />
                ) : null
              }
            </GenerateRecoveryCodesModal>
            <RegenerateRecoveryCodesModal>
              {({ onClick, isPending }) => {
                if (
                  !shouldVerifyRecoveryCodes ||
                  status !== 'available' ||
                  !codes ||
                  recoveryCodesIsError
                )
                  return null
                const action = (
                  <Button
                    variant={isCodeActionPrimary ? 'primary' : 'default'}
                    onClick={onClick}
                    loading={isPending}
                  >
                    Regenerate recovery codes
                  </Button>
                )
                if (codeFinding)
                  return (
                    <Admonition
                      type={codeFinding.severity === 'critical' ? 'destructive' : 'warning'}
                      layout="responsive"
                      title={
                        codeFinding.id === 'recovery-codes-exhausted'
                          ? 'Recovery codes used up'
                          : `${codes.remaining} of ${codes.total} recovery codes available`
                      }
                      description="Generate a new set before you need them to recover your account."
                      actions={action}
                    />
                  )
                return (
                  <Card>
                    <CardContent className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-x-4">
                        <RectangleEllipsis size={18} className="text-foreground-lighter" />
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
                )
              }}
            </RegenerateRecoveryCodesModal>
            <UnenrollRecoveryCodesModal>
              {({ onClick }) =>
                shouldVerifyRecoveryCodes && status === 'available' && !recoveryCodesIsError ? (
                  <div className="flex justify-end">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="default"
                          size="tiny"
                          icon={<MoreHorizontal />}
                          aria-label="Recovery code options"
                        />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={onClick}>
                          Remove recovery codes
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ) : null
              }
            </UnenrollRecoveryCodesModal>
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
        canUseRecoveryCodes={
          enableAuthRecoveryCodes && status === 'available' && !!codes && codes.remaining > 0
        }
      />
    </>
  )
}
