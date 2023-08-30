import AlertError from 'components/ui/AlertError'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useMfaListFactorsQuery } from 'data/profile/mfa-list-factors-query'
import dayjs from 'dayjs'
import { DATETIME_FORMAT } from 'lib/constants'
import { useState } from 'react'
import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Button,
  IconAlertCircle,
  IconTrash,
} from 'ui'
import AddNewFactorModal from './AddNewFactorModal'
import { DeleteFactorModal } from './DeleteFactorModal'

const TOTPFactors = () => {
  const [isAddNewFactorOpen, setIsAddNewFactorOpen] = useState(false)
  const [factorToBeDeleted, setFactorToBeDeleted] = useState<string | null>(null)
  const { data, isLoading, isError, isSuccess, error } = useMfaListFactorsQuery()

  return (
    <>
      <section>
        <span className="text-sm prose color-slate-1000">
          Generate one-time passwords via authenticator apps like 1Password, Authy, etc. as a second
          factor to verify your identity when prompted during sign-in.
        </span>
        <div className="py-2">
          {isLoading && <GenericSkeletonLoader />}
          {isError && (
            <AlertError error={error} subject="Failed to retrieve account security information" />
          )}
          {isSuccess && (
            <>
              {data.totp.length === 1 && (
                <Alert_Shadcn_ variant="default">
                  <IconAlertCircle className="h-4 w-4" />
                  <AlertTitle_Shadcn_>
                    We recommend configuring two authenticator apps across different devices
                  </AlertTitle_Shadcn_>
                  <AlertDescription_Shadcn_ className="flex flex-col gap-3">
                    The two authenticator apps will serve as a backup for each other.
                  </AlertDescription_Shadcn_>
                </Alert_Shadcn_>
              )}
              <div className="py-2">
                {data.totp.map((factor) => {
                  return (
                    <div key={factor.id} className="flex flex-row justify-between py-2">
                      <div className="flex flex-col">
                        <span className="text-sm text-white">
                          Name: {factor.friendly_name ?? 'No name provided'}
                        </span>
                        <span className="text-sm text-scale-900">Factor ID: {factor.id}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-scale-900">
                          Created at {dayjs(factor.updated_at).format(DATETIME_FORMAT)}
                        </span>
                        <Button
                          size="tiny"
                          type="default"
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
                    <Button
                      size="small"
                      onClick={() => {
                        setIsAddNewFactorOpen(true)
                      }}
                    >
                      Add new app
                    </Button>
                  </div>
                </>
              ) : null}
            </>
          )}
        </div>
      </section>
      {isAddNewFactorOpen && <AddNewFactorModal onClose={() => setIsAddNewFactorOpen(false)} />}
      {factorToBeDeleted && (
        <DeleteFactorModal
          factorId={factorToBeDeleted}
          lastFactorToBeDeleted={data?.totp.length === 1}
          onClose={() => setFactorToBeDeleted(null)}
        />
      )}
    </>
  )
}

export default TOTPFactors
