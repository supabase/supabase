import { useParams } from 'common'
import Link from 'next/link'
import { Button } from 'ui'
import { Admonition } from 'ui-patterns/Admonition'
import {
  PageSection,
  PageSectionContent,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns/PageSection'

import { DocsButton } from '../../ui/DocsButton'
import { getInfrastructurePath } from '@/components/interfaces/Settings/Infrastructure/Infrastructure.utils'
import { DOCS_URL } from '@/lib/constants'

// [Joshen] Only used for non AWS projects
export function DiskManagementPanelForm() {
  const { ref: projectRef } = useParams()

  return (
    <PageSection id="disk-management">
      <PageSectionMeta>
        <PageSectionSummary>
          <PageSectionTitle>Disk management</PageSectionTitle>
        </PageSectionSummary>
        <DocsButton href={`${DOCS_URL}/guides/platform/database-size#disk-management`} />
      </PageSectionMeta>
      <PageSectionContent>
        <Admonition
          type="default"
          layout="responsive"
          title="Disk management has moved"
          description="Disk configuration is now managed alongside project compute on the Infrastructure page."
          actions={
            <Button variant="default" asChild>
              <Link href={getInfrastructurePath(projectRef)}>Go to Infrastructure</Link>
            </Button>
          }
        />
      </PageSectionContent>
    </PageSection>
  )
}
