import dayjs from 'dayjs'
import { useState } from 'react'

import AlertError from 'components/ui/AlertError'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { DATETIME_FORMAT } from 'lib/constants'
import { Button } from 'ui'
import { AddNewWebAuthnModal } from './AddNewWebAuthnModal'
import DeleteWebAuthnModal from './DeleteWebAuthnModal'
import type { AuthMFAListFactorsResponse } from '@supabase/auth-js'

const WebAuthnFactors = ({
  data,
  isLoading,
  isError,
  isSuccess,
  error,
}: {
  data?: AuthMFAListFactorsResponse['data']
  isLoading: boolean
  isError: boolean
  isSuccess: boolean
  error: AuthMFAListFactorsResponse['error']
}) => {
  const [isAddNewWebAuthnOpen, setIsAddNewWebAuthnOpen] = useState(false)
  const [factorToBeDeleted, setFactorToBeDeleted] = useState<string | null>(null)

  const webauthnFactors = data?.webauthn ?? []

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
              <div>
                {webauthnFactors?.map((factor) => {
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
