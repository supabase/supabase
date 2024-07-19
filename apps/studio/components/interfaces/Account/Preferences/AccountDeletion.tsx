import Panel from 'components/ui/Panel'
import { AlertDescription_Shadcn_, AlertTitle_Shadcn_, Alert_Shadcn_ } from 'ui'
import { CriticalIcon } from 'ui'
import { DeleteAccountButton } from './DeleteAccountButton'

export const AccountDeletion = () => {
  return (
    <>
      <Panel className="[&>div:first-child]:uppercase" title="Danger Zone">
        <Panel.Content>
          <Alert_Shadcn_ variant="destructive">
            <CriticalIcon />
            <AlertTitle_Shadcn_>Request for account deletion</AlertTitle_Shadcn_>
            <AlertDescription_Shadcn_>
              Deleting your account is permanent and cannot be undone. Your data will be deleted
              within 30 days, except we may retain some metadata and logs for longer where required
              or permitted by law.
            </AlertDescription_Shadcn_>
            <AlertDescription_Shadcn_ className="mt-3">
              <DeleteAccountButton />
            </AlertDescription_Shadcn_>
          </Alert_Shadcn_>
        </Panel.Content>
      </Panel>
    </>
  )
}
