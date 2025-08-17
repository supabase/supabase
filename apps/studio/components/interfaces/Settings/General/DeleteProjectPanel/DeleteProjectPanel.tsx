import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { ScaffoldSection, ScaffoldSectionTitle } from 'components/layouts/Scaffold'
import { Alert_Shadcn_, AlertDescription_Shadcn_, AlertTitle_Shadcn_, CriticalIcon } from 'ui'
import DeleteProjectButton from './DeleteProjectButton'

export const DeleteProjectPanel = () => {
  const { data: project } = useSelectedProjectQuery()
  const { data: selectedOrganization } = useSelectedOrganizationQuery()

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
    <ScaffoldSection id="delete-project" className="gap-6">
      <ScaffoldSectionTitle>Delete Project</ScaffoldSectionTitle>

      <Alert_Shadcn_ variant="destructive" className="py-4 px-6 [&>svg]:left-6">
        <CriticalIcon />
        <div className="flex justify-between items-center">
          <div className="xl:max-w-lg">
            <AlertTitle_Shadcn_>{title}</AlertTitle_Shadcn_>
            <AlertDescription_Shadcn_>{description}</AlertDescription_Shadcn_>
          </div>
          <DeleteProjectButton />
        </div>
      </Alert_Shadcn_>
    </ScaffoldSection>
  )
}
