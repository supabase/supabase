import dayjs from 'dayjs'
import { useState } from 'react'
import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Button,
  IconAlertCircle,
  IconTrash,
} from 'ui'

import AlertError from 'components/ui/AlertError'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useMfaListFactorsQuery } from 'data/profile/mfa-list-factors-query'
import { DATETIME_FORMAT } from 'lib/constants'
import AddNewFactorModal from './AddNewFactorModal'
import DeleteFactorModal from './DeleteFactorModal'

const TOTPFactors = () => {
  const [isAddNewFactorOpen, setIsAddNewFactorOpen] = useState(false)
  const [factorToBeDeleted, setFactorToBeDeleted] = useState<string | null>(null)
  const { data, isLoading, isError, isSuccess, error } = useMfaListFactorsQuery()

  return (
    <>
      <section className="space-y-3">
        <p className="text-sm text-light">
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
              {data.totp.length === 1 && (
                <Alert_Shadcn_ variant="default" className="mb-2">
                  <IconAlertCircle className="h-4 w-4" />
                  <AlertTitle_Shadcn_>
                    We recommend configuring two authenticator apps across different devices
                  </AlertTitle_Shadcn_>
                  <AlertDescription_Shadcn_ className="flex flex-col gap-3">
                    The two authenticator apps will serve as a backup for each other.
                  </AlertDescription_Shadcn_>
                </Alert_Shadcn_>
              )}
              <div>
                {data.totp.map((factor) => {
                  return (
                    <div key={factor.id} className="flex flex-row justify-between py-2">
                      <div className="flex flex-col space-y-0.5">
                        <span className="text-sm text">
                          Name: {factor.friendly_name ?? 'No name provided'}
                        </span>
                        <span className="text-sm text-light">Factor ID: {factor.id}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-light">
                          Created at {dayjs(factor.updated_at).format(DATETIME_FORMAT)}
                        </span>
                        <Button
                          size="tiny"
                          type="text"
                          className="px-1"
                          icon={<IconTrash />}
                          onClick={() => setFactorToBeDeleted(factor.id)}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
              {data.totp.length < 2 ? (
                <>
                  <div className="pt-2">
                    <Button onClick={() => setIsAddNewFactorOpen(true)}>Add new app</Button>
                  </div>
                </>
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
        lastFactorToBeDeleted={data?.totp.length === 1}
        onClose={() => setFactorToBeDeleted(null)}
      />
    </>
  )
}

export default TOTPFactors
