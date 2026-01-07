import { ChevronDown, Download, ExternalLink } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { useParams } from 'common'
import { DropdownMenuItemTooltip } from 'components/ui/DropdownMenuItemTooltip'
import { InlineLink } from 'components/ui/InlineLink'
import { useBackupDownloadMutation } from 'data/database/backup-download-mutation'
import { useProjectPauseStatusQuery } from 'data/projects/project-pause-status-query'
import { useStorageArchiveCreateMutation } from 'data/storage/storage-archive-create-mutation'
import { useStorageArchiveQuery } from 'data/storage/storage-archive-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { Database, Storage } from 'icons'
import { DOCS_URL, PROJECT_STATUS } from 'lib/constants'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from 'ui'
import { Admonition, TimestampInfo } from 'ui-patterns'

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
    <>
      <Admonition
        showIcon={false}
        type="warning"
        className="rounded-none border-0 px-6 [&>div>div>div]:flex [&>div>div>div]:flex-col [&>div>div>div]:gap-y-3"
        title="Project can no longer be restored through the dashboard"
      >
        <p className="!leading-normal">
          This project has been paused for over{' '}
          <span className="text-foreground">
            {pauseStatus?.max_days_till_restore_disabled ?? 90} days
          </span>{' '}
          and cannot be restored through the dashboard. However, your data remains intact and can be
          downloaded as a backup.
        </p>

        {!!pauseStatus?.last_paused_on && (
          <p className="text-foreground-lighter text-sm">
            Project last paused on{' '}
            <TimestampInfo
              className="text-sm"
              labelFormat="DD MMM YYYY"
              utcTimestamp={pauseStatus.last_paused_on}
            />
          </p>
        )}

        <div>
          <p className="!leading-normal !mb-1">Recovery options:</p>
          <ul className="flex flex-col gap-y-0.5">
            <li className="flex items-center gap-x-2">
              <ExternalLink size={14} />
              <InlineLink
                href={`${DOCS_URL}/guides/platform/migrating-within-supabase/dashboard-restore`}
              >
                Migrate to a new project guide
              </InlineLink>
            </li>
          </ul>
        </div>
      </Admonition>
      <div className="border-t flex justify-between items-center px-6 py-4 bg-alternative">
        <div>
          <p className="text-sm">Export your data</p>
          <p className="text-sm text-foreground-lighter">
            Download backups for your database and storage objects
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="default" icon={<Download />} iconRight={<ChevronDown />}>
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
            {/* [Joshen] Once storage object download is supported, can just use the below component */}
            {/* <DropdownMenuItem className="gap-x-2" onClick={() => onSelectDownloadStorageArchive()}>
              <Storage size={16} />
              Download storage objects
            </DropdownMenuItem> */}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  )
}
