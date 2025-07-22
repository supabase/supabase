import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { FormHeader } from 'components/ui/Forms/FormHeader'
import PartnerManagedResource from 'components/ui/PartnerManagedResource'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { Alert_Shadcn_, AlertDescription_Shadcn_, AlertTitle_Shadcn_, CriticalIcon } from 'ui'
import DeleteProjectButton from './DeleteProjectButton'

export const DeleteProjectPanel = () => {
  const selectedOrganization = useSelectedOrganization()
  const { project } = useProjectContext()

  if (project === undefined) return null

  const title =
    selectedOrganization?.managed_by === 'vercel-marketplace'
      ? 'Deleting this project will also remove your database and uninstall the resource on Vercel.'
      : 'Deleting this project will also remove your database.'
  const description =
    selectedOrganization?.managed_by === 'vercel-marketplace'
      ? 'Make sure you have made a backup if you want to keep your data, and that no Vercel project is connected to this resource.'
      : 'Make sure you have made a backup if you want to keep your data.'

  return (
    <section id="delete-project">
      <FormHeader title="Delete Project" description="" />

      <Alert_Shadcn_ variant="destructive">
        <CriticalIcon />
        <AlertTitle_Shadcn_ className="mt-2">{title}</AlertTitle_Shadcn_>
        <AlertDescription_Shadcn_>{description}</AlertDescription_Shadcn_>
        <div className="mt-2">
          <DeleteProjectButton />
        </div>
      </Alert_Shadcn_>
    </section>
  )
}
