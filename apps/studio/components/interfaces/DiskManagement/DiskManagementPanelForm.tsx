import Link from 'next/link'

import { useParams } from 'common'
import { FormHeader } from 'components/ui/Forms/FormHeader'
import { DOCS_URL } from 'lib/constants'
import { Button } from 'ui'
import { NoticeBar } from './ui/NoticeBar'

// [Joshen] Only used for non AWS projects
export function DiskManagementPanelForm() {
  const { ref: projectRef } = useParams()

  return (
    <div id="disk-management">
      <FormHeader
        title="Disk Management"
        docsUrl={`${DOCS_URL}/guides/platform/database-size#disk-management`}
      />
      <NoticeBar
        visible={true}
        type="default"
        title="Disk Management has moved"
        description="Disk configuration is now managed alongside Project Compute on the new Compute and Disk page."
        actions={
          <Button type="default" asChild>
            <Link
              href={`/project/${projectRef}/settings/compute-and-disk`}
              className="!no-underline"
            >
              Go to Compute and Disk
            </Link>
          </Button>
        }
      />
    </div>
  )
}
