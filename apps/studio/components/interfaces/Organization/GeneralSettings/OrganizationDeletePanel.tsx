import Panel from 'components/ui/Panel'
import { AlertDescription_Shadcn_, AlertTitle_Shadcn_, Alert_Shadcn_ } from 'ui'
import { CriticalIcon } from 'ui'
import DeleteOrganizationButton from './DeleteOrganizationButton'

const OrganizationDeletePanel = () => {
  return (
    <Panel
      title={
        <p key="panel-title" className="uppercase">
          Danger Zone
        </p>
      }
    >
      <Panel.Content>
        <Alert_Shadcn_ variant="destructive">
          <CriticalIcon />
          <AlertTitle_Shadcn_>
            Deleting this organization will also remove its projects
          </AlertTitle_Shadcn_>
          <AlertDescription_Shadcn_>
            Make sure you have made a backup if you want to keep your data
          </AlertDescription_Shadcn_>
          <DeleteOrganizationButton />
        </Alert_Shadcn_>
      </Panel.Content>
    </Panel>
  )
}

export default OrganizationDeletePanel
