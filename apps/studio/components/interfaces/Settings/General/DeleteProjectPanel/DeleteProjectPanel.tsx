import { Admonition } from 'ui-patterns/Admonition'
import {
  PageSection,
  PageSectionContent,
  PageSectionDescription,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns/PageSection'

import { DeleteProjectButton } from './DeleteProjectButton'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'

export const DeleteProjectPanel = () => {
  const { data: project } = useSelectedProjectQuery()
  const { data: selectedOrganization } = useSelectedOrganizationQuery()

  if (project === undefined) return null

  const title =
    selectedOrganization?.managed_by === 'vercel-marketplace'
      ? 'Deleting this project will also remove your database and uninstall the resource on Vercel'
      : 'Deleting this project will also remove your database'
  const description =
    selectedOrganization?.managed_by === 'vercel-marketplace'
      ? 'Make sure you have made a backup if you want to keep your data, and that no Vercel project is connected to this resource.'
      : 'Make sure you have made a backup if you want to keep your data.'

  return (
    <PageSection id="delete-project">
      <PageSectionMeta>
        <PageSectionSummary>
          <PageSectionTitle>Delete project</PageSectionTitle>
          <PageSectionDescription>
            Permanently remove your project and its database.
          </PageSectionDescription>
        </PageSectionSummary>
      </PageSectionMeta>

      <PageSectionContent>
        <Admonition
          type="danger"
          title={title}
          description={description}
          actions={<DeleteProjectButton />}
          layout="responsive"
        />
      </PageSectionContent>
    </PageSection>
  )
}
