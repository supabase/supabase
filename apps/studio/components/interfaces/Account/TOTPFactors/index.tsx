import dayjs from 'dayjs'
import { PlusIcon, RectangleEllipsisIcon } from 'lucide-react'
import { parseAsString, useQueryState } from 'nuqs'
import { useState } from 'react'
import { Button, Card, CardContent, cn } from 'ui'
import { Admonition } from 'ui-patterns/Admonition'
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
import { GenerateRecoveryCodesModal } from './GenerateRecoveryCodesModal'
import { RegenerateRecoveryCodesModal } from './RegenerateRecoveryCodesModal'
import { UnenrollRecoveryCodesModal } from './UnenrollRecoveryCodesModal'
import { useRecoveryCodesGate } from './useRecoveryCodesGate'
import { AlertError } from '@/components/ui/AlertError'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { useMfaListFactorsQuery } from '@/data/profile/mfa-list-factors-query'
import { DATETIME_FORMAT } from '@/lib/constants'

export const TOTPFactors = () => {
  const [isCheckingIdentity, setIsCheckingIdentity] = useState(false)
  const [isAddNewFactorOpen, setIsAddNewFactorOpen] = useState(false)
  const [resumeFactorId, setResumeFactorId] = useQueryState('removeAuthenticator', parseAsString)
  const [selectedFactorId, setSelectedFactorId] = useState<string | null | undefined>(undefined)
  const factorToBeDeleted = selectedFactorId === undefined ? resumeFactorId : selectedFactorId
  const { data, isPending: isLoading, isError, isSuccess, error } = useMfaListFactorsQuery()

  const totpFactors = (data?.totp ?? []).filter((factor) => factor.status === 'verified')
  const canAddApp = isSuccess && totpFactors.length < 2
  const shouldShowLockoutWarning = isSuccess && totpFactors.length === 1

  const recoveryCodes = useRecoveryCodesGate({ enabled: totpFactors.length > 0 })
  const { codes, status } = recoveryCodes
  const disableDeleteFactor = !recoveryCodes.canRemoveFactor

  const factorIdToDelete =
    totpFactors.find((factor) => factor.id === factorToBeDeleted)?.id ?? null
  const isDeleteFactorModalVisible = factorIdToDelete !== null

  const handleAddNewApp = () => setIsAddNewFactorOpen(true)

  const deleteFactorTooltip = recoveryCodes.isError
    ? 'Cannot delete authenticator: recovery code status unavailable'
    : 'Checking recovery code status before deletion'

  return (
    <>
      <PageSection>
        <PageSectionMeta>
          <PageSectionSummary>
            <PageSectionTitle>Multi-factor authentication</PageSectionTitle>
            <PageSectionDescription>
              Use an authenticator app (like Google Authenticator or 1Password) to protect your
              account.
            </PageSectionDescription>
          </PageSectionSummary>
          {canAddApp && (
            <PageSectionAside>
              <Button variant="primary" icon={<PlusIcon />} onClick={handleAddNewApp}>
                Add app
              </Button>
            </PageSectionAside>
          )}
        </PageSectionMeta>
        <PageSectionContent className="flex flex-col gap-4">
          {shouldShowLockoutWarning && (
            <Admonition
              type="warning"
              layout="responsive"
              title="Avoid being locked out"
              description="Add a backup authenticator app now. Losing access to your only app will permanently lock you out of your account."
              actions={
                <Button icon={<PlusIcon />} onClick={handleAddNewApp}>
                  Add another app
                </Button>
              }
            />
          )}
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
          {isSuccess && (
            <Card>
              {totpFactors.length === 0 ? (
                <CardContent>
                  <p className="text-sm text-foreground-lighter">No authenticator apps yet.</p>
                </CardContent>
              ) : (
                <div className="divide-y">
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
                      <ButtonTooltip
                        size="tiny"
                        onClick={() => setSelectedFactorId(factor.id)}
                        loading={isCheckingIdentity && factorToBeDeleted === factor.id}
                        disabled={disableDeleteFactor || isCheckingIdentity}
                        tooltip={{
                          content: {
                            side: 'top',
                            text: disableDeleteFactor ? deleteFactorTooltip : undefined,
                          },
                        }}
                      >
                        Delete
                      </ButtonTooltip>
                    </CardContent>
                  ))}
                </div>
              )}
            </Card>
          )}
        </PageSectionContent>
      </PageSection>

      {recoveryCodes.isActive && (
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
        visible={isAddNewFactorOpen}
        onClose={() => setIsAddNewFactorOpen(false)}
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
