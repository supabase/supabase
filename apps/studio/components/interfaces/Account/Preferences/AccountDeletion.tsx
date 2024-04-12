import React from 'react'
import Panel from 'components/ui/Panel'
import { Alert } from 'ui'
import DeleteAccountButton from './DeleteAccountButton'
import { useProfile } from 'lib/profile'

const AccountDeletion = () => {
  const { profile } = useProfile()

  return (
    <>
      <Panel
        title={
          <p key="panel-title" className="uppercase">
            Danger Zone
          </p>
        }
      >
        <Panel.Content>
          <Alert
            withIcon
            variant="danger"
            // @ts-ignore
            title={
              <span className="text-red-900">
                Deleting your account is permanent and cannot be undone.
              </span>
            }
          >
            <p className="text-red-900">
              Your data will be deleted within 30 days, except we may retain a limited set of data
              for longer where required or permitted by law.
            </p>
            <DeleteAccountButton profile={profile} />
          </Alert>
        </Panel.Content>
      </Panel>
    </>
  )
}

export default AccountDeletion
