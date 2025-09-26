import dayjs from 'dayjs'
import { useState } from 'react'

import AlertError from 'components/ui/AlertError'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { DATETIME_FORMAT } from 'lib/constants'
import { Button } from 'ui'
import { AddNewFactorModal } from './AddNewFactorModal'
import DeleteFactorModal from './DeleteFactorModal'
import type { AuthMFAListFactorsResponse } from '@supabase/auth-js'

const TOTPFactors = ({
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
      <section className="space-y-3">
        <p className="text-sm text-foreground-light">
          Generate one-time passwords via authenticator apps like 1Password, Authy, etc. as a second
          factor to verify your identity during sign-in.
        </p>
        <div>
          {isLoading && <GenericSkeletonLoader />}
          {isError && (
            <AlertError error={error} subject="Failed to retrieve account security information" />
          )}
          {isSuccess && (
            <>
              <div>
                {totpFactors.map((factor) => {
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
              {totpFactors.length && totpFactors.length < 2 ? (
                <div className="pt-2">
                  <Button onClick={() => setIsAddNewFactorOpen(true)}>Add new app</Button>
                </div>
              ) : null}
            </>
          )}
        </div>
      </section>
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

export default TOTPFactors
