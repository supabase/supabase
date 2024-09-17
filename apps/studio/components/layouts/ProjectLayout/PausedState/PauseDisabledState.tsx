import { toast } from 'sonner'
import { ChevronDown, Download } from 'lucide-react'

import { useParams } from 'common'
import { useProjectPauseStatusQuery } from 'data/projects/project-pause-status-query'
import {
  Alert_Shadcn_,
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  WarningIcon,
} from 'ui'
import { useProjectContext } from '../ProjectContext'
import { PROJECT_STATUS } from 'lib/constants'
import { useFlag } from 'hooks/ui/useFlag'
import { useBackupDownloadMutation } from 'data/database/backup-download-mutation'
import { useStorageArchiveQuery } from 'data/storage/storage-archive-query'
import { DropdownMenuItemTooltip } from 'components/ui/DropdownMenuItemTooltip'
import { Database, Storage } from 'icons'

export const PauseDisabledState = () => {
  const { ref } = useParams()
  const { project } = useProjectContext()
  const enforceNinetyDayUnpauseExpiry = useFlag('enforceNinetyDayUnpauseExpiry')

  const { data: pauseStatus } = useProjectPauseStatusQuery(
    { ref },
    {
      enabled: project?.status === PROJECT_STATUS.INACTIVE && enforceNinetyDayUnpauseExpiry,
    }
  )
  const latestBackup = pauseStatus?.latest_downloadable_backup_id

  const { data: storageArchive } = useStorageArchiveQuery({ projectRef: ref })
  const storageArchiveUrl = storageArchive?.fileUrl

  const { mutate: downloadBackup } = useBackupDownloadMutation({
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

  const onSelectDownloadBackup = () => {
    if (ref === undefined) return console.error('Project ref is required')
    if (!latestBackup) return toast.error('No backups available for download')

    const toastId = toast.loading('Fetching database backup')

    downloadBackup(
      {
        ref,
        backup: {
          id: latestBackup,
          // [Joshen] Just FYI these params aren't required for the download backup request
          // API types need to be updated
          project_id: -1,
          inserted_at: '',
          isPhysicalBackup: false,
          status: {},
        },
      },
      {
        onSuccess: () => {
          toast.success('Downloading database backup', { id: toastId })
        },
      }
    )
  }

  const onSelectDownloadStorageArchive = () => {
    if (!storageArchiveUrl) return toast.error('No storage archive available for download')
    toast.success('Downloading storage objects')
    // Trigger browser download by create,trigger and remove tempLink
    const tempLink = document.createElement('a')
    tempLink.href = storageArchiveUrl
    document.body.appendChild(tempLink)
    tempLink.click()
    document.body.removeChild(tempLink)
  }

  return (
    <Alert_Shadcn_ variant="warning">
      <WarningIcon />
      <AlertTitle_Shadcn_>Project cannot be restored through the dashboard</AlertTitle_Shadcn_>
      <AlertDescription_Shadcn_>
        This project has been paused for over{' '}
        <span className="text-foreground">
          {pauseStatus?.max_days_till_restore_disabled ?? 90} days
        </span>{' '}
        and cannot be restored through the dashboard. However, your data remains intact and can be
        downloaded as a backup.
      </AlertDescription_Shadcn_>
      <AlertDescription_Shadcn_ className="flex items-center gap-x-2 mt-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="default" icon={<Download />} iconRight={<ChevronDown />}>
              Download backup
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="start">
            <DropdownMenuItemTooltip
              className="gap-x-2"
              disabled={!latestBackup}
              onClick={() => onSelectDownloadBackup()}
              tooltip={{
                content: {
                  side: 'right',
                  text: 'No backups available, please reach out via support for assistance',
                },
              }}
            >
              <Database size={16} />
              Download database backup
            </DropdownMenuItemTooltip>
            <DropdownMenuItemTooltip
              disabled={!storageArchiveUrl}
              className="gap-x-2"
              onClick={() => onSelectDownloadStorageArchive()}
              tooltip={{
                content: {
                  side: 'right',
                  text: 'No storage archive available for download',
                },
              }}
            >
              <Storage size={16} />
              Download storage objects
            </DropdownMenuItemTooltip>
          </DropdownMenuContent>
        </DropdownMenu>
      </AlertDescription_Shadcn_>
    </Alert_Shadcn_>
  )
}
