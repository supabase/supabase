import dayjs from 'dayjs'
import { AlertCircle } from 'lucide-react'
import { useState } from 'react'

import AlertError from 'components/ui/AlertError'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useMfaListFactorsQuery } from 'data/profile/mfa-list-factors-query'
import { DATETIME_FORMAT } from 'lib/constants'
import { AlertDescription_Shadcn_, AlertTitle_Shadcn_, Alert_Shadcn_, Button } from 'ui'
import { AddNewWebAuthnModal } from './AddNewWebAuthnModal'
import DeleteWebAuthnModal from './DeleteWebAuthnModal'

const WebAuthnFactors = () => {
  const [isAddNewWebAuthnOpen, setIsAddNewWebAuthnOpen] = useState(false)
  const [factorToBeDeleted, setFactorToBeDeleted] = useState<string | null>(null)
  const { data, isLoading, isError, isSuccess, error } = useMfaListFactorsQuery()

  return (
    <>
      <section className="space-y-3">
        <p className="text-sm text-foreground-light">
          Use hardware security keys like YubiKey for strong, phishing-resistant authentication as a
          second factor to verify your identity during sign-in.
        </p>
        <div>
          {isLoading && <GenericSkeletonLoader />}
          {isError && (
            <AlertError error={error} subject="Failed to retrieve account security information" />
          )}
          {isSuccess && (
            <>
              {(() => {
                const webauthnFactors = data.all.filter(
                  (factor) => factor.factor_type === 'webauthn'
                )
                return (
                  <>
                    {webauthnFactors.length === 1 && (
                      <Alert_Shadcn_ variant="default" className="mb-2">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle_Shadcn_>
                          We recommend configuring two security keys across different devices
                        </AlertTitle_Shadcn_>
                        <AlertDescription_Shadcn_ className="flex flex-col gap-3">
                          The two security keys will serve as a backup for each other.
                        </AlertDescription_Shadcn_>
                      </Alert_Shadcn_>
                    )}
                    <div>
                      {webauthnFactors.map((factor) => {
                        return (
                          <div key={factor.id} className="flex flex-row justify-between py-2">
                            <p className="text-sm text-foreground flex items-center space-x-2">
                              <span className="text-foreground-light">Name:</span>{' '}
                              <span>{factor.friendly_name ?? 'No name provided'}</span>
                            </p>
                            <div className="flex items-center gap-4">
                              <p className="text-sm text-foreground-light">
                                Added on {dayjs(factor.updated_at).format(DATETIME_FORMAT)}
                              </p>
                              <Button
                                size="tiny"
                                type="default"
                                onClick={() => setFactorToBeDeleted(factor.id)}
                              >
                                Remove
                              </Button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    {webauthnFactors.length < 2 ? (
                      <>
                        <div className="pt-2">
                          <Button onClick={() => setIsAddNewWebAuthnOpen(true)}>
                            Add new security key
                          </Button>
                        </div>
                      </>
                    ) : null}
                  </>
                )
              })()}
            </>
          )}
        </div>
      </section>
      <AddNewWebAuthnModal
        visible={isAddNewWebAuthnOpen}
        onClose={() => setIsAddNewWebAuthnOpen(false)}
      />
      <DeleteWebAuthnModal
        visible={factorToBeDeleted !== null}
        factorId={factorToBeDeleted}
        lastFactorToBeDeleted={
          data?.all.filter((factor) => factor.factor_type === 'webauthn').length === 1
        }
        onClose={() => setFactorToBeDeleted(null)}
      />
    </>
  )
}

export default WebAuthnFactors
