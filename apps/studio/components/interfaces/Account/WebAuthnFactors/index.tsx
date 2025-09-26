import dayjs from 'dayjs'
import { useState } from 'react'

import AlertError from 'components/ui/AlertError'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { DATETIME_FORMAT } from 'lib/constants'
import { Button, CardContent, CardFooter } from 'ui'
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
      <CardContent>
        <p className="text-sm text-foreground-lighter">
          Use hardware webauthn factors like YubiKey for strong, phishing-resistant authentication
          as a second factor to verify your identity during sign-in.
        </p>
        <div>
          {isLoading && <GenericSkeletonLoader />}
          {isError && (
            <AlertError error={error} subject="Failed to retrieve account security information" />
          )}
          {isSuccess && (
            <div className="w-full">
              {webauthnFactors?.map((factor) => {
                return (
                  <div
                    key={factor.id}
                    className="first:mt-4 flex flex-row justify-between py-3 border-t"
                  >
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
          )}
        </div>
      </CardContent>
      {webauthnFactors.length < 2 ? (
        <CardFooter className="justify-end w-full space-x-2">
          <Button onClick={() => setIsAddNewWebAuthnOpen(true)}>Add new WebAuthn key</Button>
        </CardFooter>
      ) : null}
      <AddNewWebAuthnModal
        visible={isAddNewWebAuthnOpen}
        onClose={() => setIsAddNewWebAuthnOpen(false)}
      />
      <DeleteWebAuthnModal
        visible={factorToBeDeleted !== null}
        factorId={factorToBeDeleted}
        lastFactorToBeDeleted={data?.all.length === 1}
        onClose={() => setFactorToBeDeleted(null)}
      />
    </>
  )
}

export default WebAuthnFactors
