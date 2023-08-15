import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { useRouter } from 'next/router'
import { useState } from 'react'

import { confirmAlert } from 'components/to-be-cleaned/ModalsDeprecated/ConfirmModal'
import { setProjectStatus } from 'data/projects/projects-query'
import { useCheckPermissions, useStore } from 'hooks'
import { post } from 'lib/common/fetch'
import { API_URL, PROJECT_STATUS } from 'lib/constants'
import { Badge, Button, IconDownload } from 'ui'

interface BackupItemProps {
  projectRef: string
  backup: any
  index: number
}

const BackupItem = ({ projectRef, backup, index }: BackupItemProps) => {
  const queryClient = useQueryClient()
  const router = useRouter()
  const { ui } = useStore()

  const [isDownloading, setDownloading] = useState<boolean>(false)
  const [isRestoring, setRestoring] = useState<boolean>(false)

  const canTriggerScheduledBackups = useCheckPermissions(
    PermissionAction.INFRA_EXECUTE,
    'queue_job.restore.prepare'
  )

  async function restore(backup: any) {
    setRestoring(true)
    try {
      post(`${API_URL}/database/${projectRef}/backups/restore`, backup).then(() => {
        setTimeout(() => {
          setProjectStatus(queryClient, projectRef, PROJECT_STATUS.RESTORING)
          ui.setNotification({
            category: 'success',
            message: `Restoring database back to ${dayjs(backup.inserted_at).format(
              'DD MMM YYYY HH:mm:ss'
            )}`,
          })
          router.push(`/project/${projectRef}`)
        }, 3000)
      })
    } catch (error: any) {
      ui.setNotification({
        error,
        category: 'error',
        message: `Failed to restore from backup: ${error.message}`,
      })
      setRestoring(false)
    }
  }

  async function download(backup: any) {
    setDownloading(true)
    try {
      const res = await post(`${API_URL}/database/${projectRef}/backups/download`, backup)
      const { fileUrl } = await res

      // Trigger browser download by create,trigger and remove tempLink
      const tempLink = document.createElement('a')
      tempLink.href = fileUrl
      document.body.appendChild(tempLink)
      tempLink.click()
      document.body.removeChild(tempLink)

      setDownloading(false)
    } catch (error: any) {
      ui.setNotification({
        error,
        category: 'error',
        message: `Failed to download backup: ${error.message}`,
      })
      setDownloading(false)
    }
  }

  function onRestoreClick() {
    confirmAlert({
      title: 'Confirm to restore',
      message: `Are you sure you want to restore from ${dayjs(backup.inserted_at).format(
        'DD MMM YYYY'
      )}? This will destroy any new data written since this backup was made.`,
      onAsyncConfirm: async () => {
        await restore(backup)
      },
    })
  }

  const generateSideButtons = (backup: any) => {
    if (backup.status === 'COMPLETED')
      return (
        <div className="flex space-x-4">
          {backup.data.canRestore && (
            <Button
              type="default"
              disabled={!canTriggerScheduledBackups || isRestoring || isDownloading}
              onClick={onRestoreClick}
            >
              Restore
            </Button>
          )}

          <Button
            type="default"
            disabled={!canTriggerScheduledBackups || isRestoring || isDownloading}
            onClick={() => download(backup)}
            loading={isDownloading}
            icon={<IconDownload />}
          >
            Download
          </Button>
        </div>
      )
    return <Badge color="yellow">Backup In Progress...</Badge>
  }

  return (
    <div
      className={`flex h-12 items-center justify-between px-6 ${
        index ? 'border-t dark:border-dark' : ''
      }`}
    >
      <p className="text-sm text-scale-1200 ">
        {dayjs(backup.inserted_at).format('DD MMM YYYY HH:mm:ss')}
      </p>
      <div className="">{generateSideButtons(backup)}</div>
    </div>
  )
}

export default BackupItem
