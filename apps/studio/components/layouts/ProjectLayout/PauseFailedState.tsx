import { Download, MoreVertical, Trash } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

import { useParams } from 'common'
import DeleteProjectModal from 'components/interfaces/Settings/General/DeleteProjectPanel/DeleteProjectModal'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { useBackupDownloadMutation } from 'data/database/backup-download-mutation'
import { useDownloadableBackupQuery } from 'data/database/backup-query'
import {
  Button,
  CriticalIcon,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from 'ui'
import { useProjectContext } from './ProjectContext'

const PauseFailedState = () => {
  const { ref } = useParams()
  const { project } = useProjectContext()
  const [visible, setVisible] = useState(false)

  const { data } = useDownloadableBackupQuery({ projectRef: ref })
  const backups = data?.backups ?? []

  const { mutate: downloadBackup, isLoading: isDownloading } = useBackupDownloadMutation({
    onSuccess: (res) => {
      const { fileUrl } = res

      // Trigger browser download by create,trigger and remove tempLink
      const tempLink = document.createElement('a')
      tempLink.href = fileUrl
      document.body.appendChild(tempLink)
      tempLink.click()
      document.body.removeChild(tempLink)
    },
  })

  const onClickDownloadBackup = () => {
    if (!ref) return console.error('Project ref is required')
    if (backups.length === 0) return console.error('No available backups to download')
    downloadBackup({ ref, backup: backups[0] })
  }

  return (
    <>
      <div className="flex items-center justify-center h-full">
        <div className="bg-surface-100 border border-overlay rounded-md w-3/4 lg:w-1/2">
          <div className="space-y-6 pt-6">
            <div className="flex px-8 space-x-8">
              <div className="mt-1">
                <CriticalIcon className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <p>Something went wrong while pausing your project</p>
                <p className="text-sm text-foreground-light">
                  Your project's data is intact, but your project is inaccessible due to the failure
                  while pausing. Please contact support for assistance.
                </p>
              </div>
            </div>

            <div className="border-t border-overlay flex items-center justify-end gap-x-2 py-4 px-8">
              <Button asChild type="default">
                <Link
                  href={`/support/new?category=Database_unresponsive&ref=${project?.ref}&subject=Restoration%20failed%20for%20project`}
                >
                  Contact support
                </Link>
              </Button>
              <ButtonTooltip
                type="default"
                icon={<Download />}
                loading={isDownloading}
                disabled={backups.length === 0}
                tooltip={{ content: { side: 'bottom', text: 'No available backups to download' } }}
                onClick={onClickDownloadBackup}
              >
                Download backup
              </ButtonTooltip>
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <Button type="default" className="px-1.5" icon={<MoreVertical />} />
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-72" align="end">
                  <DropdownMenuItem
                    onClick={() => setVisible(true)}
                    className="items-start gap-x-2"
                  >
                    <div className="translate-y-0.5">
                      <Trash size={14} />
                    </div>
                    <div className="">
                      <p>Delete project</p>
                      <p className="text-foreground-lighter">
                        Project cannot be restored once it is deleted
                      </p>
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
      <DeleteProjectModal visible={visible} onClose={() => setVisible(false)} />
    </>
  )
}

export default PauseFailedState
