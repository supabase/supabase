import { useFlag } from 'common'
import dayjs from 'dayjs'
import { Plus } from 'lucide-react'
import { useState } from 'react'
import { Button, Card, CardContent } from 'ui'
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

import { AddNewFactorModal } from './AddNewFactorModal'
import DeleteFactorModal from './DeleteFactorModal'
import { GenerateRecoveryCodesModal } from './GenerateRecoveryCodesModal'
import { RegenerateRecoveryCodesModal } from './RegenerateRecoveryCodesModal'
import { UnenrollRecoveryCodesModal } from './UnenrollRecoveryCodesModal'
import { AlertError } from '@/components/ui/AlertError'
import { useMfaListFactorsQuery } from '@/data/profile/mfa-list-factors-query'
import { useRecoveryCodesStatusQuery } from '@/data/recovery-codes/recovery-codes-status-query'
import { DATETIME_FORMAT, IS_STAGING_OR_LOCAL } from '@/lib/constants'

export const TOTPFactors = () => {
  const [isAddNewFactorOpen, setIsAddNewFactorOpen] = useState(false)
  const [factorToBeDeleted, setFactorToBeDeleted] = useState<string | null>(null)
  const { data, isPending: isLoading, isError, isSuccess, error } = useMfaListFactorsQuery()
  const enableAuthRecoveryCodes = useFlag('enableAuthRecoveryCodes')

  const totpFactors = data?.totp ?? []
  const canAddApp = isSuccess && totpFactors.length < 2
  const shouldShowLockoutWarning = isSuccess && totpFactors.length === 1
  const shouldVerifyRecoveryCodes = enableAuthRecoveryCodes && totpFactors.length === 1

  const { data: recoveryCodesStatus } = useRecoveryCodesStatusQuery({
    enabled: shouldVerifyRecoveryCodes,
  })

  const handleAddNewApp = () => setIsAddNewFactorOpen(true)

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
          {recoveryCodesStatus?.status === 'unenrolled' && <GenerateRecoveryCodesModal />}
          {recoveryCodesStatus?.status === 'available' && (
            <Admonition
              layout="responsive"
              title={`${recoveryCodesStatus?.data?.remaining}/${recoveryCodesStatus?.data?.total} recovery codes available`}
              description="Recovery codes allow you to recover your account in case you lost access to your MFA apps."
              actions={
                <div className="flex flex-col gap-2">
                  <RegenerateRecoveryCodesModal />
                  {IS_STAGING_OR_LOCAL && <UnenrollRecoveryCodesModal />}
                </div>
              }
            />
          )}
          {shouldShowLockoutWarning && (
            <Admonition
              type="danger"
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
                          Added on {dayjs(factor.created_at).format(DATETIME_FORMAT)}
                        </p>
                      </div>
                      <Button size="tiny" onClick={() => setFactorToBeDeleted(factor.id)}>
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
      <AddNewFactorModal
        visible={isAddNewFactorOpen}
        onClose={() => setIsAddNewFactorOpen(false)}
      />
      <DeleteFactorModal
        visible={factorToBeDeleted !== null}
        factorId={factorToBeDeleted}
        lastFactorToBeDeleted={totpFactors.length === 1}
        onClose={() => setFactorToBeDeleted(null)}
      />
    </>
  )
}
