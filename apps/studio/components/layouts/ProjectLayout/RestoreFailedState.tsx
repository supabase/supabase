import { PermissionAction } from '@supabase/shared-types/out/constants'
import { Download, MoreVertical, Trash } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

import { useParams } from 'common'
import { DeleteProjectModal } from 'components/interfaces/Settings/General/DeleteProjectPanel/DeleteProjectModal'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { DropdownMenuItemTooltip } from 'components/ui/DropdownMenuItemTooltip'
import { InlineLink } from 'components/ui/InlineLink'
import { useBackupDownloadMutation } from 'data/database/backup-download-mutation'
import { useDownloadableBackupQuery } from 'data/database/backup-query'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { Button, CriticalIcon, DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from 'ui'

export const RestoreFailedState = () => {
  const { ref } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const [visible, setVisible] = useState(false)

  const { can: canDeleteProject } = useAsyncCheckPermissions(PermissionAction.UPDATE, 'projects', {
    resource: { project_id: project?.id },
  })

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
                <p>Something went wrong while restoring your project</p>
                <p className="text-sm text-foreground-light">
                  Your project's data is intact, but your project is inaccessible due to a
                  restoration failure. Database backups for this project can still be accessed{' '}
                  <InlineLink href={`/project/${ref}/database/backups/scheduled`}>here</InlineLink>.
                </p>
                <p className="text-sm text-foreground-light">
                  Please contact support for assistance.
                </p>
              </div>
            </div>

            <div className="border-t border-overlay flex items-center justify-end py-4 px-8 gap-x-2">
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
                tooltip={{
                  content: {
                    side: 'bottom',
                    text:
                      data?.status === 'physical-backups-enabled'
                        ? 'No available backups to download as project is on physical backups'
                        : backups.length === 0
                          ? 'No available backups to download'
                          : undefined,
                  },
                }}
                onClick={onClickDownloadBackup}
              >
                Download backup
              </ButtonTooltip>

              <DropdownMenu>
                <DropdownMenuTrigger>
                  <Button type="default" className="w-7" icon={<MoreVertical />} />
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-72" align="end">
                  <DropdownMenuItemTooltip
                    onClick={() => setVisible(true)}
                    className="items-start gap-x-2"
                    disabled={!canDeleteProject}
                    tooltip={{
                      content: {
                        side: 'right',
                        text: !canDeleteProject
                          ? 'You need additional permissions to delete this project'
                          : undefined,
                      },
                    }}
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
                  </DropdownMenuItemTooltip>
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
