import dayjs from 'dayjs'
import { FC, useState } from 'react'
import { useRouter } from 'next/router'
import { observer } from 'mobx-react-lite'
import { Badge, Button, IconDownload } from 'ui'
import { PermissionAction } from '@supabase/shared-types/out/constants'

import { useStore, checkPermissions } from 'hooks'
import { API_URL, PROJECT_STATUS } from 'lib/constants'
import { post } from 'lib/common/fetch'
import { confirmAlert } from 'components/to-be-cleaned/ModalsDeprecated/ConfirmModal'

interface Props {
  projectRef: string
  backup: any
  index: number
}

const BackupItem: FC<Props> = ({ projectRef, backup, index }) => {
  const router = useRouter()
  const { app, ui } = useStore()

  const [isDownloading, setDownloading] = useState<boolean>(false)
  const [isRestoring, setRestoring] = useState<boolean>(false)

  const projectId = ui.selectedProject?.id ?? -1
  const canTriggerScheduledBackups = checkPermissions(
    PermissionAction.INFRA_EXECUTE,
    'queue_job.restore.prepare'
  )

  async function restore(backup: any) {
    setRestoring(true)
    try {
      post(`${API_URL}/database/${projectRef}/backups/restore`, backup).then(() => {
        setTimeout(() => {
          app.onProjectStatusUpdated(projectId, PROJECT_STATUS.RESTORING)
          ui.setNotification({
            category: 'success',
            message: `Restoring database back to ${dayjs(backup.inserted_at).format(
              'DD MMM YYYY HH:mm:ss'
            )}`,
          })
          router.push(`/project/${projectRef}`)
        }, 3000)
      })
    } catch (error) {
      ui.setNotification({
        error,
        category: 'error',
        message: `You do not have permission to restore from this backup`,
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
    } catch (error) {
      ui.setNotification({
        error,
        category: 'error',
        message: `You do not have permission to download this backup`,
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

export default observer(BackupItem)
