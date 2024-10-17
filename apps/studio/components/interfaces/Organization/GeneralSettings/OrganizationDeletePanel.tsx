import Panel from 'components/ui/Panel'
import { AlertDescription_Shadcn_, AlertTitle_Shadcn_, Alert_Shadcn_ } from 'ui'
import { CriticalIcon } from 'ui'
import DeleteOrganizationButton from './DeleteOrganizationButton'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import PartnerManagedResource from 'components/ui/PartnerManagedResource'

const OrganizationDeletePanel = () => {
  const selectedOrganization = useSelectedOrganization()

  return (
    <Panel
      title={
        <p key="panel-title" className="uppercase">
          Danger Zone
        </p>
      }
    >
      <Panel.Content>
        {selectedOrganization?.managed_by !== 'vercel-marketplace' ? (
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
        ) : (
          <PartnerManagedResource
            partner="vercel-marketplace"
            resource="Organizations"
            cta={{
              installationId: selectedOrganization?.partner_id,
              path: '/settings',
              message: 'Delete organization in Vercel Marketplace',
            }}
          />
        )}
      </Panel.Content>
    </Panel>
  )
}

export default OrganizationDeletePanel
