import dayjs from 'dayjs'
import { useState } from 'react'

import AlertError from 'components/ui/AlertError'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { DATETIME_FORMAT } from 'lib/constants'
import { Button, CardContent, CardFooter } from 'ui'
import { AddNewFactorModal } from './AddNewFactorModal'
import DeleteFactorModal from './DeleteFactorModal'
import type { AuthMFAListFactorsResponse } from '@supabase/auth-js'

export const TOTPFactors = ({
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
  const [isAddNewFactorOpen, setIsAddNewFactorOpen] = useState(false)
  const [factorToBeDeleted, setFactorToBeDeleted] = useState<string | null>(null)

  const totpFactors = data?.totp ?? []

  return (
    <>
      <CardContent>
        <p className="text-sm text-foreground-lighter">
          Generate one-time passwords via authenticator apps like 1Password, Authy, etc. as a second
          factor to verify your identity during sign-in.
        </p>
        <div>
          {isLoading && <GenericSkeletonLoader />}
          {isError && (
            <AlertError error={error} subject="Failed to retrieve account security information" />
          )}
          {isSuccess && (
            <div className="w-full">
              {totpFactors.map((factor) => {
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
      {totpFactors.length < 2 ? (
        <CardFooter className="justify-end w-full space-x-2">
          <Button onClick={() => setIsAddNewFactorOpen(true)}>Add new app</Button>
        </CardFooter>
      ) : null}
      <AddNewFactorModal
        visible={isAddNewFactorOpen}
        onClose={() => setIsAddNewFactorOpen(false)}
      />
      <DeleteFactorModal
        visible={factorToBeDeleted !== null}
        factorId={factorToBeDeleted}
        lastFactorToBeDeleted={data?.all.length === 1}
        onClose={() => setFactorToBeDeleted(null)}
      />
    </>
  )
}
