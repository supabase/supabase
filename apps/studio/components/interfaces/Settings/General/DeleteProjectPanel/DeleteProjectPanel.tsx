import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { FormHeader } from 'components/ui/Forms/FormHeader'
import Panel from 'components/ui/Panel'
import {
  Alert,
  Alert_Shadcn_,
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  CriticalIcon,
} from 'ui'
import DeleteProjectButton from './DeleteProjectButton'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import PartnerManagedResource from 'components/ui/PartnerManagedResource'

const DeleteProjectPanel = () => {
  const selectedOrganization = useSelectedOrganization()
  const { project } = useProjectContext()

  if (project === undefined) return null

  return (
    <section id="delete-project">
      <FormHeader title="Delete Project" description="" />
      <Panel>
        <Panel.Content>
          {selectedOrganization?.managed_by !== 'vercel-marketplace' ? (
            <Alert_Shadcn_ variant="destructive">
              <CriticalIcon />
              <AlertTitle_Shadcn_>
                Deleting this project will also remove your database.
              </AlertTitle_Shadcn_>
              <AlertDescription_Shadcn_>
                Make sure you have made a backup if you want to keep your data.
              </AlertDescription_Shadcn_>
              <div className="mt-2">
                <DeleteProjectButton />
              </div>
            </Alert_Shadcn_>
          ) : (
            <PartnerManagedResource
              partner="vercel-marketplace"
              resource="Projects"
              cta={{
                installationId: selectedOrganization?.partner_id,
                message: 'Delete project in Vercel Marketplace',
              }}
            />
          )}
        </Panel.Content>
      </Panel>
    </section>
  )
}

export default DeleteProjectPanel
