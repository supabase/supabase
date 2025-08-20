import Link from 'next/link'

import { useParams } from 'common'
import { DocsButton } from 'components/ui/DocsButton'
import { ScaffoldSection, ScaffoldSectionTitle } from 'components/layouts/Scaffold'
import { Button } from 'ui'
import { Admonition } from 'ui-patterns/admonition'

// [Joshen] Only used for non AWS projects
export const DiskManagementPanelForm = () => {
  const { ref: projectRef } = useParams()

  return (
    <ScaffoldSection id="disk-management" className="gap-6">
      <ScaffoldSectionTitle className="flex items-center justify-between  gap-2">
        Disk Management
        <DocsButton href="https://supabase.com/docs/guides/platform/database-size#disk-management" />
      </ScaffoldSectionTitle>

      <Admonition title="Disk Management has moved">
        <p>
          Disk configuration is now managed alongside Project Compute on the new Compute and Disk
          page.
        </p>
        <Button type="default" asChild>
          <Link href={`/project/${projectRef}/settings/compute-and-disk`} className="!no-underline">
            Go to Compute and Disk
          </Link>
        </Button>
      </Admonition>
    </ScaffoldSection>
  )
}
