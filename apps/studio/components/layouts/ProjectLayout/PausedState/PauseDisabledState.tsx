import { ChevronDown, Download, ExternalLink } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { useParams } from 'common'
import { DropdownMenuItemTooltip } from 'components/ui/DropdownMenuItemTooltip'
import { useBackupDownloadMutation } from 'data/database/backup-download-mutation'
import { useProjectPauseStatusQuery } from 'data/projects/project-pause-status-query'
import { useStorageArchiveCreateMutation } from 'data/storage/storage-archive-create-mutation'
import { useStorageArchiveQuery } from 'data/storage/storage-archive-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { Database, Storage } from 'icons'
import { DOCS_URL, PROJECT_STATUS } from 'lib/constants'
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

export const PauseDisabledState = () => {
  const { ref } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const [toastId, setToastId] = useState<string | number>()
  const [refetchInterval, setRefetchInterval] = useState<number | false>(false)

  const dbVersion = project?.dbVersion?.replace('supabase-postgres-', '')

  const { data: pauseStatus } = useProjectPauseStatusQuery(
    { ref },
    { enabled: project?.status === PROJECT_STATUS.INACTIVE }
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
      <AlertDescription_Shadcn_ className="gap-x-2 mt-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="default" icon={<Download />} iconRight={<ChevronDown />}>
              Download backups
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
              Database backup (PG: {dbVersion})
            </DropdownMenuItemTooltip>
            <DropdownMenuItem className="gap-x-2" onClick={() => onSelectDownloadStorageArchive()}>
              <Storage size={16} />
              Storage objects
            </DropdownMenuItem>
            {/* [Joshen] Once storage object download is supported, can just use the below component */}
            {/* <DropdownMenuItem className="gap-x-2" onClick={() => onSelectDownloadStorageArchive()}>
              <Storage size={16} />
              Download storage objects
            </DropdownMenuItem> */}
          </DropdownMenuContent>
        </DropdownMenu>
        <Button asChild type="default" icon={<ExternalLink />} className="my-3">
          <a
            target="_blank"
            rel="noreferrer"
            href={`${DOCS_URL}/guides/platform/migrating-within-supabase/dashboard-restore`}
          >
            Restore backup to a new Supabase project guide
          </a>
        </Button>
        <Button asChild type="default" icon={<ExternalLink />} className="mb-3">
          <a
            target="_blank"
            rel="noreferrer"
            href={`${DOCS_URL}/guides/local-development/restoring-downloaded-backup`}
          >
            Restore backup on your local machine guide
          </a>
        </Button>
      </AlertDescription_Shadcn_>
    </Alert_Shadcn_>
  )
}
