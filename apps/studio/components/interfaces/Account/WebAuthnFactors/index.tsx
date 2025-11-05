import dayjs from 'dayjs'
import { useState } from 'react'

import AlertError from 'components/ui/AlertError'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { DATETIME_FORMAT } from 'lib/constants'
import { Badge, Button, CardContent, CardFooter } from 'ui'
import { AddNewWebAuthnModal } from './AddNewWebAuthnModal'
import DeleteWebAuthnModal from './DeleteWebAuthnModal'
import { toast } from 'sonner'
import { useMfaWebAuthnChallengeAndVerifyMutation } from 'data/profile/mfa-webauthn-challenge-and-verify-mutation'
import type { AuthMFAListFactorsResponse } from '@supabase/auth-js'
import { Loader2 } from 'lucide-react'

export const WebAuthnFactors = ({
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

  const webauthnFactors = data?.all.filter((factor) => factor.factor_type === 'webauthn') ?? []

  const {
    mutate: mfaWebAuthnChallengeAndVerify,
    isLoading: isWebAuthnVerifying,
    isSuccess: isWebAuthnSuccess,
  } = useMfaWebAuthnChallengeAndVerifyMutation({
    onSuccess: () => {
      toast.success(`Successfully added a second factor authentication`)
    },
    onError: (error) => {
      toast.error(`Failed to verify factor: ${error?.message}`)
    },
  })

  const handleVerifyFactor = async (factorId: string) => {
    mfaWebAuthnChallengeAndVerify({
      factorId: factorId,
      webauthn: { rpId: window.location.hostname, rpOrigins: [window.location.origin] },
    })
  }

  return (
    <>
      <CardContent>
        <p className="text-sm text-foreground-lighter">
          Use hardware security keys like YubiKey for strong, phishing-resistant authentication as a
          second factor to verify your identity during sign-in.
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
                      {factor.status === 'unverified' && <Badge>Unverified</Badge>}
                    </p>
                    <div className="flex items-center gap-4">
                      <p className="text-sm text-foreground-light">
                        Added on {dayjs(factor.updated_at).format(DATETIME_FORMAT)}
                      </p>
                      <div className="flex items-center gap-1">
                        {factor.status === 'unverified' && (
                          <Button
                            size="tiny"
                            type="primary"
                            onClick={() => handleVerifyFactor(factor.id)}
                          >
                            {isWebAuthnVerifying ? <Loader2 className="animate-spin" /> : 'Verify'}
                          </Button>
                        )}
                        <Button
                          size="tiny"
                          type="default"
                          onClick={() => setFactorToBeDeleted(factor.id)}
                        >
                          Remove
                        </Button>
                      </div>
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
          <Button onClick={() => setIsAddNewWebAuthnOpen(true)}>Add new security key</Button>
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
