import { useFlag } from 'common'
import dayjs from 'dayjs'
import { Plus, RectangleEllipsis } from 'lucide-react'
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
import { DATETIME_FORMAT } from '@/lib/constants'

export const TOTPFactors = () => {
  const [isAddNewFactorOpen, setIsAddNewFactorOpen] = useState(false)
  const [factorToBeDeleted, setFactorToBeDeleted] = useState<string | null>(null)
  const { data, isPending: isLoading, isError, isSuccess, error } = useMfaListFactorsQuery()
  const enableAuthRecoveryCodes = useFlag('enableAuthRecoveryCodes')

  const totpFactors = data?.totp ?? []
  const canAddApp = isSuccess && totpFactors.length < 2
  const shouldShowLockoutWarning = isSuccess && totpFactors.length === 1
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

  const handleAddNewApp = () => setIsAddNewFactorOpen(true)

  // If recovery codes are enabled, we can't allow to remove an MFA until we know their status
  const disableDeleteFactor = shouldVerifyRecoveryCodes && recoveryCodesIsPending

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
              <Button variant="primary" icon={<Plus />} onClick={handleAddNewApp}>
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
                <Button icon={<Plus />} onClick={handleAddNewApp}>
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
              )}
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
                      <RectangleEllipsis size={18} className="text-foreground-lighter" />
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
        visible={factorToBeDeleted !== null}
        factorId={factorToBeDeleted}
        lastFactorToBeDeleted={totpFactors.length === 1}
        onClose={() => setFactorToBeDeleted(null)}
        hasRecoveryCodes={status === 'available'}
      />
    </>
  )
}
