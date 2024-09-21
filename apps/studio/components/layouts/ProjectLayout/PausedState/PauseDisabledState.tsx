import { ChevronDown, Download } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { useParams } from 'common'
import { DropdownMenuItemTooltip } from 'components/ui/DropdownMenuItemTooltip'
import { useBackupDownloadMutation } from 'data/database/backup-download-mutation'
import { useProjectPauseStatusQuery } from 'data/projects/project-pause-status-query'
import { useStorageArchiveCreateMutation } from 'data/storage/storage-archive-create-mutation'
import { useStorageArchiveQuery } from 'data/storage/storage-archive-query'
import { useFlag } from 'hooks/ui/useFlag'
import { Database, Storage } from 'icons'
import { PROJECT_STATUS } from 'lib/constants'
import {
  Alert_Shadcn_,
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  WarningIcon,
} from 'ui'
import { useProjectContext } from '../ProjectContext'

export const PauseDisabledState = () => {
  const { ref } = useParams()
  const { project } = useProjectContext()
  const [toastId, setToastId] = useState<string | number>()
  const [refetchInterval, setRefetchInterval] = useState<number | false>(false)

  const enforceNinetyDayUnpauseExpiry = useFlag('enforceNinetyDayUnpauseExpiry')
  const allowStorageObjectsDownload = useFlag('enableNinetyDayStorageDownload')

  const { data: pauseStatus } = useProjectPauseStatusQuery(
    { ref },
    {
      enabled: project?.status === PROJECT_STATUS.INACTIVE && enforceNinetyDayUnpauseExpiry,
    }
  )
  const latestBackup = pauseStatus?.latest_downloadable_backup_id

  const { data: storageArchive } = useStorageArchiveQuery(
    { projectRef: ref },
    {
      refetchInterval,
      refetchOnWindowFocus: false,
      onSuccess: (data) => {
        if (data.fileUrl && refetchInterval !== false) {
          toast.success('Downloading storage objects', { id: toastId })
          setToastId(undefined)
          setRefetchInterval(false)
          downloadStorageArchive(data.fileUrl)
        }
      },
    }
  )
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

  const { mutate: createStorageArchive } = useStorageArchiveCreateMutation({
    onSuccess: () => {
      const toastId = toast.loading(
        'Retrieving storage archive. This may take a few minutes depending on the size of your storage objects.'
      )
      setToastId(toastId)
      setRefetchInterval(5000)
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

  const downloadStorageArchive = (url: string) => {
    const tempLink = document.createElement('a')
    tempLink.href = url
    document.body.appendChild(tempLink)
    tempLink.click()
    document.body.removeChild(tempLink)
  }

  const onSelectDownloadStorageArchive = () => {
    if (!storageArchiveUrl) {
      createStorageArchive({ projectRef: ref })
    } else {
      toast.success('Downloading storage objects')
      downloadStorageArchive(storageArchiveUrl)
    }
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
              className="gap-x-2"
              disabled={!allowStorageObjectsDownload}
              onClick={() => onSelectDownloadStorageArchive()}
              tooltip={{
                content: {
                  side: 'right',
                  text: 'This feature is not available yet, please reach out to support for assistance',
                },
              }}
            >
              <Storage size={16} />
              Download storage objects
            </DropdownMenuItemTooltip>
            {/* [Joshen] Once storage object download is supported, can just use the below component */}
            {/* <DropdownMenuItem className="gap-x-2" onClick={() => onSelectDownloadStorageArchive()}>
              <Storage size={16} />
              Download storage objects
            </DropdownMenuItem> */}
          </DropdownMenuContent>
        </DropdownMenu>
      </AlertDescription_Shadcn_>
    </Alert_Shadcn_>
  )
}
