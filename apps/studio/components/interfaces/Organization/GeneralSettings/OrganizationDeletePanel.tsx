import { ScaffoldSection, ScaffoldSectionTitle } from 'components/layouts/Scaffold'
import PartnerManagedResource from 'components/ui/PartnerManagedResource'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { Admonition } from 'ui-patterns'
import { DeleteOrganizationButton } from './DeleteOrganizationButton'

const OrganizationDeletePanel = () => {
  const selectedOrganization = useSelectedOrganization()

  return (
    <ScaffoldSection isFullWidth>
      <ScaffoldSectionTitle className="mb-4">Danger Zone</ScaffoldSectionTitle>
      {selectedOrganization?.managed_by !== 'vercel-marketplace' ? (
        <Admonition
          type="destructive"
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
    </ScaffoldSection>
  )
}

export default OrganizationDeletePanel
