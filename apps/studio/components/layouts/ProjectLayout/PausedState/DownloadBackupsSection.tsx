import { useParams } from 'common'
import { Database, Storage } from 'icons'
import { ChevronDown, Download } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from 'ui'

import { DropdownMenuItemTooltip } from '@/components/ui/DropdownMenuItemTooltip'
import { useBackupDownloadMutation } from '@/data/database/backup-download-mutation'
import { useProjectPauseStatusQuery } from '@/data/projects/project-pause-status-query'
import { useStorageArchiveCreateMutation } from '@/data/storage/storage-archive-create-mutation'
import { useStorageArchiveQuery } from '@/data/storage/storage-archive-query'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { PROJECT_STATUS } from '@/lib/constants'

export const DownloadBackupsSection = () => {
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

  const { data: storageArchive, isSuccess: isStorageArchiveSuccess } = useStorageArchiveQuery(
    { projectRef: ref },
    {
      refetchInterval,
      refetchOnWindowFocus: false,
    }
  )

  useEffect(() => {
    if (!isStorageArchiveSuccess) return
    if (storageArchive.fileUrl && refetchInterval !== false) {
      toast.success('Downloading storage objects', { id: toastId })
      setToastId(undefined)
      setRefetchInterval(false)
      downloadStorageArchive(storageArchive.fileUrl)
    }
  }, [isStorageArchiveSuccess, storageArchive, refetchInterval])

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
    <div className="border-t flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center px-6 py-4 bg-alternative">
      <div>
        <p className="text-sm">Export your data</p>
        <p className="text-sm text-foreground-lighter">
          Download backups for your database and storage objects
        </p>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="default" icon={<Download />} iconRight={<ChevronDown />}>
            Download backups
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-60" align="end">
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
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
