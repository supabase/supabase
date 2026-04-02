import { useParams } from 'common'
import Link from 'next/link'
import { Button } from 'ui'
import {
  PageSection,
  PageSectionContent,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns'
import { Admonition } from 'ui-patterns/admonition'

import { DocsButton } from '../../ui/DocsButton'
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
          title="Disk Management has moved"
          description="Disk configuration is now managed alongside Project Compute on the new Compute and Disk page."
          actions={
            <Button type="default" asChild>
              <Link href={`/project/${projectRef}/settings/compute-and-disk`}>
                Go to Compute and Disk
              </Link>
            </Button>
          }
        />
      </PageSectionContent>
    </PageSection>
  )
}
