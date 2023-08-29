import { AddNewFactorModal } from 'components/interfaces/Account'
import { AccountLayout } from 'components/layouts'
import AlertError from 'components/ui/AlertError'
import ConfirmationModal from 'components/ui/ConfirmationModal'
import { FormHeader } from 'components/ui/Forms'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import { useMfaListFactorsQuery } from 'data/profile/mfa-list-factors-query'
import { useMfaUnenrollMutation } from 'data/profile/mfa-unenroll-mutation'
import { useStore } from 'hooks'
import { useState } from 'react'
import { NextPageWithLayout } from 'types'
import {
  Accordion,
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Badge,
  Button,
  IconAlertCircle,
  IconAlertTriangle,
  IconSmartphone,
  IconTrash,
  Modal,
} from 'ui'

const Security: NextPageWithLayout = () => {
  const { data } = useMfaListFactorsQuery()

  return (
    <div className="1xl:px-28 mx-auto flex flex-col px-5 pt-6 pb-14 lg:px-16 xl:px-24 2xl:px-32">
      <div className="flex items-center justify-between">
        <FormHeader
          title="Multi-factor authentication"
          description="Add an additional layer of security to your account by requiring more than just a password to sign in."
        />
      </div>
      <Accordion
        openBehaviour="multiple"
        chevronAlign="left"
        type="bordered"
        className="max-w-4xl"
        defaultValue={['auth-app']}
      >
        <Accordion.Item
          header={
            <div className="flex flex-row justify-between items-center p-2 w-full">
              <div className="flex flex-row gap-2 items-center p-2">
                <IconSmartphone />
                <span className="text-lg">Authenticator app</span>
              </div>

              {data ? (
                <>
                  {data.totp.length === 0 && <Badge color="red">0 apps configured</Badge>}
                  {data.totp.length === 1 && <Badge color="yellow">1 apps configured</Badge>}
                  {data.totp.length === 2 && <Badge color="green">2 apps configured</Badge>}
                </>
              ) : null}
            </div>
          }
          id="auth-app"
          className="flex flex-row gap-8"
        >
          <ProfileCard />
        </Accordion.Item>
      </Accordion>
    </div>
  )
}

Security.getLayout = (page) => (
  <AccountLayout title="Security" breadcrumbs={[{ key: 'security', label: 'Security' }]}>
    {page}
  </AccountLayout>
)

export default Security

const ProfileCard = () => {
  const [isAddNewFactorOpen, setIsAddNewFactorOpen] = useState(false)
  const [factorToBeDeleted, setFactorToBeDeleted] = useState<string | null>(null)
  const { data, isLoading, isError, isSuccess, error } = useMfaListFactorsQuery()

  return (
    <>
      <section className="px-6 pt-4">
        <div>
          <span className="text-sm prose color-slate-1000">
            Generate one-time passwords via authenticator apps like 1Password, Authy, etc. as a
            second factor to verify your identity when prompted during sign-in.
          </span>
        </div>
        {isLoading && (
          <div className="py-2">
            {[1, 2].map((number) => {
              return <ShimmeringLoader key={number} />
            })}
          </div>
        )}
        {isError && (
          <div className="py-4">
            <AlertError error={error} subject="Failed to retrieve account security information" />
          </div>
        )}
        {isSuccess && (
          <>
            {data.totp.length === 1 && (
              <Alert_Shadcn_ variant="default" className="mt-2">
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
                        Created at {new Date(factor.updated_at).toLocaleString()}
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
                <div className="py-2">
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

const DeleteFactorModal = ({
  factorId,
  lastFactorToBeDeleted,
  onClose,
}: {
  factorId: string
  lastFactorToBeDeleted: boolean
  onClose: () => void
}) => {
  const { ui } = useStore()

  const { mutate: unenroll, isLoading } = useMfaUnenrollMutation({
    onError: (error) => {
      ui.setNotification({
        category: 'error',
        message: `Failed to delete a second factor authentication:  ${error?.message}`,
      })
    },
    onSuccess: () => {
      ui.setNotification({
        category: 'success',
        message: `Successfully deleted a second factor authentication.`,
      })
      onClose()
    },
  })

  return (
    <ConfirmationModal
      size="medium"
      visible
      danger
      header="Confirm to delete factor"
      buttonLabel="Delete"
      buttonLoadingLabel="Deleting"
      loading={isLoading}
      onSelectCancel={onClose}
      onSelectConfirm={() => {
        unenroll({ factorId })
      }}
    >
      <Modal.Content className="py-6">
        <Alert_Shadcn_ variant="warning">
          <IconAlertTriangle strokeWidth={2} />
          <AlertTitle_Shadcn_>
            {lastFactorToBeDeleted
              ? 'Multi-factor authentication will be disabled'
              : 'This action cannot be undone'}
          </AlertTitle_Shadcn_>
          <AlertDescription_Shadcn_>
            {lastFactorToBeDeleted
              ? 'There are no other factors that are set up once you delete this factor, as such your account will no longer be guarded by multi-factor authentication'
              : 'You will no longer be able to use this authenticator app for multi-factor authentication when signing in to the dashboard'}
          </AlertDescription_Shadcn_>
        </Alert_Shadcn_>
        <div className="text-sm px-1 pt-4">
          <span className="font-bold">Before deleting this factor, consider:</span>
          <ul className="text-scale-900 py-1 list-disc mx-4 space-y-1">
            {lastFactorToBeDeleted ? (
              <>
                <li>Adding another authenticator app as a factor prior to deleting</li>
                <li>Ensure that your account does not need multi-factor authentication</li>
              </>
            ) : (
              <>
                <li>Your backup authenticator app is still available to use</li>
                <li>Adding another authenticator app thereafter as a backup</li>
              </>
            )}
          </ul>
        </div>
      </Modal.Content>
    </ConfirmationModal>
  )
}
