import Panel from 'components/ui/Panel'
import PartnerManagedResource from 'components/ui/PartnerManagedResource'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { Admonition } from 'ui-patterns'
import DeleteOrganizationButton from './DeleteOrganizationButton'

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
      <Panel.Content className="p-0">
        {selectedOrganization?.managed_by !== 'vercel-marketplace' ? (
          <Admonition
            type="destructive"
            className="mb-0 rounded-none border-0"
            title="Deleting this organization will also remove its projects"
            description="Make sure you have made a backup of your projects if you want to keep your data"
          >
            <DeleteOrganizationButton />
          </Admonition>
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
